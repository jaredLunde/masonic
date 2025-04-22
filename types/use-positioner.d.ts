import * as React from "react";
/**
 * This hook creates the grid cell positioner and cache required by `useMasonry()`. This is
 * the meat of the grid's layout algorithm, determining which cells to render at a given scroll
 * position, as well as where to place new items in the grid.
 *
 * @param options - Properties that determine the number of columns in the grid, as well
 *  as their widths.
 * @param options.columnWidth
 * @param options.width
 * @param deps - This hook will create a new positioner, clearing all existing cached positions,
 *  whenever the dependencies in this list change.
 * @param options.columnGutter
 * @param options.rowGutter
 * @param options.columnCount
 * @param options.maxColumnCount
 * @param options.maxColumnWidth
 */
export declare function usePositioner(
  {
    width,
    columnWidth,
    columnGutter,
    rowGutter,
    columnCount,
    maxColumnCount,
    maxColumnWidth,
  }: UsePositionerOptions,
  deps?: React.DependencyList
): Positioner;
export interface UsePositionerOptions {
  /**
   * The width of the container you're rendering the grid within, i.e. the container
   * element's `element.offsetWidth`
   */
  width: number;
  /**
   * The minimum column width. The `usePositioner()` hook will automatically size the
   * columns to fill their container based upon the `columnWidth` and `columnGutter` values.
   * It will never render anything smaller than this width unless its container itself is
   * smaller than its value. This property is optional if you're using a static `columnCount`.
   *
   * @default 200
   */
  columnWidth?: number;
  /**
   * The maximum column width. Calculated column widths will be capped at this value.
   */
  maxColumnWidth?: number;
  /**
   * This sets the horizontal space between grid columns in pixels. If `rowGutter` is not set, this
   * also sets the vertical space between cells within a column in pixels.
   *
   * @default 0
   */
  columnGutter?: number;
  /**
   * This sets the vertical space between cells within a column in pixels. If not set, the value of
   * `columnGutter` is used instead.
   */
  rowGutter?: number;
  /**
   * By default, `usePositioner()` derives the column count from the `columnWidth`, `columnGutter`,
   * and `width` props. However, in some situations it is nice to be able to override that behavior
   * (e.g. creating a `List` component).
   */
  columnCount?: number;
  /**
   * The upper bound of column count. This property won't work if `columnCount` is set.
   */
  maxColumnCount?: number;
}
/**
 * Creates a cell positioner for the `useMasonry()` hook. The `usePositioner()` hook uses
 * this utility under the hood.
 *
 * @param columnCount - The number of columns in the grid
 * @param columnWidth - The width of each column in the grid
 * @param columnGutter - The amount of horizontal space between columns in pixels.
 * @param rowGutter - The amount of vertical space between cells within a column in pixels (falls back
 * to `columnGutter`).
 */
export declare const createPositioner: (
  columnCount: number,
  columnWidth: number,
  columnGutter?: number,
  rowGutter?: number
) => Positioner;
export interface Positioner {
  /**
   * The number of columns in the grid
   */
  columnCount: number;
  /**
   * The width of each column in the grid
   */
  columnWidth: number;
  /**
   * Sets the position for the cell at `index` based upon the cell's height
   */
  set: (index: number, height: number) => void;
  /**
   * Gets the `PositionerItem` for the cell at `index`
   */
  get: (index: number) => PositionerItem | undefined;
  /**
   * Updates cells based on their indexes and heights
   * positioner.update([index, height, index, height, index, height...])
   */
  update: (updates: number[]) => void;
  /**
   * Searches the interval tree for grid cells with a `top` value in
   * betwen `lo` and `hi` and invokes the callback for each item that
   * is discovered
   */
  range: (
    lo: number,
    hi: number,
    renderCallback: (index: number, left: number, top: number) => void
  ) => void;
  /**
   * Returns the number of grid cells in the cache
   */
  size: () => number;
  /**
   * Estimates the total height of the grid
   */
  estimateHeight: (itemCount: number, defaultItemHeight: number) => number;
  /**
   * Returns the height of the shortest column in the grid
   */
  shortestColumn: () => number;
  /**
   * Returns all `PositionerItem` items
   */
  all: () => PositionerItem[];
}
export interface PositionerItem {
  /**
   * This is how far from the top edge of the grid container in pixels the
   * item is placed
   */
  top: number;
  /**
   * This is how far from the left edge of the grid container in pixels the
   * item is placed
   */
  left: number;
  /**
   * This is the height of the grid cell
   */
  height: number;
  /**
   * This is the column number containing the grid cell
   */
  column: number;
}
