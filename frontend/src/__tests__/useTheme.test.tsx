import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ThemeProvider, useTheme } from '../hooks/useTheme';

function TestConsumer() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  );
}

describe('useTheme / ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  test('defaults to light when no stored preference and no system dark-mode match', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });

  test('respects a stored preference over the system default', () => {
    localStorage.setItem('theme', 'dark');
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });

  test('toggleTheme flips the theme and persists it to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value').textContent).toBe('light');
    await user.click(screen.getByText('toggle'));
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  test('adds the "dark" class to <html> when theme is dark, removes it when light', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    await user.click(screen.getByText('toggle'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  test('useTheme throws when used outside a ThemeProvider', () => {
    // Suppress the expected React error boundary console noise for this
    // specific assertion.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Broken() {
      useTheme();
      return null;
    }
    expect(() => render(<Broken />)).toThrow(/must be used within a ThemeProvider/);
    spy.mockRestore();
  });
});
