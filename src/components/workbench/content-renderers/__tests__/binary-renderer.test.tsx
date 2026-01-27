/**
 * Unit tests for BinaryRenderer
 * Tests cover:
 * 1. Rendering binary file information
 * 2. Download link generation
 * 3. Metadata handling
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BinaryRenderer } from '../binary-renderer';

describe('BinaryRenderer', () => {
  let renderer: BinaryRenderer;

  beforeEach(() => {
    renderer = new BinaryRenderer();
  });

  it('should render binary file information', () => {
    const content = 'base64encodedcontent';
    const metadata = {
      filename: 'document.pdf',
      mime_type: 'application/pdf',
    };

    const result = renderer.render(content, metadata);

    render(<>{result}</>);
    expect(screen.getByText(/Binary file: document.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/Type: application\/pdf/i)).toBeInTheDocument();
  });

  it('should show download link for base64 content', () => {
    const content = 'dGVzdCBjb250ZW50'; // base64 for "test content"
    const metadata = {
      filename: 'file.pdf',
      mime_type: 'application/pdf',
    };

    const result = renderer.render(content, metadata);

    render(<>{result}</>);
    const downloadLink = screen.getByText(/Download File/i);
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink.closest('a')).toHaveAttribute('download', 'file.pdf');
  });

  it('should handle missing filename', () => {
    const content = 'base64content';
    const metadata = {
      mime_type: 'application/pdf',
    };

    const result = renderer.render(content, metadata);

    render(<>{result}</>);
    expect(screen.getByText(/Binary file: file/i)).toBeInTheDocument();
  });

  it('should handle missing mime_type', () => {
    const content = 'base64content';
    const metadata = {
      filename: 'document.pdf',
    };

    const result = renderer.render(content, metadata);

    render(<>{result}</>);
    expect(screen.getByText(/Type: application\/octet-stream/i)).toBeInTheDocument();
  });

  it('should handle missing metadata', () => {
    const content = 'base64content';
    const result = renderer.render(content);

    render(<>{result}</>);
    expect(screen.getByText(/Binary file: file/i)).toBeInTheDocument();
  });
});
