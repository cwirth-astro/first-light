import { useCallback, useEffect, useState } from "react";

// Host permissions. Optional ones let the extension ask for a site only once a
// feature needs it; Firefox also lets users revoke the required ones, so the
// telescope cards check those too. Uses the WebExtensions permissions API
// (browser.* in Firefox and Safari, chrome.* in Chrome and Edge). Outside an
// extension, such as `npm run dev`, there is no API and every origin counts as
// granted.

interface PermissionsApi {
  contains(p: { origins: string[] }): Promise<boolean>;
  request(p: { origins: string[] }): Promise<boolean>;
  onAdded?: { addListener(fn: () => void): void; removeListener(fn: () => void): void };
  onRemoved?: { addListener(fn: () => void): void; removeListener(fn: () => void): void };
}

type ExtensionGlobal = { permissions?: PermissionsApi } | undefined;

function permissionsApi(): PermissionsApi | null {
  const g = globalThis as { browser?: ExtensionGlobal; chrome?: ExtensionGlobal };
  return g.browser?.permissions ?? g.chrome?.permissions ?? null;
}

// `granted` is null until checked. `request` must run from a click handler:
// browsers only show the permission prompt in response to a user gesture.
export function useOriginPermission(pattern: string): [granted: boolean | null, request: () => Promise<boolean>] {
  const [granted, setGranted] = useState<boolean | null>(null);

  const check = useCallback(() => {
    const api = permissionsApi();
    if (!api) return setGranted(true);
    api.contains({ origins: [pattern] }).then(setGranted, () => setGranted(false));
  }, [pattern]);

  useEffect(() => {
    check();
    // Picks up grants from another tab or from chrome://extensions.
    const api = permissionsApi();
    api?.onAdded?.addListener(check);
    api?.onRemoved?.addListener(check);
    return () => {
      api?.onAdded?.removeListener(check);
      api?.onRemoved?.removeListener(check);
    };
  }, [check]);

  const request = useCallback(async () => {
    const api = permissionsApi();
    const ok = api ? await api.request({ origins: [pattern] }).catch(() => false) : true;
    setGranted(ok);
    return ok;
  }, [pattern]);

  return [granted, request];
}
