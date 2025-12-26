import { useState, useEffect, ReactNode } from "react";

interface ClientOnlyProps {
  children: () => ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders fallback content until the component has mounted, then renders the result of calling the provided `children` function.
 *
 * @param children - A function that returns the content to render after the component has mounted.
 * @param fallback - Content to render before mounting; defaults to `null`.
 * @returns The fallback content before mounting, and the result of `children()` after mounting.
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children()}</>;
}