import type { Positioner } from "./use-positioner";
/**
 * Creates a resize observer that forces updates to the grid cell positions when mutations are
 * made to cells affecting their height.
 *
 * @param positioner - The masonry cell positioner created by the `usePositioner()` hook.
 */
export declare function useResizeObserver(
  positioner: Positioner
): ResizeObserver;
/**
 * Creates a resize observer that fires an `updater` callback whenever the height of
 * one or many cells change. The `useResizeObserver()` hook is using this under the hood.
 *
 * @param positioner - A cell positioner created by the `usePositioner()` hook or the `createPositioner()` utility
 * @param updater - A callback that fires whenever one or many cell heights change.
 */
export declare const createResizeObserver: (
  positioner: Positioner,
  updater: (updates: number[]) => void
) => ResizeObserver;
