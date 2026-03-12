import { describe, it, expect } from "vitest";
import {
  MIME_TYPES,
  SUPPORTED_FILE_TYPES,
  SUPPORTED_IMAGE_TYPES,
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
