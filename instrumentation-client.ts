type RouteTransitionWindow = Window & {
  __pulsaRouteTransition?: { startedAt: number; target: string };
};

export function onRouterTransitionStart(url: string) {
  (window as RouteTransitionWindow).__pulsaRouteTransition = {
    startedAt: performance.now(),
    target: url,
  };
}
