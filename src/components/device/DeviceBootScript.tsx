import {
  PREVIEW_STORAGE_KEY,
  PREVIEW_VALUE,
  PREVIEW_VIEWPORT,
} from "./preview";

/**
 * Blocking inline script for <head>. Runs before first paint so phones and
 * tablets see the device gate immediately, with no flash of the desktop UI.
 *
 * Contract with src/app/globals.css:
 *   html[data-device="touch"]     phone or tablet: the gate shows, the app hides
 *   html[data-preview="desktop"]  the visitor chose the scaled desktop preview
 *
 * A device counts as touch-first when its user agent says phone or tablet
 * (including iPadOS, which reports itself as a Mac), or when it has no fine
 * pointer at all. Touchscreen laptops keep their trackpad, so they pass.
 */
const BOOT = `(function(){try{
var d=document.documentElement,ua=navigator.userAgent||"";
var mq=function(q){return window.matchMedia&&window.matchMedia(q).matches};
var touchUA=/Android|iPhone|iPad|iPod|Mobile|Silk|Kindle|BlackBerry|Opera Mini|IEMobile/i.test(ua);
var iPadOS=/Macintosh/.test(ua)&&navigator.maxTouchPoints>1;
var touchOnly=mq("(pointer: coarse)")&&!mq("(any-pointer: fine)");
if(!(touchUA||iPadOS||touchOnly))return;
d.setAttribute("data-device","touch");
if(localStorage.getItem(${JSON.stringify(PREVIEW_STORAGE_KEY)})===${JSON.stringify(PREVIEW_VALUE)}){
d.setAttribute("data-preview",${JSON.stringify(PREVIEW_VALUE)});
var m=document.querySelector('meta[name="viewport"]');
if(m)m.setAttribute("content",${JSON.stringify(PREVIEW_VIEWPORT)});
}
}catch(e){}})();`;

export function DeviceBootScript() {
  return <script id="device-boot" dangerouslySetInnerHTML={{ __html: BOOT }} />;
}
