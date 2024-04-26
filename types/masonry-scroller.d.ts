/// <reference types="react" />
import type { UseMasonryOptions } from "./use-masonry";
/**
 * A heavily-optimized component that updates `useMasonry()` when the scroll position of the browser `window`
 * changes. This bare-metal component is used by `<Masonry>` under the hood.
 *
 * @param props
 */
export declare function MasonryScroller<Item>(
  props: MasonryScrollerProps<Item>
): JSX.Element;
export declare namespace MasonryScroller {
  var displayName: string;
}
export interface MasonryScrollerProps<Item>
  extends Omit<UseMasonryOptions<Item>, "scrollTop" | "isScrolling"> {
  /**
   * This determines how often (in frames per second) to update the scroll position of the
   * browser `window` in state, and as a result the rate the masonry grid recalculates its visible cells.
   * The default value of `12` has been very reasonable in my own testing, but if you have particularly
   * heavy `render` components it may be prudent to reduce this number.
   *
   * @default 12
   */
  scrollFps?: number;
  /**
   * The vertical space in pixels between the top of the grid container and the top
   * of the browser `document.documentElement`.
   *
   * @default 0
   */
  offset?: number;
}
