"use client";

import { useEffect } from "react";
import { isLeavingNavigation, LEAVE_MESSAGE } from "@/lib/maps/leave-guard";

/**
 * Warns before the page is closed/refreshed (browser prompt) and before clicking an
 * in-app link away from the page (confirm dialog). Does nothing while `active` is false.
 */
export function useUnsavedChangesGuard(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ""; // required by some browsers to show the prompt
    };

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || !isLeavingNavigation(anchor, event, window.location.href)) return;
      if (!window.confirm(LEAVE_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation(); // capture phase: stops Next's <Link> from navigating
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [active]);
}