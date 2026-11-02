export const LEAVE_MESSAGE = "You have unsaved changes to this map. Leave without saving?";

type ClickLike = { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; defaultPrevented: boolean };
type AnchorLike = { href: string; target?: string; hasAttribute?: (name: string) => boolean };

/** True when a click on this link would navigate away from the current page inside the app. */
export function isLeavingNavigation(anchor: AnchorLike, click: ClickLike, currentHref: string): boolean {
  if (click.defaultPrevented || click.button !== 0) return false;
  if (click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return false; // opens elsewhere
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute?.("download")) return false;
  let to: URL;
  let from: URL;
  try {
    to = new URL(anchor.href);
    from = new URL(currentHref);
  } catch {
    return false;
  }
  if (to.origin !== from.origin) return false; // external links are covered by beforeunload
  return to.pathname !== from.pathname || to.search !== from.search;
}