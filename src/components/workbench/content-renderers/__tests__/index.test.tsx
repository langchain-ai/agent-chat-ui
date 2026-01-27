/**
 * Unit tests for Content Renderer Registry
 * Tests cover:
 * 1. Registry registration
 * 2. Renderer retrieval
 * 3. Content type checking
 * 4. Default renderer fallback
 */

import { contentRendererRegistry, ContentRenderer } from '../index';

// Import renderers to ensure they register
import '../markdown-renderer';
import '../architecture-renderer';
import '../text-renderer';
import '../binary-renderer';

describe('ContentRendererRegistry', () => {
  let testRenderer: ContentRenderer;

  beforeEach(() => {
    // Create a test renderer
    testRenderer = {
      render: jest.fn((content: string) => <div>{content}</div>),
    };
  });

  afterEach(() => {
    // Clear registry (note: in real usage, renderers persist)
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a renderer for a content type', () => {
      contentRendererRegistry.register('test-type', testRenderer);
      expect(contentRendererRegistry.has('test-type')).toBe(true);
    });

    it('should allow overwriting an existing renderer', () => {
      const renderer1 = { render: jest.fn() };
      const renderer2 = { render: jest.fn() };

      contentRendererRegistry.register('test-type', renderer1);
      contentRendererRegistry.register('test-type', renderer2);

      expect(contentRendererRegistry.get('test-type')).toBe(renderer2);
    });
  });

  describe('get', () => {
    it('should retrieve a registered renderer', () => {
      contentRendererRegistry.register('test-type', testRenderer);
      const retrieved = contentRendererRegistry.get('test-type');
      expect(retrieved).toBe(testRenderer);
    });

    it('should return undefined for unregistered content type', () => {
      const retrieved = contentRendererRegistry.get('unknown-type');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for registered content type', () => {
      contentRendererRegistry.register('test-type', testRenderer);
      expect(contentRendererRegistry.has('test-type')).toBe(true);
    });

    it('should return false for unregistered content type', () => {
      expect(contentRendererRegistry.has('unknown-type')).toBe(false);
    });
  });

  describe('getContentTypes', () => {
    it('should return all registered content types', () => {
      contentRendererRegistry.register('type1', testRenderer);
      contentRendererRegistry.register('type2', testRenderer);

      const types = contentRendererRegistry.getContentTypes();
      expect(types).toContain('type1');
      expect(types).toContain('type2');
    });
  });

  describe('default renderers', () => {
    it('should have markdown renderer registered', () => {
      expect(contentRendererRegistry.has('markdown')).toBe(true);
    });

    it('should have architecture renderer registered', () => {
      expect(contentRendererRegistry.has('architecture')).toBe(true);
    });

    it('should have text renderer registered', () => {
      expect(contentRendererRegistry.has('text')).toBe(true);
    });

    it('should have binary renderer registered', () => {
      expect(contentRendererRegistry.has('binary')).toBe(true);
    });
  });
});
