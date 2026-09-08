"use client";

import { type EventName, validateMetadata } from "./events";

type Metadata = Record<string, string | number | boolean>;
type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

function anonymousId() {
  const key = "zerodebt_analytics_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID().replaceAll("-", "");
  window.localStorage.setItem(key, value);
  return value;
}

export async function trackEvent(eventName: EventName, metadata: Metadata = {}, source: "app" | "web" | "onboarding" = "app") {
  if (typeof window === "undefined") return false;
  try {
    validateMetadata(eventName, metadata);
    const body = { eventName, anonymousId: anonymousId(), pagePath: window.location.pathname, source, idempotencyKey: crypto.randomUUID().replaceAll("-", ""), metadata };
    (window as GtagWindow).gtag?.("event", eventName, metadata);
    const response = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true });
    return response.ok;
  } catch {
    return false;
  }
}

export function trackEventSafely(eventName: EventName, metadata: Metadata = {}, source: "app" | "web" | "onboarding" = "app") {
  void trackEvent(eventName, metadata, source);
}
