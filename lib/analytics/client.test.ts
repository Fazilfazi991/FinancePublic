import { afterEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "./client";

afterEach(() => vi.unstubAllGlobals());

describe("analytics client", () => {
  it("invokes ingestion with approved metadata and no client user id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    const storage = new Map<string, string>();
    vi.stubGlobal("window", { location: { pathname: "/overview" }, localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) } });
    vi.stubGlobal("crypto", { randomUUID: () => "12345678-1234-1234-1234-123456789012" });
    vi.stubGlobal("fetch", fetchMock);
    expect(await trackEvent("ai_advisor_opened", { placement: "floating_button" })).toBe(true);
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload).toMatchObject({ eventName: "ai_advisor_opened", pagePath: "/overview", metadata: { placement: "floating_button" } });
    expect(payload).not.toHaveProperty("userId");
  });

  it("fails safely without throwing", async () => {
    vi.stubGlobal("window", { location: { pathname: "/overview" }, localStorage: { getItem: () => "anonymous123", setItem: vi.fn() } });
    vi.stubGlobal("crypto", { randomUUID: () => "12345678-1234-1234-1234-123456789012" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(trackEvent("ai_advisor_opened", { placement: "floating_button" })).resolves.toBe(false);
  });
});
