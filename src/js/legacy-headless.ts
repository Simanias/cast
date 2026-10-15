// A Cast speaker without a display still lays out and paints the now-playing screen:
// album art, a blurred drop shadow and a progress bar whose width is animated. On legacy
// firmware that keeps the CPU busy enough for playback to stutter, so once the device
// reports it has no display, the screen is hidden and the UI helpers from receiver.html
// stop updating it.
const UI_HELPERS = [
  "setNowPlaying",
  "setProgress",
  "setVolume",
  "setDebug",
  "setStatus",
  "setPlaybackState",
] as const;

let headless: boolean | null = null;

// the capabilities are only known once the Cast framework is up, so keep asking until
// the device has answered
function isHeadless(): boolean {
  if (headless !== null) {
    return headless;
  }
  try {
    const capabilities = (
      window as any
    ).cast?.framework?.CastReceiverContext?.getInstance?.()?.getDeviceCapabilities?.();
    if (capabilities && typeof capabilities.display_supported === "boolean") {
      headless = !capabilities.display_supported;
      if (headless) {
        document.body.style.display = "none";
        console.log(
          "Sendspin legacy: device has no display, now-playing screen skipped",
        );
      }
    }
  } catch {
    // framework not ready yet
  }
  return headless === true;
}

for (const name of UI_HELPERS) {
  const helper = (window as any)[name];
  if (typeof helper !== "function") {
    continue;
  }
  (window as any)[name] = function (this: unknown, ...args: unknown[]) {
    if (isHeadless()) {
      return;
    }
    return helper.apply(this, args);
  };
}
