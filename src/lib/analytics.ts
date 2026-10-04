export const ANALYTICS_EVENTS = [
  "homepage_visit",
  "routes_viewed",
  "services_viewed",
  "pay_button_clicked",
  "payment_page_opened",
  "payment_completed",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export function isAnalyticsEvent(value: unknown): value is AnalyticsEventName {
  return typeof value === "string" && (ANALYTICS_EVENTS as readonly string[]).includes(value);
}
