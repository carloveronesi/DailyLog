export function getDesktopBridge() {
  if (window.dailylogDesktop && window.dailylogDesktop.isDesktop) return window.dailylogDesktop;
  return null;
}

export function isDesktopRuntime() {
  return Boolean(getDesktopBridge());
}
