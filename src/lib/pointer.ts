/**
 * Hover previews belong to pointers that can hover: a mouse, a trackpad, an
 * Apple Pencil held over the screen. A finger can't, and on a touch screen
 * browsers report a tap as a hover that never ends, so previews would stick.
 * Gate hover handlers with this and let a tap select instead:
 *
 *   onPointerEnter={(e) => canHover(e) && onHover(id)}
 *   onPointerLeave={(e) => canHover(e) && onHover(null)}
 */
export function canHover(event: { pointerType: string }): boolean {
  return event.pointerType !== "touch";
}
