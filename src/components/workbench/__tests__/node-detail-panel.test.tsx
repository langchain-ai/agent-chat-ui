/**
 * Unit tests for NodeDetailPanel
 * Tests cover:
 * 1. Component rendering
 * 2. Content fetching
 * 3. Renderer selection
 * 4. Version history
 * 5. Error handling
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { NodeDetailPanel } from '../node-detail-panel';
import { contentRendererRegistry } from '../content-renderers';

// Mock fetch
global.fetch = jest.fn();

// Mock content renderers
jest.mock('../content-renderers', () => ({
  contentRendererRegistry: {
    get: jest.fn(),
  },
}));

// Mock MarkdownText
jest.mock('@/components/thread/markdown-text', () => ({
  MarkdownText: ({ children }: { children: string }) => (
    <div data-testid="markdown-text">{children}</div>
  ),
}));

describe('NodeDetailPanel', () => {
  const mockNode = {
    id: 'test-node-123',
    name: 'Test Node',
    type: 'ARTIFACT',
    description: 'Test description',
    properties: {
      section: '1',
      category: 'Test',
    },
  };

  const mockRenderer = {
    render: jest.fn((content: string) => <div data-testid="rendered-content">{content}</div>),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (contentRendererRegistry.get as jest.Mock).mockReturnValue(mockRenderer);
    localStorage.clear();
  });

  it('should render nothing when node is null', () => {
    const { container } = render(
      <NodeDetailPanel node={null} onClose={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render node header', () => {
    render(<NodeDetailPanel node={mockNode} onClose={jest.fn()} />);
    expect(screen.getByText('Test Node')).toBeInTheDocument();
    expect(screen.getByText(/Artifact/i)).toBeInTheDocument();
  });

  it('should show loading state while fetching content', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ ok: true, json: async () => ({ content: 'test', content_type: 'text' }) }), 100)
        )
    );

    render(<NodeDetailPanel node={mockNode} onClose={jest.fn()} />);
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loader2 has role="status"
  });

  it('should fetch and render content', async () => {
    const mockContent = {
      content: 'Test content',
      content_type: 'text',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContent,
    });

    render(<NodeDetailPanel node={mockNode} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/artifact/content?node_id=test-node-123'),
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(mockRenderer.render).toHaveBeenCalledWith('Test content', undefined);
    });
  });

  it('should handle fetch errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<NodeDetailPanel node={mockNode} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('should handle non-ok responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    render(<NodeDetailPanel node={mockNode} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch content/i)).toBeInTheDocument();
    });
  });

  it('should select correct renderer based on content_type', async () => {
    const mockContent = {
      content: '# Architecture',
      content_type: 'architecture',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContent,
    });

    const architectureRenderer = {
      render: jest.fn((content: string) => <div>{content}</div>),
    };
    (contentRendererRegistry.get as jest.Mock).mockReturnValue(architectureRenderer);

    render(<NodeDetailPanel node={mockNode} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(contentRendererRegistry.get).toHaveBeenCalledWith('architecture');
      expect(architectureRenderer.render).toHaveBeenCalled();
    });
  });

  it('should fetch artifact history for ARTIFACT nodes', async () => {
    const mockContent = {
      content: 'Test',
      content_type: 'text',
    };

    const mockHistory = {
      versions: [
        { id: 'v1', timestamp: '2024-01-01' },
        { id: 'v2', timestamp: '2024-01-02' },
      ],
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockContent,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      });

    render(<NodeDetailPanel node={mockNode} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/artifact/history?node_id=test-node-123'),
        expect.any(Object)
      );
    });
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<NodeDetailPanel node={mockNode} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    closeButton.click();

    expect(onClose).toHaveBeenCalled();
  });

  it('should display node properties', async () => {
    const mockContent = {
      content: 'Test',
      content_type: 'text',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContent,
    });

    render(<NodeDetailPanel node={mockNode} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('section')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });
});
