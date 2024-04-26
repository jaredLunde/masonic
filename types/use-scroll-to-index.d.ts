import * as React from "react";
import type { Positioner } from "./use-positioner";
/**
 * A hook that creates a callback for scrolling to a specific index in
 * the "items" array.
 *
 * @param positioner - A positioner created by the `usePositioner()` hook
 * @param options - Configuration options
 */
export declare function useScrollToIndex(
  positioner: Positioner,
  options: UseScrollToIndexOptions
): (index: number) => void;
export declare type UseScrollToIndexOptions = {
  /**
   * The window element or a React ref for the window element. That is,
   * this is the grid container.
   *
   * @default window
   */
  element?: Window | HTMLElement | React.RefObject<HTMLElement> | null;
  /**
   * Sets the vertical alignment of the cell within the grid container.
   *
   * @default "top"
   */
  align?: "center" | "top" | "bottom";
  /**
   * The height of the grid.
   *
   * @default window.innerHeight
   */
  height?: number;
  /**
   * The vertical space in pixels between the top of the grid container and the top
   * of the window.
   *
   * @default 0
   */
  offset?: number;
};
