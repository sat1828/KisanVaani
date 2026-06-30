import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import DemoChat, { DemoChatHandle } from '../components/DemoChat';
import * as api from '../utils/api';

vi.mock('../utils/api', async () => {
  const actual = await vi.importActual<typeof api>('../utils/api');
  return {
    ...actual,
    sendChatMessage: vi.fn(),
    uploadImage: vi.fn(),
  };
});

describe('DemoChat imperative handle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('setInputText updates the actual React-controlled textarea value, not just the DOM', async () => {
    // This test exists specifically because the previous implementation
    // (in Demo.tsx) set `textarea.value` directly via the DOM and
    // dispatched a plain `Event('input')`, which does NOT reliably
    // update React's controlled-input state (a well-known React/DOM
    // gotcha around the native value setter). That bug meant clicking a
    // "Try Saying..." suggestion could visually show text in the box
    // while the component's actual `input` state remained empty —
    // pressing Send would then submit nothing. This test exercises the
    // real fix: an imperative handle that goes through setState properly.
    const ref = createRef<DemoChatHandle>();
    render(<DemoChat ref={ref} />);

    const textarea = screen.getByPlaceholderText(/apni samasya/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe('');

    ref.current?.setInputText('Mere dhan ke patte peele ho rahe hain');

    // Must reflect in the actual rendered DOM value, proving React state
    // (not just a stray DOM mutation) was updated.
    expect(await screen.findByDisplayValue('Mere dhan ke patte peele ho rahe hain')).toBe(textarea);
  });

  test('send button is disabled when there is no text and no image', () => {
    render(<DemoChat />);
    const sendButton = screen.getByLabelText(/send message/i);
    expect(sendButton).toBeDisabled();
  });

  test('send button becomes enabled once text is typed', async () => {
    const user = userEvent.setup();
    render(<DemoChat />);

    const textarea = screen.getByPlaceholderText(/apni samasya/i);
    await user.type(textarea, 'Test message');

    const sendButton = screen.getByLabelText(/send message/i);
    expect(sendButton).not.toBeDisabled();
  });
});
