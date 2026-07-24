import { describe, it, expect, vi, afterEach } from "vitest";
import { shelfLifeInfo, EXPIRING_THRESHOLD_DAYS } from "@/lib/spoilage";

describe("shelfLifeInfo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const NOW = new Date("2026-06-17T00:00:00Z");

  it("computes the expiry date as entry + shelf-life days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const info = shelfLifeInfo("2026-06-17T00:00:00Z", 10);
    expect(info.expiryDate.toISOString().slice(0, 10)).toBe("2026-06-27");
  });

  it("reports fresh when days left exceed the expiring threshold", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const info = shelfLifeInfo(NOW, 10);
    expect(info.state).toBe("fresh");
    expect(info.daysLeft).toBe(10);
  });

  it("reports expiring at exactly the threshold", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const info = shelfLifeInfo(NOW, EXPIRING_THRESHOLD_DAYS);
    expect(info.state).toBe("expiring");
    expect(info.daysLeft).toBe(EXPIRING_THRESHOLD_DAYS);
  });

  it("reports expiring just under the threshold", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const info = shelfLifeInfo(NOW, 1);
    expect(info.state).toBe("expiring");
  });

  it("reports spoiled when the expiry date has passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    // entered 5 days ago with a 2-day shelf life => expired 3 days ago
    const entered = new Date(NOW);
    entered.setDate(entered.getDate() - 5);
    const info = shelfLifeInfo(entered, 2);
    expect(info.state).toBe("spoiled");
    expect(info.daysLeft).toBeLessThan(0);
  });

  it("accepts an ISO string as the entry date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const info = shelfLifeInfo("2026-06-10T00:00:00Z", 20);
    expect(info.state).toBe("fresh");
  });
});
