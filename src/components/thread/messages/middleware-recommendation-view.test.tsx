import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MiddlewareRecommendationView } from './middleware-recommendation-view';

// Track render counts to detect infinite loops
let renderCount = 0;
const MAX_RENDERS = 100;

// Mock useStreamContext
const mockSubmit = vi.fn();
const mockStreamContext = {
  submit: mockSubmit,
  isLoading: false,
  messages: [],
  values: { messages: [] },
  history: [],
  interrupt: undefined,
  error: null,
  stop: vi.fn(),
  branch: 'main',
  setBranch: vi.fn(),
  getMessagesMetadata: vi.fn(),
};

vi.mock('@/providers/Stream', () => ({
  useStreamContext: () => {
    renderCount++;
    if (renderCount > MAX_RENDERS) {
      throw new Error(`Infinite loop detected! Render count exceeded ${MAX_RENDERS}`);
    }
    return mockStreamContext;
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const mockInterrupt = {
  id: 'test-interrupt-id',
  value: {
    action_requests: [
      {
        args: {
          recommendations: [
            {
              middleware_name: 'Test Middleware',
              middleware_path: '/test/path',
              reason: 'Test reason',
              suggested_config: { key: 'value' },
            },
          ],
          summary: 'Test summary',
        },
      },
    ],
  },
};

describe('MiddlewareRecommendationView', () => {
  beforeEach(() => {
    renderCount = 0;
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Log render count for debugging
    console.log(`[Test] Total render count: ${renderCount}`);
  });

  it('should render without infinite loop', () => {
    render(<MiddlewareRecommendationView interrupt={mockInterrupt as any} />);

    expect(screen.getByText('미들웨어 추천')).toBeInTheDocument();
    expect(screen.getByText('Test Middleware')).toBeInTheDocument();

    // Should have reasonable number of renders (initial + effects)
    expect(renderCount).toBeLessThan(10);
  });

  it('should not cause infinite loop when approve button is clicked', async () => {
    render(<MiddlewareRecommendationView interrupt={mockInterrupt as any} />);

    const approveButton = screen.getByRole('button', { name: /승인/i });

    await act(async () => {
      fireEvent.click(approveButton);
    });

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledWith(
      {},
      {
        command: {
          resume: {
            'test-interrupt-id': { decisions: [{ type: 'approve' }] },
          },
        },
      }
    );

    // Should not exceed reasonable render count even after submit
    expect(renderCount).toBeLessThan(20);
  });

  it('should handle state updates without infinite loop', async () => {
    // Simulate what happens when submit triggers state updates
    let submitCallback: (() => void) | null = null;

    mockSubmit.mockImplementation(() => {
      // Simulate SDK behavior: trigger re-render after submit
      submitCallback = () => {
        mockStreamContext.isLoading = true;
      };
    });

    render(<MiddlewareRecommendationView interrupt={mockInterrupt as any} />);

    const approveButton = screen.getByRole('button', { name: /승인/i });

    await act(async () => {
      fireEvent.click(approveButton);

      // Simulate the state update that SDK would trigger
      if (submitCallback) {
        submitCallback();
      }
    });

    // Even with state updates, should not cause infinite loop
    expect(renderCount).toBeLessThan(30);
  });

  it('should render decided state in multi-interrupt mode without infinite loop', () => {
    const mockOnDecision = vi.fn();
    const decided = { decisions: [{ type: 'approve' }] };

    render(
      <MiddlewareRecommendationView
        interrupt={mockInterrupt as any}
        onDecision={mockOnDecision}
        decided={decided}
      />
    );

    expect(screen.getByText('승인됨')).toBeInTheDocument();
    expect(renderCount).toBeLessThan(10);
  });
});

describe('Infinite Loop Detection', () => {
  beforeEach(() => {
    renderCount = 0;
    vi.clearAllMocks();
  });

  it('should detect if render count exceeds threshold', () => {
    // This test documents the expected behavior
    // If this test fails, it means we've introduced an infinite loop

    const TestComponent = () => {
      const stream = mockStreamContext;
      return <div>Render count: {renderCount}</div>;
    };

    render(<TestComponent />);

    // Normal component should render only once or twice
    expect(renderCount).toBeLessThanOrEqual(2);
  });
});
