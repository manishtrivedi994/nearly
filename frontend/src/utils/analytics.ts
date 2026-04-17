import ReactGA from 'react-ga4';

const MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) ?? '';

export function initGA() {
  if (!MEASUREMENT_ID) return;
  ReactGA.initialize(MEASUREMENT_ID);
}

export function trackPageView(path: string) {
  if (!MEASUREMENT_ID) return;
  ReactGA.send({ hitType: 'pageview', page: path });
}

export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (!MEASUREMENT_ID) return;
  ReactGA.event(name, params);
}
