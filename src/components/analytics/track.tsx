"use client";

import { useEffect } from "react";
import { ANALYTICS_EVENTS, type AnalyticsEventName } from "@/lib/analytics";

export function track(event: AnalyticsEventName, extra?: Record<string, string>) {
  if (!(ANALYTICS_EVENTS as readonly string[]).includes(event)) return;
  const body = JSON.stringify({ event, ...extra });
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

export function AnalyticsPing({ event }: { event: AnalyticsEventName }) {
  useEffect(() => {
    track(event);
  }, [event]);
  return null;
}
