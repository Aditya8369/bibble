import { describe, expect, it } from "vitest";
import { isLeavingNavigation } from "./leave-guard";

const click = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false };
const here = "https://bibble.app/map/abc/edit";

describe("isLeavingNavigation", () => {
  it("flags a plain click to another page", () => {
    expect(isLeavingNavigation({ href: "https://bibble.app/explore" }, click, here)).toBe(true);
  });
  it("ignores links to the same page and hash-only links", () => {
    expect(isLeavingNavigation({ href: here }, click, here)).toBe(false);
    expect(isLeavingNavigation({ href: `${here}#top` }, click, here)).toBe(false);
  });
  it("ignores new-tab clicks and modified clicks", () => {
    expect(isLeavingNavigation({ href: "https://bibble.app/explore", target: "_blank" }, click, here)).toBe(false);
    expect(isLeavingNavigation({ href: "https://bibble.app/explore" }, { ...click, ctrlKey: true }, here)).toBe(false);
    expect(isLeavingNavigation({ href: "https://bibble.app/explore" }, { ...click, metaKey: true }, here)).toBe(false);
  });
  it("ignores right clicks, handled clicks, downloads and other origins", () => {
    expect(isLeavingNavigation({ href: "https://bibble.app/explore" }, { ...click, button: 2 }, here)).toBe(false);
    expect(isLeavingNavigation({ href: "https://bibble.app/explore" }, { ...click, defaultPrevented: true }, here)).toBe(false);
    expect(isLeavingNavigation({ href: "https://bibble.app/x.csv", hasAttribute: (n) => n === "download" }, click, here)).toBe(false);
    expect(isLeavingNavigation({ href: "https://example.com/" }, click, here)).toBe(false);
  });
});