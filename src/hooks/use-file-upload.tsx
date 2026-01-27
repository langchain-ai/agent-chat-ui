import { useState, useRef, useEffect, ChangeEvent } from "react";
import { toast } from "sonner";
import { ContentBlock } from "@langchain/core/messages";
import { fileToContentBlock } from "@/lib/multimodal-utils";
import { useSession } from "next-auth/react";
import { getApiKey } from "@/lib/api-key";

// Image types that are processed as content blocks (inline in messages)
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// All other file types (PDFs, markdown, text files, etc.) are uploaded as documents
// No file type restrictions - allow all file types

// Document upload result from backend
export interface DocumentUploadResult {
  document_id: string;
  artifact_id?: string; // Unified naming (Issue #12)
  filename: string;
  mime_type: string;
  sha256: string;
  created_at: string;
}

// Folder upload result from backend (Issue #12)
export interface FolderUploadResult {
  artifacts: Array<{
    artifact_id: string;
    filename: string;
    status: "success" | "error";
    error?: string;
  }>;
  total: number;
  successful: number;
  failed: number;
}

interface UseFileUploadOptions {
  initialBlocks?: ContentBlock.Multimodal.Data[];
  apiUrl?: string;
  threadId?: string | null;
}

/**
 * Helper function to get the direct backend URL for file uploads.
 * Bypasses Next.js proxy which can't handle multipart/form-data.
 * 
 * This function ALWAYS returns a direct backend URL, never a proxy path.
 * For file uploads, we must bypass the Next.js proxy because it reads
 * the request body as text, which breaks multipart/form-data.
 */
function getDirectBackendUrl(apiUrl: string): string {
  console.log("[FileUpload] getDirectBackendUrl - Input:", apiUrl);
  
  // If apiUrl is already an absolute URL (starts with http:// or https://)
  // and it's not a proxy path, we can use it directly
  if (apiUrl.startsWith("http://") || apiUrl.startsWith("https://")) {
    // But if it's pointing to the frontend (reflexion-ui), we need to redirect to backend
    if (apiUrl.includes('reflexion-ui') || apiUrl.includes('/api')) {
      console.log("[FileUpload] getDirectBackendUrl - Absolute URL points to frontend/proxy, redirecting to backend");
      // Extract the backend URL from the frontend URL
      if (apiUrl.includes('railway.app')) {
        const backendUrl = "https://reflexion-staging.up.railway.app";
        console.log("[FileUpload] getDirectBackendUrl - Resolved to Railway backend:", backendUrl);
        return backendUrl;
      }
      // For localhost, replace the port
      const backendUrl = apiUrl.replace('reflexion-ui', 'reflexion').replace(':3000', ':8080').replace('/api', '');
      console.log("[FileUpload] getDirectBackendUrl - Resolved to localhost backend:", backendUrl);
      return backendUrl;
    }
    console.log("[FileUpload] getDirectBackendUrl - Absolute URL is already a backend URL, using as-is");
    return apiUrl;
  }
  
  // If apiUrl is relative (starts with / or /api), we MUST bypass the proxy
  // This is the most common case in production where apiUrl = "/api"
  if (apiUrl.startsWith("/") || apiUrl.startsWith("/api")) {
    console.log("[FileUpload] getDirectBackendUrl - Relative URL detected, MUST bypass proxy");
    
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const origin = window.location.origin;
      
      console.log("[FileUpload] getDirectBackendUrl - Environment:", {
        hostname,
        origin,
        isRailway: hostname.includes('railway.app') || hostname.includes('reflexion-ui') || hostname.includes('reflexion-staging'),
        isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1'
      });
      
      // Check for Railway staging (most common production case)
      if (hostname.includes('railway.app') || hostname.includes('reflexion-ui') || hostname.includes('reflexion-staging')) {
        const backendUrl = "https://reflexion-staging.up.railway.app";
        console.log("[FileUpload] getDirectBackendUrl - ✓ Detected Railway, using:", backendUrl);
        return backendUrl;
      }
      
      // Check for localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const backendUrl = "http://localhost:8080";
        console.log("[FileUpload] getDirectBackendUrl - ✓ Detected localhost, using:", backendUrl);
        return backendUrl;
      }
      
      // Fallback: try to construct from current origin
      const fallbackUrl = origin.replace('reflexion-ui', 'reflexion').replace(':3000', ':8080');
      console.warn("[FileUpload] getDirectBackendUrl - ⚠️ Unknown hostname, using fallback:", fallbackUrl);
      return fallbackUrl;
    } else {
      // Server-side: use environment variable or default
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://reflexion-staging.up.railway.app";
      console.log("[FileUpload] getDirectBackendUrl - Server-side, using:", backendUrl);
      return backendUrl;
    }
  }
  
  // If we get here, apiUrl is something unexpected
  // Default to Railway staging for safety
  console.warn("[FileUpload] getDirectBackendUrl - ⚠️ Unexpected apiUrl format:", apiUrl, "- defaulting to Railway staging");
  return "https://reflexion-staging.up.railway.app";
}

