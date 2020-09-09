import * as React from 'react'
import useLayoutEffect from '@react-hook/passive-layout-effect'
import {areEqualArrays} from '@essentials/are-equal'
import {createIntervalTree} from './interval-tree'

/**
 * This hook creates the grid cell positioner and cache required by `useMasonry()`. This is
 * the meat of the grid's layout algorithm, determining which cells to render at a given scroll
 * position, as well as where to place new items in the grid.
 *
 * @param options Properties that determine the number of columns in the grid, as well
 *  as their widths.
 * @param deps This hook will create a new positioner, clearing all existing cached positions,
 *  whenever the dependencies in this list change.
 */
export function usePositioner(
  {
    width,
    columnWidth = 200,
    columnGutter = 0,
    columnCount,
  }: UsePositionerOptions,
  deps: React.DependencyList = emptyArr
): Positioner {
  const didMount = React.useRef(0)
  const initPositioner = (): Positioner => {
    const [computedColumnWidth, computedColumnCount] = getColumns(
      width,
      columnWidth,
      columnGutter,
      columnCount
    )
    return createPositioner(
      computedColumnCount,
      computedColumnWidth,
      columnGutter
    )
  }

  // eslint-disable-next-line prefer-const
  let [{deps: previousDeps, positioner}, setState] = React.useState<
    UsePositionerState
  >(() => ({
    deps,
    positioner: initPositioner(),
  }))

  // Create a new positioner when the dependencies change.
  if (!areEqualArrays(deps as any[], previousDeps as any[])) {
    positioner = initPositioner()
    setState({deps, positioner})
  }

  useLayoutEffect(() => {
    if (didMount.current) {
      const nextPositioner = initPositioner()
      const cacheSize = positioner.size()

      for (let index = 0; index < cacheSize; index++) {
        const pos = positioner.get(index)
        nextPositioner.set(index, pos !== void 0 ? pos.height : 0)
      }

      setState((current) =>
        Object.assign({}, current, {positioner: nextPositioner})
      )
    }

    didMount.current = 1
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, columnWidth, columnGutter, columnCount])

  return positioner
}

export interface UsePositionerOptions {
  /**
   * The width of the container you're rendering the grid within, i.e. the container
   * element's `element.offsetWidth`
   */
  width: number
  /**
   * The minimum column width. The `usePositioner()` hook will automatically size the
   * columns to fill their container based upon the `columnWidth` and `columnGutter` values.
   * It will never render anything smaller than this width unless its container itself is
   * smaller than its value. This property is optional if you're using a static `columnCount`.
   * @default 200
   */
  columnWidth?: number
  /**
   * This sets the vertical and horizontal space between grid cells in pixels.
   */
  columnGutter?: number
  /**
   * By default, `usePositioner()` derives the column count from the `columnWidth`, `columnGutter`,
   * and `width` props. However, in some situations it is nice to be able to override that behavior
   * (e.g. creating a `List` component).
   */
  columnCount?: number
}

/**
 * Creates a cell positioner for the `useMasonry()` hook. The `usePositioner()` hook uses
 * this utility under the hood.
 *
 * @param columnCount The number of columns in the grid
 * @param columnWidth The width of each column in the grid
 * @param columnGutter The amount of horizontal and vertical space in pixels to render
 *  between each grid item.
 */
