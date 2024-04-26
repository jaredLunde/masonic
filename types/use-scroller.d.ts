/**
 * A hook for tracking whether the `window` is currently being scrolled and it's scroll position on
 * the y-axis. These values are used for determining which grid cells to render and when
 * to add styles to the masonry container that maximize scroll performance.
 *
 * @param offset - The vertical space in pixels between the top of the grid container and the top
 *  of the browser `document.documentElement`.
 * @param fps - This determines how often (in frames per second) to update the scroll position of the
 *  browser `window` in state, and as a result the rate the masonry grid recalculates its visible cells.
 *  The default value of `12` has been very reasonable in my own testing, but if you have particularly
 *  heavy `render` components it may be prudent to reduce this number.
 */
export declare function useScroller(
  offset?: number,
  fps?: number
): {
  scrollTop: number;
  isScrolling: boolean;
};
