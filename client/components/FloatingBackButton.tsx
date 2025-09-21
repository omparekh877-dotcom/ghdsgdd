import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import BackButton from "@/components/BackButton";

export default function FloatingBackButton() {
  const location = useLocation();
  const path = location.pathname;
  const [hasInlineBackButton, setHasInlineBackButton] = useState(false);

  useEffect(() => {
    const update = () => setHasInlineBackButton(!!document.querySelector('[data-back-button]'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [path]);

  // Show on most feature pages, hide on landing/auth/root
  const shouldShowBase = (
    path.startsWith("/dashboard") ||
    path.startsWith("/sales") ||
    path.startsWith("/imports")
  ) && path !== "/dashboard";

  const shouldShow = shouldShowBase && !hasInlineBackButton;

  if (!shouldShow) return null;

  return (
    <div className="fixed left-4 z-50 md:hidden" style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}>
      <div className="rounded-full bg-white/90 backdrop-blur border shadow-lg">
        <BackButton showBreadcrumb={false} className="px-3 py-1" />
      </div>
    </div>
  );
}