export const createPositioner = (
  columnCount: number,
  columnWidth: number,
  columnGutter = 0
): Positioner => {
  // O(log(n)) lookup of cells to render for a given viewport size
  // Store tops and bottoms of each cell for fast intersection lookup.
  const intervalTree = createIntervalTree()
  // Track the height of each column.
  // Layout algorithm below always inserts into the shortest column.
  const columnHeights: number[] = new Array(columnCount)
  // Used for O(1) item access
  const items: PositionerItem[] = []
  // Tracks the item indexes within an individual column
  const columnItems: number[][] = new Array(columnCount)

  for (let i = 0; i < columnCount; i++) {
    columnHeights[i] = 0
    columnItems[i] = []
  }

  return {
    columnCount,
    columnWidth,
    set: (index, height = 0) => {
      let column = 0

      // finds the shortest column and uses it
      for (let i = 1; i < columnHeights.length; i++) {
        if (columnHeights[i] < columnHeights[column]) column = i
      }

      const top = columnHeights[column] || 0
      columnHeights[column] = top + height + columnGutter
      columnItems[column].push(index)
      items[index] = {
        left: column * (columnWidth + columnGutter),
        top,
        height,
        column,
      }
      intervalTree.insert(top, top + height, index)
    },
    get: (index) => items[index],
    // This only updates items in the specific columns that have changed, on and after the
    // specific items that have changed
    update: (updates) => {
      const columns: number[] = new Array(columnCount)
      let i = 0,
        j = 0

      // determines which columns have items that changed, as well as the minimum index
      // changed in that column, as all items after that index will have their positions
      // affected by the change
      for (; i < updates.length - 1; i++) {
        const index = updates[i]
        const item = items[index]
        item.height = updates[++i]
        intervalTree.remove(index)
        intervalTree.insert(item.top, item.top + item.height, index)
        columns[item.column] =
          columns[item.column] === void 0
            ? index
            : Math.min(index, columns[item.column])
      }

      for (i = 0; i < columns.length; i++) {
        // bails out if the column didn't change
        if (columns[i] === void 0) continue
        const itemsInColumn = columnItems[i]
        // the index order is sorted with certainty so binary search is a great solution
        // here as opposed to Array.indexOf()
        const startIndex = binarySearch(itemsInColumn, columns[i])
        const index = columnItems[i][startIndex]
        const startItem = items[index]
        columnHeights[i] = startItem.top + startItem.height + columnGutter

        for (j = startIndex + 1; j < itemsInColumn.length; j++) {
          const index = itemsInColumn[j]
          const item = items[index]
          item.top = columnHeights[i]
          columnHeights[i] = item.top + item.height + columnGutter
          intervalTree.remove(index)
          intervalTree.insert(item.top, item.top + item.height, index)
        }
      }
    },
    // Render all cells visible within the viewport range defined.
    range: (lo, hi, renderCallback) =>
      intervalTree.search(lo, hi, (index, top) =>
        renderCallback(index, items[index].left, top)
      ),
    estimateHeight: (itemCount, defaultItemHeight): number => {
      const tallestColumn = Math.max(0, Math.max.apply(null, columnHeights))

      return itemCount === intervalTree.size
        ? tallestColumn
        : tallestColumn +
            Math.ceil((itemCount - intervalTree.size) / columnCount) *
              defaultItemHeight
    },
    shortestColumn: () => {
      if (columnHeights.length > 1) return Math.min.apply(null, columnHeights)
      return columnHeights[0] || 0
    },
    size(): number {
      return intervalTree.size
    },
  }
}

export interface Positioner {
  /**
   * The number of columns in the grid
   */
  columnCount: number
  /**
   * The width of each column in the grid
   */
  columnWidth: number
  /**
   * Sets the position for the cell at `index` based upon the cell's height
   */
  set: (index: number, height: number) => void
  /**
   * Gets the `PositionerItem` for the cell at `index`
   */
  get: (index: number) => PositionerItem | undefined
  /**
   * Updates cells based on their indexes and heights
   * positioner.update([index, height, index, height, index, height...])
   */
  update: (updates: number[]) => void
  /**
   * Searches the interval tree for grid cells with a `top` value in
   * betwen `lo` and `hi` and invokes the callback for each item that
   * is discovered
   */
  range: (
    lo: number,
    hi: number,
    renderCallback: (index: number, left: number, top: number) => void
  ) => void
  /**
   * Returns the number of grid cells in the cache
   */

  size: () => number
  /**
   * Estimates the total height of the grid
   */

  estimateHeight: (itemCount: number, defaultItemHeight: number) => number
  /**
   * Returns the height of the shortest column in the grid
   */

  shortestColumn: () => number
}

export interface PositionerItem {
  /**
   * This is how far from the top edge of the grid container in pixels the
   * item is placed
   */
  top: number
  /**
   * This is how far from the left edge of the grid container in pixels the
   * item is placed
   */
  left: number
  /**
   * This is the height of the grid cell
   */
  height: number
  /**
   * This is the column number containing the grid cell
   */
  column: number
}

type UsePositionerState = {
  deps: React.DependencyList
  positioner: Positioner
}

/* istanbul ignore next */
const binarySearch = (a: number[], y: number): number => {
  let l = 0
  let h = a.length - 1

  while (l <= h) {
    const m = (l + h) >>> 1
    const x = a[m]
    if (x === y) return m
    else if (x <= y) l = m + 1
    else h = m - 1
  }

  return -1
}

const getColumns = (
  width = 0,
  minimumWidth = 0,
  gutter = 8,
  columnCount?: number
): [number, number] => {
  columnCount = columnCount || Math.floor(width / (minimumWidth + gutter)) || 1
  const columnWidth = Math.floor(
    (width - gutter * (columnCount - 1)) / columnCount
  )
  return [columnWidth, columnCount]
}

const emptyArr: [] = []
