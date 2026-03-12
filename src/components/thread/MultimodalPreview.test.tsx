import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MultimodalPreview } from "./MultimodalPreview";
import { MIME_TYPES } from "@/lib/multimodal-utils";
import React from "react";

// Mock next/image since it's hard to test in jsdom
vi.mock("next/image", () => ({
  default: ({ src, alt, className }: any) => (
    <img
      src={src}
      alt={alt}
      className={className}
    />
  ),
}));

describe("MultimodalPreview", () => {
  it("renders an image block correctly", () => {
    const block = {
      type: "image" as const,
      mimeType: MIME_TYPES.PNG,
      data: "base64data",
      metadata: { name: "test-image.png" },
    };

    render(<MultimodalPreview block={block} />);

    const img = screen.getByAltText("test-image.png");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", `data:${MIME_TYPES.PNG};base64,base64data`);
  });

  it("renders a PDF block correctly", () => {
    const block = {
      type: "file" as const,
      mimeType: MIME_TYPES.PDF,
      data: "base64data",
      metadata: { filename: "test-file.pdf" },
    };

    render(<MultimodalPreview block={block} />);

    expect(screen.getByText("test-file.pdf")).toBeInTheDocument();
  });

  it("renders unsupported file type correctly", () => {
    const block = {
      type: "file" as const,
      mimeType: "application/unknown",
      data: "base64data",
    };

    render(<MultimodalPreview block={block} />);

    expect(screen.getByText("Unsupported file type")).toBeInTheDocument();
  });
});
