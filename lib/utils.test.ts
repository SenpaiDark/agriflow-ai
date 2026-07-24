import { describe, it, expect } from "vitest";
import {
  cn,
  formatDate,
  formatCurrency,
  formatNumber,
  distanceKm,
} from "@/lib/utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("merges conflicting tailwind classes, keeping the last", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("formatDate", () => {
  it("returns an em dash for empty values", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
  });

  it("formats an ISO date string", () => {
    expect(formatDate("2026-06-15")).toBe("Jun 15, 2026");
  });

  it("formats a Date object", () => {
    expect(formatDate(new Date("2026-01-02T00:00:00Z"))).toBe("Jan 2, 2026");
  });
});

describe("formatCurrency", () => {
  it("returns an em dash for nullish values", () => {
    expect(formatCurrency(null)).toBe("—");
    expect(formatCurrency(undefined)).toBe("—");
  });

  it("formats zero (not treated as missing)", () => {
    const out = formatCurrency(0);
    expect(out).not.toBe("—");
    expect(out).toContain("0");
  });

  it("formats a naira amount without fraction digits", () => {
    const out = formatCurrency(1500);
    expect(out).toContain("1,500");
    expect(out).not.toContain(".");
  });
});

describe("formatNumber", () => {
  it("returns an em dash for nullish values", () => {
    expect(formatNumber(null)).toBe("—");
    expect(formatNumber(undefined)).toBe("—");
  });

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("adds thousands separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });
});

describe("distanceKm", () => {
  it("is zero for identical coordinates", () => {
    expect(distanceKm(6.5244, 3.3792, 6.5244, 3.3792)).toBe(0);
  });

  it("is symmetric", () => {
    const a = distanceKm(6.5244, 3.3792, 9.0765, 7.3986);
    const b = distanceKm(9.0765, 7.3986, 6.5244, 3.3792);
    expect(a).toBeCloseTo(b, 6);
  });

  it("computes a known distance (Lagos to Abuja ~525 km)", () => {
    const d = distanceKm(6.5244, 3.3792, 9.0765, 7.3986);
    expect(d).toBeGreaterThan(500);
    expect(d).toBeLessThan(560);
  });

  it("computes roughly one degree of latitude as ~111 km", () => {
    const d = distanceKm(0, 0, 1, 0);
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(112);
  });
});
