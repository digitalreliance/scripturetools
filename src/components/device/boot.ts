import { SITE } from "@/lib/site";
import { PHONE_PAGE_ATTRIBUTE, PHONE_PAGES } from "./phone-pages";
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
 *   html[data-device="phone"]     the gate shows, the app hides, except on
 *   html[data-phone-page]         a page laid out for phones too (the index)
 *   html[data-device="tablet"]    the app, tuned for touch
 *   html[data-preview="desktop"]  a phone that chose the scaled desktop preview
 *                                 (applied everywhere but phone pages)
 * Computers get no device attribute. DeviceRoute keeps data-phone-page true as
 * the reader moves between pages.
 *
 * A device is touch-first when its user agent says phone or tablet (including
 * iPadOS, which reports itself as a Mac), or when it has no fine pointer at all.
 * Touchscreen laptops keep their trackpad, so they count as computers. A
 * touch-first device is a phone when the shorter side of its screen is under
 * SITE.minTabletWidth. The screen, not the window, decides, so turning the
 * device or splitting the screen never changes which it is.
 *
 * It is a string, sent as is: no build step checks it. Write plain ES5 and
 * avoid backslashes (the template literal would eat them). The tests in
 * __tests__/boot.test.ts run it against stand-ins for each kind of device.
 */
export const BOOT_SCRIPT = `(function(){try{
var d=document.documentElement,ua=navigator.userAgent||"";
var p=location.pathname,path=p.length>1&&p.charAt(p.length-1)==="/"?p.slice(0,-1):p;
var phonePage=${JSON.stringify(PHONE_PAGES)}.indexOf(path)>-1;
if(phonePage)d.setAttribute(${JSON.stringify(PHONE_PAGE_ATTRIBUTE)},"");
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
if(m&&!phonePage)m.setAttribute("content",${JSON.stringify(PREVIEW_VIEWPORT)});
}
}catch(e){}})();`;
