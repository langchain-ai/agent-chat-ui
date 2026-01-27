/**
 * Unit tests for MarkdownRenderer
 * Tests cover:
 * 1. Rendering markdown content
 * 2. Integration with MarkdownText component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from '../markdown-renderer';

// Mock MarkdownText component
jest.mock('@/components/thread/markdown-text', () => ({
  MarkdownText: ({ children }: { children: string }) => (
    <div data-testid="markdown-text">{children}</div>
  ),
}));

describe('MarkdownRenderer', () => {
  let renderer: MarkdownRenderer;

  beforeEach(() => {
    renderer = new MarkdownRenderer();
  });

  it('should render markdown content', () => {
    const content = '# Heading\n\nThis is markdown content.';
    const result = renderer.render(content);

    const { container } = render(<>{result}</>);
    expect(container.querySelector('[data-testid="markdown-text"]')).toBeInTheDocument();
  });

  it('should pass content to MarkdownText component', () => {
    const content = '# Test Heading\n\nTest content.';
    const result = renderer.render(content);

    render(<>{result}</>);
    expect(screen.getByTestId('markdown-text')).toHaveTextContent(content);
  });

  it('should handle empty content', () => {
    const content = '';
    const result = renderer.render(content);

    const { container } = render(<>{result}</>);
    expect(container.querySelector('[data-testid="markdown-text"]')).toBeInTheDocument();
  });

  it('should handle metadata parameter (ignored for markdown)', () => {
    const content = '# Heading';
    const metadata = { filename: 'test.md' };
    const result = renderer.render(content, metadata);

    const { container } = render(<>{result}</>);
    expect(container.querySelector('[data-testid="markdown-text"]')).toBeInTheDocument();
  });
});
