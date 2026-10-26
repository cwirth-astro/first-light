// Cross-browser helpers for animating and light-dismissing a modal <dialog>.
// Chrome supports all of this natively; Firefox and Safari need the fallbacks.

let supportsDisplayTransition: boolean | undefined;

// Firefox parses `transition-behavior: allow-discrete` but doesn't transition
// `display`, so CSS.supports alone isn't enough. Probe an element instead.
function canTransitionDisplay(): boolean {
  if (supportsDisplayTransition !== undefined) return supportsDisplayTransition;
  if (!window.CSS?.supports?.("transition-behavior", "allow-discrete") || !document.body) return false;
  const probe = document.createElement("div");
  probe.style.cssText = "transition: display 1s allow-discrete !important; display: block;";
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = "none";
  supportsDisplayTransition = getComputedStyle(probe).display === "block";
  probe.remove();
  return supportsDisplayTransition;
}

function supportsTopLayerExit(): boolean {
  return !!window.CSS?.supports?.("overlay", "auto") && canTransitionDisplay();
}

// Close with an exit animation everywhere. Where the browser can't keep the
// dialog in the top layer while it animates out, play the exit via
// [data-closing] first and only close once the animations finish.
export async function closeTopLayer(dialog: HTMLDialogElement) {
  if (!supportsTopLayerExit()) {
    dialog.setAttribute("data-closing", "");
    const animations = dialog.getAnimations({ subtree: true });
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((r) => setTimeout(r, 2000)),
      ]);
    }
    if (!dialog.hasAttribute("data-closing")) return;
    dialog.removeAttribute("data-closing");
  }
  dialog.close();
}

// Wire up the fallbacks for one dialog; returns a cleanup function.
export function enhanceDialog(dialog: HTMLDialogElement): () => void {
  const controller = new AbortController();
  const { signal } = controller;

  // Route Esc (and native light dismiss) through closeTopLayer so the exit
  // animates in browsers that would otherwise close instantly.
  if (!supportsTopLayerExit()) {
    dialog.addEventListener(
      "cancel",
      (e) => {
        e.preventDefault();
        closeTopLayer(dialog);
      },
      { signal },
    );
  }

  // Light dismiss for browsers without <dialog closedby="any"> (Safari).
  // Test the pointer position, not event.target: the dialog is also the target
  // for its own padding. Require press and release outside, so a text
  // selection that ends on the backdrop doesn't dismiss.
  if (!("closedBy" in HTMLDialogElement.prototype)) {
    const outside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let pressedOutside = false;
    dialog.addEventListener("pointerdown", (e) => (pressedOutside = outside(e)), { signal });
    dialog.addEventListener(
      "pointerup",
      (e) => {
        if (pressedOutside && outside(e)) closeTopLayer(dialog);
      },
      { signal },
    );
  }

  return () => controller.abort();
}
