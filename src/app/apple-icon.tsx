import { ImageResponse } from "next/og";

/**
 * The home-screen icon for iPads (and iPhones, which then open the device
 * gate): the brand mark from icon.svg, two cross-reference arcs on their axis,
 * on the cover's leather. iOS rounds the corners itself, so it fills the square.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const COVER = "#141210";
const INK = "#F2EEE6";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: COVER }}>
        <svg width="132" height="132" viewBox="0 2 32 32" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round">
          <path d="M4.5 21.5h23" />
          <path d="M6.5 21.5a7 7 0 0 1 14 0" />
          <path d="M11.5 21.5a7 7 0 0 1 14 0" />
        </svg>
      </div>
    ),
    size,
  );
}
