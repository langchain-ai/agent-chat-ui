import { describe, it, expect } from "vitest";
import {
  MIME_TYPES,
  SUPPORTED_FILE_TYPES,
  SUPPORTED_IMAGE_TYPES,
  isSupportedImageType,
  isSupportedFileType,
  isBase64ContentBlock,
} from "./multimodal-utils";

describe("multimodal-utils constants", () => {
  it("should have correct MIME_TYPES", () => {
    expect(MIME_TYPES.JPEG).toBe("image/jpeg");
    expect(MIME_TYPES.PNG).toBe("image/png");
    expect(MIME_TYPES.GIF).toBe("image/gif");
    expect(MIME_TYPES.WEBP).toBe("image/webp");
    expect(MIME_TYPES.PDF).toBe("application/pdf");
  });

  it("should have correct SUPPORTED_IMAGE_TYPES", () => {
    expect(SUPPORTED_IMAGE_TYPES).toContain(MIME_TYPES.JPEG);
    expect(SUPPORTED_IMAGE_TYPES).toContain(MIME_TYPES.PNG);
    expect(SUPPORTED_IMAGE_TYPES).toContain(MIME_TYPES.GIF);
    expect(SUPPORTED_IMAGE_TYPES).toContain(MIME_TYPES.WEBP);
    expect(SUPPORTED_IMAGE_TYPES.length).toBe(4);
  });

  it("should have correct SUPPORTED_FILE_TYPES", () => {
    expect(SUPPORTED_FILE_TYPES).toContain(MIME_TYPES.JPEG);
    expect(SUPPORTED_FILE_TYPES).toContain(MIME_TYPES.PDF);
    expect(SUPPORTED_FILE_TYPES.length).toBe(5);
  });
});

describe("multimodal-utils type guards", () => {
  it("isSupportedImageType should correctly identify images", () => {
    expect(isSupportedImageType(MIME_TYPES.JPEG)).toBe(true);
    expect(isSupportedImageType(MIME_TYPES.PNG)).toBe(true);
    expect(isSupportedImageType(MIME_TYPES.PDF)).toBe(false);
    expect(isSupportedImageType("text/plain")).toBe(false);
  });

  it("isSupportedFileType should correctly identify images and PDFs", () => {
    expect(isSupportedFileType(MIME_TYPES.JPEG)).toBe(true);
    expect(isSupportedFileType(MIME_TYPES.PDF)).toBe(true);
    expect(isSupportedFileType("text/plain")).toBe(false);
  });

  describe("isBase64ContentBlock", () => {
    it("identifies valid image blocks", () => {
      const block = {
        type: "image",
        mimeType: MIME_TYPES.PNG,
        data: "base64",
      };
      expect(isBase64ContentBlock(block)).toBe(true);
    });

    it("identifies valid legacy file blocks (PDF)", () => {
      const block = {
        type: "file",
        mimeType: MIME_TYPES.PDF,
        data: "base64",
      };
      expect(isBase64ContentBlock(block)).toBe(true);
    });

    it("rejects invalid types", () => {
      expect(isBase64ContentBlock(null)).toBe(false);
      expect(isBase64ContentBlock({})).toBe(false);
      expect(isBase64ContentBlock({ type: "text" })).toBe(false);
    });

    it("rejects unsupported mimeTypes", () => {
      const block = {
        type: "image",
        mimeType: "image/bmp",
        data: "base64",
      };
      expect(isBase64ContentBlock(block)).toBe(false);
    });
  });
});
