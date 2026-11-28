import { describe, expect, it } from "vitest";
import { SITE } from "@/lib/site";
import { BOOT_SCRIPT } from "../boot";
import { isPhonePage } from "../phone-pages";
import { DEVICE_VIEWPORT, PREVIEW_STORAGE_KEY, PREVIEW_VALUE, PREVIEW_VIEWPORT } from "../preview";

/**
 * The boot script is a string the browser runs before first paint, so no
 * compiler checks it and a slip fails silently: every device would get the
 * desktop layout. These run the real script against stand-ins for each kind
 * of device and read the attributes it leaves on <html>.
 */

interface Device {
  ua: string;
  /** The screen in CSS pixels, as the device reports it. */
  screen: [number, number];
  maxTouchPoints?: number;
  /** Its main pointer is a finger. */
  coarse?: boolean;
  /** It has a mouse or trackpad as well (or only). */
  fine?: boolean;
  path?: string;
  /** The visitor chose the scaled desktop preview earlier. */
  previewChosen?: boolean;
}

function boot({ ua, screen, maxTouchPoints = 0, coarse = false, fine = !coarse, path = "/studies/x", previewChosen = false }: Device) {
  const attributes: Record<string, string> = {};
  const meta = { content: DEVICE_VIEWPORT, setAttribute: (_: string, value: string) => (meta.content = value) };
  const document = {
    documentElement: { setAttribute: (name: string, value: string) => (attributes[name] = value) },
    querySelector: () => meta,
  };
  const window = {
    screen: { width: screen[0], height: screen[1] },
    innerWidth: screen[0],
    innerHeight: screen[1],
    matchMedia: (query: string) => ({
      matches: query === "(pointer: coarse)" ? coarse : query === "(any-pointer: fine)" ? fine : false,
    }),
  };
  const localStorage = {
    getItem: (key: string) => (previewChosen && key === PREVIEW_STORAGE_KEY ? PREVIEW_VALUE : null),
  };
  const run = new Function("document", "window", "navigator", "localStorage", "location", BOOT_SCRIPT);
  run(document, window, { userAgent: ua, maxTouchPoints }, localStorage, { pathname: path });
  return { device: attributes["data-device"], phonePage: "data-phone-page" in attributes, preview: attributes["data-preview"], viewport: meta.content };
}

const UA = {
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  windows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
  iPhone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  androidPhone: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36",
  androidTablet: "Mozilla/5.0 (Linux; Android 15; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
};

describe("the boot script", () => {
  it("is valid JavaScript", () => {
    expect(() => new Function(BOOT_SCRIPT)).not.toThrow();
  });

  it("leaves a computer as it is", () => {
    expect(boot({ ua: UA.mac, screen: [1440, 900] }).device).toBeUndefined();
  });

  it("counts a touchscreen laptop, which keeps its trackpad, as a computer", () => {
    expect(boot({ ua: UA.windows, screen: [1366, 768], coarse: true, fine: true }).device).toBeUndefined();
  });

  it("gives an iPad the app, though it calls itself a Mac", () => {
    expect(boot({ ua: UA.mac, screen: [820, 1180], maxTouchPoints: 5 }).device).toBe("tablet");
    expect(boot({ ua: UA.mac, screen: [744, 1133], maxTouchPoints: 5 }).device).toBe("tablet");
  });

  it("gives an Android tablet the app", () => {
    expect(boot({ ua: UA.androidTablet, screen: [800, 1280], coarse: true }).device).toBe("tablet");
  });

  it(`marks phones, by a shorter screen side under ${SITE.minTabletWidth} px, whichever way they are held`, () => {
    expect(boot({ ua: UA.iPhone, screen: [393, 852], maxTouchPoints: 5 }).device).toBe("phone");
    expect(boot({ ua: UA.iPhone, screen: [440, 956], maxTouchPoints: 5 }).device).toBe("phone");
    expect(boot({ ua: UA.androidPhone, screen: [915, 412], coarse: true }).device).toBe("phone");
    // An iPhone asking for the desktop site says Mac, like an iPad.
    expect(boot({ ua: UA.mac, screen: [393, 852], maxTouchPoints: 5 }).device).toBe("phone");
  });

  it("marks the index as a page phones can browse, and studies as not", () => {
    expect(boot({ ua: UA.iPhone, screen: [393, 852], path: "/" }).phonePage).toBe(true);
    expect(boot({ ua: UA.mac, screen: [1440, 900], path: "/" }).phonePage).toBe(true);
    expect(boot({ ua: UA.iPhone, screen: [393, 852], path: "/studies/revelation-chiasm" }).phonePage).toBe(false);
  });

  it("applies a phone's chosen preview to studies, but not to the index", () => {
    const study = boot({ ua: UA.iPhone, screen: [393, 852], path: "/studies/revelation-chiasm", previewChosen: true });
    expect(study).toMatchObject({ preview: PREVIEW_VALUE, viewport: PREVIEW_VIEWPORT });
    const index = boot({ ua: UA.iPhone, screen: [393, 852], path: "/", previewChosen: true });
    expect(index).toMatchObject({ preview: PREVIEW_VALUE, viewport: DEVICE_VIEWPORT });
  });

  it("never applies the preview to a tablet", () => {
    expect(boot({ ua: UA.mac, screen: [820, 1180], maxTouchPoints: 5, previewChosen: true }).preview).toBeUndefined();
  });
});

describe("phone pages", () => {
  it("match with or without a trailing slash", () => {
    expect(isPhonePage("/")).toBe(true);
    expect(isPhonePage("/studies/revelation-chiasm")).toBe(false);
    expect(isPhonePage("/studies/revelation-chiasm/")).toBe(false);
  });
});
