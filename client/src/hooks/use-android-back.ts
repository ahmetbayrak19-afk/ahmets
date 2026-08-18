import { useEffect } from "react";

declare global {
  interface Window {
    AndroidNavigation?: {
      moveToBackground: () => void;
    };
  }
}

const ROOT_PATHS = new Set(["/", "/login", "/home"]);
const HOME_EXIT_CONFIRMATION_MS = 2000;
let lastHomeBackPressAt = 0;

function isVisible(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    Number(style.opacity) > 0 &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function isEnabled(element: HTMLElement) {
  return !(element instanceof HTMLButtonElement && element.disabled);
}

function highestZIndex(element: HTMLElement) {
  let highest = 0;
  let current: HTMLElement | null = element;

  while (current) {
    const zIndex = Number.parseInt(window.getComputedStyle(current).zIndex, 10);
    if (Number.isFinite(zIndex)) highest = Math.max(highest, zIndex);
    current = current.parentElement;
  }

  return highest;
}

function findBackButton() {
  const clickableSelector = "button, a, [role='button']";
  const visibleDialogs = Array.from(
    document.querySelectorAll<HTMLElement>("[role='dialog']"),
  ).filter(isVisible);
  const searchRoot: ParentNode = visibleDialogs.at(-1) ?? document;

  const clickables = Array.from(
    searchRoot.querySelectorAll<HTMLElement>(clickableSelector),
  ).filter((element) => isVisible(element) && isEnabled(element));

  const explicitlyMarked = clickables.filter((element) =>
    element.hasAttribute("data-android-back"),
  );
  const labelledBackButtons = clickables.filter((element) => {
    const label = element.getAttribute("aria-label")?.trim().toLocaleLowerCase("tr-TR");
    return label === "kapat" || label === "geri dön" || label === "değerlendirmeyi kapat";
  });
  const arrowButtons = clickables.filter((element) =>
    element.querySelector(".lucide-arrow-left"),
  );
  const topCloseButtons = clickables.filter((element) => {
    const hasCloseIcon = Boolean(
      element.querySelector(".lucide-x, .lucide-x-circle, .lucide-circle-x"),
    );
    return hasCloseIcon && element.getBoundingClientRect().top < 140;
  });
  const iconButtons = Array.from(new Set([...arrowButtons, ...topCloseButtons]));
  const candidates =
    explicitlyMarked.length > 0
      ? explicitlyMarked
      : labelledBackButtons.length > 0
        ? labelledBackButtons
        : iconButtons;

  // Tam ekran oyun/modaller alttaki menünün üzerinde olabilir. Önce en üst katmandaki,
  // sonra öğretmenin gördüğü en üstteki düğmeyi seç.
  return candidates.sort((first, second) => {
    const zIndexDifference = highestZIndex(second) - highestZIndex(first);
    if (zIndexDifference !== 0) return zIndexDifference;

    const firstRect = first.getBoundingClientRect();
    const secondRect = second.getBoundingClientRect();
    return firstRect.top - secondRect.top || firstRect.left - secondRect.left;
  })[0];
}

function currentPath() {
  return window.location.hash.replace(/^#/, "").split("?")[0] || "/";
}

export function useAndroidBack() {
  useEffect(() => {
    const handleAndroidBack = () => {
      const backButton = findBackButton();

      if (backButton) {
        backButton.click();
        return;
      }

      const path = currentPath();

      if (path === "/home") {
        const now = Date.now();
        if (now - lastHomeBackPressAt <= HOME_EXIT_CONFIRMATION_MS) {
          lastHomeBackPressAt = 0;
          window.AndroidNavigation?.moveToBackground();
          return;
        }

        lastHomeBackPressAt = now;
        window.dispatchEvent(new CustomEvent("androidExitWarning"));
        return;
      }

      lastHomeBackPressAt = 0;
      if (ROOT_PATHS.has(path)) {
        window.AndroidNavigation?.moveToBackground();
        return;
      }

      window.history.back();
    };

    window.addEventListener("androidBackButton", handleAndroidBack);
    return () => window.removeEventListener("androidBackButton", handleAndroidBack);
  }, []);
}
