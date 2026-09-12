import { afterEach, describe, expect, it } from "vitest";
import { getAppUrl } from "./appUrl";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("getAppUrl", () => {
  it("falls back to localhost when unset outside production", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_ENV;
    expect(getAppUrl()).toBe("http://localhost:3000");
  });

  it("returns the configured URL outside production", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://medswyft.com";
    delete process.env.VERCEL_ENV;
    expect(getAppUrl()).toBe("https://medswyft.com");
  });

  it("returns the configured HTTPS URL in production", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://medswyft.com";
    process.env.VERCEL_ENV = "production";
    expect(getAppUrl()).toBe("https://medswyft.com");
  });

  it("throws in production if the URL is unset (would otherwise silently email a broken link)", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_ENV = "production";
    expect(() => getAppUrl()).toThrow();
  });

  it("throws in production if the URL is still localhost", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.VERCEL_ENV = "production";
    expect(() => getAppUrl()).toThrow();
  });

  it("throws in production if the URL isn't HTTPS", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://medswyft.com";
    process.env.VERCEL_ENV = "production";
    expect(() => getAppUrl()).toThrow();
  });
});