export function useFileUpload({
  initialBlocks = [],
  apiUrl = "http://localhost:8080",
  threadId = null,
}: UseFileUploadOptions = {}) {
  const { data: session } = useSession();
  // Separate images (content blocks) from PDFs (documents)
  const [contentBlocks, setContentBlocks] =
    useState<ContentBlock.Multimodal.Data[]>(
      initialBlocks.filter((b) => b.type === "image")
    );
  const [pendingDocuments, setPendingDocuments] = useState<File[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentUploadResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [folderUploading, setFolderUploading] = useState(false);
  const [folderUploadProgress, setFolderUploadProgress] = useState<{
    total: number;
    completed: number;
    failed: number;
  } | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);

  // Upload PDF to backend and get document_id
  const uploadDocument = async (file: File): Promise<DocumentUploadResult | null> => {
    try {
      console.log("[FileUpload] ===== uploadDocument START =====");
      console.log("[FileUpload] File:", { name: file.name, type: file.type, size: file.size });
      console.log("[FileUpload] Input apiUrl:", apiUrl);
      console.log("[FileUpload] Thread ID:", threadId);
      console.log("[FileUpload] Window location:", typeof window !== 'undefined' ? {
        hostname: window.location.hostname,
        origin: window.location.origin,
        href: window.location.href
      } : "server-side");
      
      const formData = new FormData();
      formData.append("file", file);
      if (threadId) {
        formData.append("thread_id", threadId);
      }

      // Build authentication headers
      const headers: Record<string, string> = {};
      
      // Prefer session token (fresh) over localStorage (potentially stale)
      const token = session?.user?.idToken || getApiKey();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        const tokenStr = String(token);
        console.log("[FileUpload] Auth token: Present (length:", tokenStr.length, ")");
      } else {
        console.warn("[FileUpload] ⚠️ No authentication token available");
      }
      
      // Add organization context if available
      const orgContext = typeof window !== 'undefined' ? localStorage.getItem('reflexion_org_context') : null;
      if (orgContext) {
        headers['X-Organization-Context'] = orgContext;
        console.log("[FileUpload] Organization context: Present");
      } else {
        console.log("[FileUpload] Organization context: Not set");
      }

      // For file uploads, we need to call the backend directly, not through Next.js proxy
      // The Next.js proxy can't handle multipart/form-data file uploads
      // ALWAYS bypass proxy for file uploads to avoid issues
      const uploadApiUrl = getDirectBackendUrl(apiUrl);
      const uploadUrl = `${uploadApiUrl}/documents/upload`;
      
      console.log("[FileUpload] 🔄 URL Resolution:");
      console.log("[FileUpload]   - Original apiUrl:", apiUrl);
      console.log("[FileUpload]   - Resolved backend URL:", uploadApiUrl);
      console.log("[FileUpload]   - Final upload URL:", uploadUrl);
      console.log("[FileUpload]   - Proxy bypass:", apiUrl !== uploadApiUrl ? "YES ✓" : "NO (same URL)");
      console.log("[FileUpload] Request headers:", Object.keys(headers));
      
      const requestStartTime = Date.now();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers,
        body: formData,
      });
      const requestDuration = Date.now() - requestStartTime;
      
      console.log("[FileUpload] Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration: `${requestDuration}ms`,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Could not read error response");
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "Upload failed" };
        }
        console.error("[FileUpload] ❌ Upload failed:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || errorData.detail || `Upload failed: ${response.statusText}`);
      }

      const result: DocumentUploadResult = await response.json();
      // Support both document_id and artifact_id (Issue #12)
      if (result.artifact_id && !result.document_id) {
        result.document_id = result.artifact_id;
      }
      
      console.log("[FileUpload] ✅ Upload successful:", {
        document_id: result.document_id,
        artifact_id: result.artifact_id,
        filename: result.filename
      });
      console.log("[FileUpload] ===== uploadDocument END =====");
      
      return result;
    } catch (error) {
      console.error("[FileUpload] ❌ Document upload failed:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        file: file.name
      });
      toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
      return null;
    }
  };

  // Upload folder (multiple files or zip) to backend (Issue #12 - Phase 2)
  const uploadFolder = async (
    files: File[] | null,
    zipFile: File | null
  ): Promise<FolderUploadResult | null> => {
    try {
      console.log("[FileUpload] ===== uploadFolder START =====");
      console.log("[FileUpload] Input:", {
        zipFile: zipFile ? { name: zipFile.name, size: zipFile.size, type: zipFile.type } : null,
        filesCount: files?.length || 0,
        files: files?.map(f => ({ name: f.name, size: f.size, type: f.type })) || []
      });
      console.log("[FileUpload] Input apiUrl:", apiUrl);
      console.log("[FileUpload] Thread ID:", threadId);
      console.log("[FileUpload] Window location:", typeof window !== 'undefined' ? {
        hostname: window.location.hostname,
        origin: window.location.origin,
        href: window.location.href
      } : "server-side");
      
      const formData = new FormData();
      
      if (zipFile) {
        console.log("[FileUpload] Adding zip file:", zipFile.name, "Size:", zipFile.size);
        formData.append("zip_file", zipFile);
      } else if (files && files.length > 0) {
        console.log("[FileUpload] Adding", files.length, "file(s)");
        files.forEach((file) => {
          formData.append("files", file);
        });
      } else {
        throw new Error("No files provided");
      }

      if (threadId) {
        formData.append("thread_id", threadId);
      }

      // Build authentication headers
      const headers: Record<string, string> = {};
      
      const token = session?.user?.idToken || getApiKey();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        const tokenStr = String(token);
        console.log("[FileUpload] Auth token: Present (length:", tokenStr.length, ")");
      } else {
        console.warn("[FileUpload] ⚠️ No authentication token available for folder upload");
      }
      
      const orgContext = typeof window !== 'undefined' ? localStorage.getItem('reflexion_org_context') : null;
      if (orgContext) {
        headers['X-Organization-Context'] = orgContext;
        console.log("[FileUpload] Organization context: Present");
      } else {
        console.log("[FileUpload] Organization context: Not set");
      }

      setFolderUploading(true);
      setFolderUploadProgress({ total: files?.length || 1, completed: 0, failed: 0 });

      // For file uploads, we need to call the backend directly, not through Next.js proxy
      // The Next.js proxy can't handle multipart/form-data file uploads
      const uploadApiUrl = getDirectBackendUrl(apiUrl);
      const uploadUrl = `${uploadApiUrl}/artifacts/upload-folder`;
      
      console.log("[FileUpload] 🔄 URL Resolution:");
      console.log("[FileUpload]   - Original apiUrl:", apiUrl);
      console.log("[FileUpload]   - Resolved backend URL:", uploadApiUrl);
      console.log("[FileUpload]   - Final upload URL:", uploadUrl);
      console.log("[FileUpload]   - Proxy bypass:", apiUrl !== uploadApiUrl ? "YES ✓" : "NO (same URL)");
      console.log("[FileUpload] Request headers:", Object.keys(headers));
      
      const requestStartTime = Date.now();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers,
        body: formData,
      });
      const requestDuration = Date.now() - requestStartTime;
      
      console.log("[FileUpload] Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration: `${requestDuration}ms`,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Could not read error response");
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "Upload failed" };
        }
        console.error("[FileUpload] ❌ Folder upload failed:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || errorData.detail || `Upload failed: ${response.statusText}`);
      }

      const result: FolderUploadResult = await response.json();
      
      setFolderUploadProgress({
        total: result.total,
        completed: result.successful,
        failed: result.failed,
      });

      console.log("[FileUpload] ✅ Folder upload successful:", {
        total: result.total,
        successful: result.successful,
        failed: result.failed,
        artifacts: result.artifacts.length
      });
      console.log("[FileUpload] ===== uploadFolder END =====");

      return result;
    } catch (error) {
      console.error("[FileUpload] ❌ Folder upload failed:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        zipFile: zipFile?.name,
        filesCount: files?.length
      });
      toast.error(`Failed to upload folder: ${error instanceof Error ? error.message : "Unknown error"}`);
      return null;
    } finally {
      setFolderUploading(false);
      // Clear progress after a delay
      setTimeout(() => setFolderUploadProgress(null), 3000);
    }
  };

  const isDuplicate = (file: File) => {
    if (file.type === "application/pdf") {
      return pendingDocuments.some((f) => f.name === file.name) ||
             uploadedDocuments.some((d) => d.filename === file.name);
    }
    if (SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return contentBlocks.some(
        (b) =>
          b.type === "image" &&
          b.metadata?.name === file.name &&
          b.mimeType === file.type,
      );
    }
    return false;
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    console.log("[FileUpload] handleFileUpload called");
    const files = e.target.files;
    if (!files) {
      console.log("[FileUpload] No files in event");
      return;
    }
    const fileArray = Array.from(files);
    console.log("[FileUpload] Files selected:", fileArray.map(f => ({ name: f.name, type: f.type, size: f.size })));
    
    // No file type restrictions - accept all files
    const duplicateFiles = fileArray.filter(isDuplicate);
    const uniqueFiles = fileArray.filter((file) => !isDuplicate(file));
    console.log("[FileUpload] Unique files to process:", uniqueFiles.length);

    if (duplicateFiles.length > 0) {
      toast.error(
        `Duplicate file(s) detected: ${duplicateFiles.map((f) => f.name).join(", ")}. Each file can only be uploaded once per message.`,
      );
    }

    // Separate images (content blocks) from documents (everything else)
    const imageFiles = uniqueFiles.filter((f) => SUPPORTED_IMAGE_TYPES.includes(f.type));
    const documentFiles = uniqueFiles.filter((f) => !SUPPORTED_IMAGE_TYPES.includes(f.type));
    console.log("[FileUpload] Image files:", imageFiles.length, "Document files:", documentFiles.length);

    // Process images as content blocks (existing behavior)
    if (imageFiles.length > 0) {
      console.log("[FileUpload] Processing", imageFiles.length, "image(s) as content blocks");
      const newBlocks = await Promise.all(imageFiles.map(fileToContentBlock));
      setContentBlocks((prev) => [...prev, ...newBlocks]);
    }

    // Upload documents (PDFs, markdown, text files, etc.) to backend
    if (documentFiles.length > 0) {
      console.log("[FileUpload] Starting upload for", documentFiles.length, "document file(s)");
      setUploading(true);
      setPendingDocuments((prev) => [...prev, ...documentFiles]);
      
      try {
        const uploadResults = await Promise.all(
          documentFiles.map((file) => uploadDocument(file))
        );
        
        const successful = uploadResults.filter((r): r is DocumentUploadResult => r !== null);
        if (successful.length > 0) {
          setUploadedDocuments((prev) => [...prev, ...successful]);
          toast.success(`Uploaded ${successful.length} document(s)`);
        }
        
        // Remove successfully uploaded files from pending
        setPendingDocuments((prev) =>
          prev.filter((f) => !documentFiles.some((df) => df.name === f.name))
        );
      } catch (error) {
        console.error("[FileUpload] Error uploading documents:", error);
      } finally {
        setUploading(false);
      }
    }

    e.target.value = "";
  };

  // Drag and drop handlers
  useEffect(() => {
    if (!dropRef.current) return;

    // Global drag events with counter for robust dragOver state
    const handleWindowDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        dragCounter.current += 1;
        setDragOver(true);
      }
    };
    const handleWindowDragLeave = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        dragCounter.current -= 1;
        if (dragCounter.current <= 0) {
          setDragOver(false);
          dragCounter.current = 0;
        }
      }
    };
    const handleWindowDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setDragOver(false);

      if (!e.dataTransfer) return;

      const files = Array.from(e.dataTransfer.files);
      // No file type restrictions - accept all files
      const duplicateFiles = files.filter(isDuplicate);
      const uniqueFiles = files.filter((file) => !isDuplicate(file));

      if (duplicateFiles.length > 0) {
        toast.error(
          `Duplicate file(s) detected: ${duplicateFiles.map((f) => f.name).join(", ")}. Each file can only be uploaded once per message.`,
        );
      }

      // Separate images (content blocks) from documents (everything else)
      const imageFiles = uniqueFiles.filter((f) => SUPPORTED_IMAGE_TYPES.includes(f.type));
      const documentFiles = uniqueFiles.filter((f) => !SUPPORTED_IMAGE_TYPES.includes(f.type));

      // Process images as content blocks
      if (imageFiles.length > 0) {
        const newBlocks = await Promise.all(imageFiles.map(fileToContentBlock));
        setContentBlocks((prev) => [...prev, ...newBlocks]);
      }

      // Upload documents (PDFs, markdown, text files, etc.) to backend
      if (documentFiles.length > 0) {
        setUploading(true);
        setPendingDocuments((prev) => [...prev, ...documentFiles]);
        
        try {
          const uploadResults = await Promise.all(
            documentFiles.map((file) => uploadDocument(file))
          );
          
          const successful = uploadResults.filter((r): r is DocumentUploadResult => r !== null);
          if (successful.length > 0) {
            setUploadedDocuments((prev) => [...prev, ...successful]);
            toast.success(`Uploaded ${successful.length} document(s)`);
          }
          
          setPendingDocuments((prev) => 
            prev.filter((f) => !documentFiles.some((df) => df.name === f.name))
          );
        } catch (error) {
          console.error("[FileUpload] Error uploading documents:", error);
        } finally {
          setUploading(false);
        }
      }
    };
    const handleWindowDragEnd = (e: DragEvent) => {
      dragCounter.current = 0;
      setDragOver(false);
    };
    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("drop", handleWindowDrop);
    window.addEventListener("dragend", handleWindowDragEnd);

    // Prevent default browser behavior for dragover globally
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("dragover", handleWindowDragOver);

    // Remove element-specific drop event (handled globally)
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(true);
    };
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
    };
    const element = dropRef.current;
    element.addEventListener("dragover", handleDragOver);
    element.addEventListener("dragenter", handleDragEnter);
    element.addEventListener("dragleave", handleDragLeave);

    return () => {
      element.removeEventListener("dragover", handleDragOver);
      element.removeEventListener("dragenter", handleDragEnter);
      element.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("drop", handleWindowDrop);
      window.removeEventListener("dragend", handleWindowDragEnd);
      window.removeEventListener("dragover", handleWindowDragOver);
      dragCounter.current = 0;
    };
  }, [contentBlocks]);

  const removeBlock = (idx: number) => {
    setContentBlocks((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeDocument = (documentId: string) => {
    setUploadedDocuments((prev) => prev.filter((d) => d.document_id !== documentId));
  };

  const resetBlocks = () => {
    setContentBlocks([]);
    setUploadedDocuments([]);
    setPendingDocuments([]);
  };

  /**
   * Handle paste event for files (images, PDFs)
   * Can be used as onPaste={handlePaste} on a textarea or input
   */
  const handlePaste = async (
    e: React.ClipboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const items = e.clipboardData.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length === 0) {
      return;
    }
    e.preventDefault();
    // No file type restrictions - accept all files
    const duplicateFiles = files.filter(isDuplicate);
    const uniqueFiles = files.filter((file) => !isDuplicate(file));
    
    if (duplicateFiles.length > 0) {
      toast.error(
        `Duplicate file(s) detected: ${duplicateFiles.map((f) => f.name).join(", ")}. Each file can only be uploaded once per message.`,
      );
    }

    // Separate images (content blocks) from documents (everything else)
    const imageFiles = uniqueFiles.filter((f) => SUPPORTED_IMAGE_TYPES.includes(f.type));
    const documentFiles = uniqueFiles.filter((f) => !SUPPORTED_IMAGE_TYPES.includes(f.type));

    // Process images as content blocks
    if (imageFiles.length > 0) {
      const newBlocks = await Promise.all(imageFiles.map(fileToContentBlock));
      setContentBlocks((prev) => [...prev, ...newBlocks]);
    }

    // Upload documents (PDFs, markdown, text files, etc.) to backend
    if (documentFiles.length > 0) {
      setUploading(true);
      setPendingDocuments((prev) => [...prev, ...documentFiles]);
      
      try {
        const uploadResults = await Promise.all(
          documentFiles.map((file) => uploadDocument(file))
        );
        
        const successful = uploadResults.filter((r): r is DocumentUploadResult => r !== null);
        if (successful.length > 0) {
          setUploadedDocuments((prev) => [...prev, ...successful]);
          toast.success(`Uploaded ${successful.length} document(s)`);
        }
        
        setPendingDocuments((prev) => 
          prev.filter((f) => !documentFiles.some((df) => df.name === f.name))
        );
      } catch (error) {
        console.error("[FileUpload] Error uploading documents:", error);
      } finally {
        setUploading(false);
      }
    }
  };

  return {
    contentBlocks,
    setContentBlocks,
    pendingDocuments,
    uploadedDocuments,
    uploading,
    folderUploading,
    folderUploadProgress,
    handleFileUpload,
    uploadFolder,
    dropRef,
    removeBlock,
    removeDocument,
    resetBlocks,
    dragOver,
    handlePaste,
  };
}
