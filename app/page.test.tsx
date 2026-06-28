import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Home from './page';

// jsdom doesn't implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('Chat UI', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders initial welcome message', () => {
    render(<Home />);
    expect(
      screen.getByText("Hi there! I'm Sophia from Saltystaz Gurgaon. What's your name?")
    ).toBeInTheDocument();
  });

  it('renders input field and send button', () => {
    render(<Home />);
    expect(screen.getByLabelText('Message input')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('displays user messages in chronological order', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ sessionId: 'sess-1', reply: 'Hello Ravinder!' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<Home />);

    const input = screen.getByLabelText('Message input');
    const sendButton = screen.getByLabelText('Send message');

    fireEvent.change(input, { target: { value: 'Ravinder' } });
    fireEvent.click(sendButton);

    // User message should appear
    expect(screen.getByText('Ravinder')).toBeInTheDocument();

    // Wait for assistant reply
    await waitFor(() => {
      expect(screen.getByText('Hello Ravinder!')).toBeInTheDocument();
    });

    // Verify chronological order: welcome -> user -> assistant
    const messages = screen.getByRole('log');
    const allText = messages.textContent || '';
    const welcomeIndex = allText.indexOf('Welcome! Please tell me your name');
    const userIndex = allText.indexOf('Ravinder');
    const assistantIndex = allText.indexOf('Hello Ravinder!');

    expect(welcomeIndex).toBeLessThan(userIndex);
    expect(userIndex).toBeLessThan(assistantIndex);
  });

  it('shows loading indicator after sending a message', async () => {
    // Use a never-resolving promise to keep loading state active
    const mockFetch = vi.fn().mockReturnValue(new Promise(() => {}));
    vi.stubGlobal('fetch', mockFetch);

    render(<Home />);

    const input = screen.getByLabelText('Message input');
    const sendButton = screen.getByLabelText('Send message');

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    // Loading indicator should appear
    await waitFor(() => {
      expect(screen.getByLabelText('Assistant is typing')).toBeInTheDocument();
    });
  });

  it('handles API response and displays assistant reply', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sessionId: 'sess-1',
        reply: 'Welcome to Saltystaz Gurgaon, Ravinder!',
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<Home />);

    const input = screen.getByLabelText('Message input');
    fireEvent.change(input, { target: { value: 'Ravinder' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(
        screen.getByText('Welcome to Saltystaz Gurgaon, Ravinder!')
      ).toBeInTheDocument();
    });
  });

  it('displays error message when API returns an error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Something went wrong. Please try again.' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<Home />);

    const input = screen.getByLabelText('Message input');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(
        screen.getByText('Something went wrong. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('shows session initialization flow: name then welcome', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sessionId: 'sess-123',
        reply: 'Namaste Priya! Welcome to Saltystaz Gurgaon.',
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<Home />);

    // Initial prompt
    expect(
      screen.getByText("Hi there! I'm Sophia from Saltystaz Gurgaon. What's your name?")
    ).toBeInTheDocument();

    // User provides name
    const input = screen.getByLabelText('Message input');
    fireEvent.change(input, { target: { value: 'Priya' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    // Name appears as user message
    expect(screen.getByText('Priya')).toBeInTheDocument();

    // Wait for the welcome greeting from assistant
    await waitFor(() => {
      expect(
        screen.getByText('Namaste Priya! Welcome to Saltystaz Gurgaon.')
      ).toBeInTheDocument();
    });

    // Verify the API was called with the name
    expect(mockFetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: null, message: 'Priya' }),
    });
  });

  it('shows retry button on network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    render(<Home />);

    const input = screen.getByLabelText('Message input');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(
        screen.getByText('Unable to connect. Please check your connection and try again.')
      ).toBeInTheDocument();
    });

    // Retry button should be visible
    expect(screen.getByLabelText('Retry sending message')).toBeInTheDocument();
  });

  it('does not send empty or whitespace-only messages', () => {
    render(<Home />);

    const input = screen.getByLabelText('Message input');
    const sendButton = screen.getByLabelText('Send message');

    // Empty input — button should be disabled
    expect(sendButton).toBeDisabled();

    // Whitespace-only
    fireEvent.change(input, { target: { value: '   ' } });
    expect(sendButton).toBeDisabled();
  });
});
