/**
 * Unit tests for TextRenderer
 * Tests cover:
 * 1. Rendering plain text content
 * 2. Formatting with pre tag
 * 3. Handling empty content
 */

import React from 'react';
import { render } from '@testing-library/react';
import { TextRenderer } from '../text-renderer';

describe('TextRenderer', () => {
  let renderer: TextRenderer;

  beforeEach(() => {
    renderer = new TextRenderer();
  });

  it('should render plain text content', () => {
    const content = 'This is plain text content.';
    const result = renderer.render(content);

    const { container } = render(<>{result}</>);
    const preElement = container.querySelector('pre');
    expect(preElement).toBeInTheDocument();
    expect(preElement).toHaveTextContent(content);
  });

  it('should preserve whitespace and line breaks', () => {
    const content = 'Line 1\nLine 2\nLine 3';
    const result = renderer.render(content);

    const { container } = render(<>{result}</>);
    const preElement = container.querySelector('pre');
    expect(preElement).toHaveTextContent(content);
    expect(preElement).toHaveClass('whitespace-pre-wrap');
  });

  it('should handle empty content', () => {
    const content = '';
    const result = renderer.render(content);

    const { container } = render(<>{result}</>);
    const preElement = container.querySelector('pre');
    expect(preElement).toBeInTheDocument();
    expect(preElement).toHaveTextContent('');
  });

  it('should apply correct CSS classes', () => {
    const content = 'Test content';
    const result = renderer.render(content);

    const { container } = render(<>{result}</>);
    const preElement = container.querySelector('pre');
    expect(preElement).toHaveClass('text-sm', 'font-mono', 'bg-muted/50', 'p-4', 'rounded-lg');
  });
});
