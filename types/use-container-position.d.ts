import * as React from "react";
/**
 * A hook for measuring the width of the grid container, as well as its distance
 * from the top of the document. These values are necessary to correctly calculate the number/width
 * of columns to render, as well as the number of rows to render.
 *
 * @param elementRef - A `ref` object created by `React.useRef()`. That ref should be provided to the
 *   `containerRef` property in `useMasonry()`.
 * @param deps - You can force this hook to recalculate the `offset` and `width` whenever this
 *   dependencies list changes. A common dependencies list might look like `[windowWidth, windowHeight]`,
 *   which would force the hook to recalculate any time the size of the browser `window` changed.
 */
export declare function useContainerPosition(
  elementRef: React.MutableRefObject<HTMLElement | null>,
  deps?: React.DependencyList
): ContainerPosition;
export interface ContainerPosition {
  /**
   * The distance in pixels between the top of the element in `elementRef` and the top of
   * the `document.documentElement`.
   */
  offset: number;
  /**
   * The `offsetWidth` of the element in `elementRef`.
   */
  width: number;
}
