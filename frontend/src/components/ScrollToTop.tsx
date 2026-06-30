import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router does not reset scroll position on navigation by default —
 * a well-known SPA gotcha. Without this, navigating from the bottom of a
 * long page (e.g. Features) to another page lands the user mid-scroll on
 * the new page instead of at the top.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}
