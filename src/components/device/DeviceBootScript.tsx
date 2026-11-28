import { BOOT_SCRIPT } from "./boot";

/** The device-sorting script, inline in <head> so it runs before first paint (see ./boot.ts). */
export function DeviceBootScript() {
  return <script id="device-boot" dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />;
}
