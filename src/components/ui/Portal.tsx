"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // When modal opens, we should prevent scrolling on the body
    document.body.style.overflow = "hidden";

    return () => {
      setMounted(false);
      document.body.style.overflow = "";
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="portal-root">{children}</div>,
    document.body,
  );
}
