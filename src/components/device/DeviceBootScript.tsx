import { SITE } from "@/lib/site";
import {
  PREVIEW_STORAGE_KEY,
  PREVIEW_VALUE,
  PREVIEW_VIEWPORT,
} from "./preview";

/**
 * Blocking inline script for <head>. Runs before first paint so each device
 * gets its own layout at once, with no flash of the wrong one.
 *
 * Contract with src/app/globals.css:
 *   html[data-device="phone"]     the gate shows, the app hides
 *   html[data-device="tablet"]    the app, tuned for touch
 *   html[data-preview="desktop"]  a phone showing the scaled desktop preview
 * Computers get no attribute.
 *
 * A device is touch-first when its user agent says phone or tablet (including
 * iPadOS, which reports itself as a Mac), or when it has no fine pointer at all.
 * Touchscreen laptops keep their trackpad, so they count as computers. A
 * touch-first device is a phone when the shorter side of its screen is under
 * SITE.minTabletWidth. The screen, not the window, decides, so turning the
 * device or splitting the screen never changes which it is.
 */
const BOOT = `(function(){try{
var d=document.documentElement,ua=navigator.userAgent||"";
var mq=function(q){return window.matchMedia&&window.matchMedia(q).matches};
var touchUA=/Android|iPhone|iPad|iPod|Mobile|Silk|Kindle|BlackBerry|Opera Mini|IEMobile/i.test(ua);
var iPadOS=/Macintosh/.test(ua)&&navigator.maxTouchPoints>1;
var touchOnly=mq("(pointer: coarse)")&&!mq("(any-pointer: fine)");
if(!(touchUA||iPadOS||touchOnly))return;
var s=window.screen||{};
var side=Math.min(s.width||0,s.height||0)||Math.min(window.innerWidth,window.innerHeight);
if(side>=${SITE.minTabletWidth}){d.setAttribute("data-device","tablet");return}
d.setAttribute("data-device","phone");
if(localStorage.getItem(${JSON.stringify(PREVIEW_STORAGE_KEY)})===${JSON.stringify(PREVIEW_VALUE)}){
d.setAttribute("data-preview",${JSON.stringify(PREVIEW_VALUE)});
var m=document.querySelector('meta[name="viewport"]');
if(m)m.setAttribute("content",${JSON.stringify(PREVIEW_VIEWPORT)});
}
}catch(e){}})();`;

export function DeviceBootScript() {
  return <script id="device-boot" dangerouslySetInnerHTML={{ __html: BOOT }} />;
}
