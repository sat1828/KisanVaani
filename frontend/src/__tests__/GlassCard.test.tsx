import { render } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import GlassCard from '../components/GlassCard';

describe('GlassCard', () => {
  test('root element has the "group" class so group-hover children actually fire', () => {
    // Bug history: the shimmer overlay inside GlassCard uses
    // `group-hover:opacity-100`, a Tailwind utility that only activates
    // when an ANCESTOR has the literal class "group". The card's own
    // root div never had that class, so the hover effect was silently
    // dead code — it compiled fine and never visibly failed, it just
    // never did anything. This test pins the fix down so it can't
    // silently regress again.
    const { container } = render(<GlassCard>content</GlassCard>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('group');
  });

  test('renders children', () => {
    const { getByText } = render(<GlassCard>Hello world</GlassCard>);
    expect(getByText('Hello world')).toBeInTheDocument();
  });

  test('applies hero-glow class only when glow prop is true', () => {
    const { container: withGlow } = render(<GlassCard glow>x</GlassCard>);
    const { container: withoutGlow } = render(<GlassCard>x</GlassCard>);
    expect((withGlow.firstElementChild as HTMLElement).className).toContain('hero-glow');
    expect((withoutGlow.firstElementChild as HTMLElement).className).not.toContain('hero-glow');
  });
});
