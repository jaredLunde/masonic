import {
  clearRequestTimeout,
  requestTimeout,
} from "@essentials/request-timeout";
import useScrollPosition from "@react-hook/window-scroll";
import * as React from "react";

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
export function useScroller(
  offset = 0,
  fps = 12
): { scrollTop: number; isScrolling: boolean } {
  const scrollTop = useScrollPosition(fps);
  const [isScrolling, setIsScrolling] = React.useState(false);
  const didMount = React.useRef(0);

  React.useEffect(() => {
    if (didMount.current === 1) setIsScrolling(true);
    let didUnsubscribe = false;
    const to = requestTimeout(() => {
      if (didUnsubscribe) return;
      // This is here to prevent premature bail outs while maintaining high resolution
      // unsets. Without it there will always bee a lot of unnecessary DOM writes to style.
      setIsScrolling(false);
    }, 40 + 1000 / fps);
    didMount.current = 1;
    return () => {
      didUnsubscribe = true;
      clearRequestTimeout(to);
    };
  }, [fps, scrollTop]);

  return { scrollTop: Math.max(0, scrollTop - offset), isScrolling };
}
