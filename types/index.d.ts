import React from 'react'
import ResizeObserver from 'resize-observer-polyfill'
/**
 * This hook handles the render phases of the masonry layout and returns the grid as a React element.
 *
 * @param options Options for configuring the masonry layout renderer. See `UseMasonryOptions`.
 */
export declare const useMasonry: ({
  positioner,
  resizeObserver,
  items,
  as: ContainerComponent,
  id,
  className,
  style,
  role,
  tabIndex,
  containerRef,
  itemAs: ItemComponent,
  itemStyle,
  itemHeightEstimate,
  itemKey,
  overscanBy,
  scrollTop,
  isScrolling,
  height,
  render: RenderComponent,
  onRender,
}: UseMasonryOptions) => JSX.Element
export interface UseMasonryOptions {
  /**
   * An array containing the data used by the grid items.
   */
  items: any[]
  /**
   * A grid cell positioner and cache created by the `usePositioner()` hook or
   * the `createPositioner` utility.
   */
  positioner: Positioner
  /**
   * A resize observer that tracks mutations to the grid cells and forces the
   * Masonry grid to recalculate its layout if any cells affect column heights
   * change. Check out the `useResizeObserver()` hook.
   */
  resizeObserver?: {
    observe: ResizeObserver['observe']
    disconnect: ResizeObserver['observe']
    unobserve: ResizeObserver['unobserve']
  }
  /**
   * This is the type of element the grid container will be rendered as.
   * @default "div"`
   */
  as?: keyof JSX.IntrinsicElements | React.ComponentType<any>
  /**
   * Optionally gives the grid container an `id` prop.
   */
  id?: string
  /**
   * Optionally gives the grid container a `className` prop.
   */
  className?: string
  /**
   * Adds extra `style` attributes to the container in addition to those
   * created by the `useMasonry()` hook.
   */
  style?: React.CSSProperties
  /**
   * Optionally swap out the accessibility `role` prop of the container and its items.
   * @default "grid"
   */
  role?: 'grid' | 'list'
  /**
   * Change the `tabIndex` of the grid container.
   * @default 0
   */
  tabIndex?: number
  /**
   * Forwards a React ref to the grid container.
   */
  containerRef?:
    | ((element: HTMLElement) => void)
    | React.MutableRefObject<HTMLElement | null>
  /**
   * This is the type of element the grid items will be rendered as.
   * @default "div"
   */
  itemAs?: keyof JSX.IntrinsicElements | React.ComponentType<any>
  /**
   * Adds extra `style` attributes to the grid items in addition to those
   * created by the `useMasonry()` hook.
   */
  itemStyle?: React.CSSProperties
  /**
   * This value is used for estimating the initial height of the masonry grid. It is important for
   * the UX of the scrolling behavior and in determining how many `items` to render in a batch, so it's
   * wise to set this value with some level accuracy, though it doesn't need to be perfect.
   * @default 300
   */
  itemHeightEstimate?: number
  /**
   * The value returned here must be unique to the item. By default, the key is the item's index. This is ok
   * if your collection of items is never modified. Setting this property ensures that the component in `render`
   * is reused each time the masonry grid is reflowed. A common pattern would be to return the item's database
   * ID here if there is one, e.g. `data => data.id`
   * @default (data: any, index: number) => index`
   */
  itemKey?: (data: any, index: number) => string | number
  /**
   * This number is used for determining the number of grid cells outside of the visible window to render.
   * The default value is `2` which means "render 2 windows worth (2 * `height`) of content before and after
   * the items in the visible window". A value of `3` would be 3 windows worth of grid cells, so it's a
   * linear relationship.
   *
   * Overscanning is important for preventing tearing when scrolling through items in the grid, but setting
   * too high of a value may create too much work for React to handle, so it's best that you tune this
   * value accordingly.
   * @default 2
   */
  overscanBy?: number
  /**
   * This is the height of the window. If you're rendering the grid relative to the browser `window`,
   * the current `document.documentElement.clientHeight` is the value you'll want to set here. If you're
   * rendering the grid inside of another HTML element, you'll want to provide the current `element.offsetHeight`
   * here.
   */
  height: number
  /**
   * The current scroll progress in pixel of the window the grid is rendered in. If you're rendering
   * the grid relative to the browser `window`, you'll want the most current `window.scrollY` here.
   * If you're rendering the grid inside of another HTML element, you'll want the current `element.scrollTop`
   * value here. The `useScroller()` hook and `<MasonryScroller>` components will help you if you're
   * rendering the grid relative to the browser `window`.
   */
  scrollTop: number
  /**
   * This property is used for determining whether or not the grid container should add styles that
   * dramatically increase scroll performance. That is, turning off `pointer-events` and adding a
   * `will-change: contents;` value to the style string. You can forgo using this prop, but I would
   * not recommend that. The `useScroller()` hook and `<MasonryScroller>` components will help you if
   * you're rendering the grid relative to the browser `window`.
   * @default false
   */
  isScrolling?: boolean
  /**
   * This component is rendered for each item of your `items` prop array. It should accept three props:
   * `index`, `width`, and `data`. See RenderComponentProps.
   */
  render: React.ComponentType<RenderComponentProps>
  /**
   * This callback is invoked any time the items currently being rendered by the grid change.
   */
  onRender?: (
    startIndex: number,
    stopIndex: number | undefined,
    items: any[]
  ) => void
}
export interface RenderComponentProps {
  /**
   * The index of the cell in the `items` prop array.
   */
  index: number
  /**
   * The rendered width of the cell's column.
   */
  width: number
  /**
   * The data at `items[index]` of your `items` prop array.
   */
  data: any
}
/**
 * A heavily-optimized component that updates `useMasonry()` when the scroll position of the browser `window`
 * changes. This bare-metal component is used by `<Masonry>` under the hood.
 */
export declare const MasonryScroller: React.FC<MasonryScrollerProps>
/**
 * A "batteries included" masonry grid which includes all of the implementation details below. This component is the
 * easiest way to get off and running in your app, before switching to more advanced implementations, if necessary.
 * It will change its column count to fit its container's width and will decide how many rows to render based upon
 * the height of the browser `window`.
 */
export declare const Masonry: React.FC<MasonryProps>
export interface MasonryProps
  extends Omit<
      UseMasonryOptions,
      | 'scrollTop'
      | 'height'
      | 'isScrolling'
      | 'positioner'
      | 'resizeObserver'
      | 'containerRef'
    >,
    Pick<UsePositionerOptions, 'columnWidth' | 'columnGutter' | 'columnCount'> {
  /**
   * This is the width that will be used for the browser `window` when rendering this component in SSR.
   * This prop isn't relevant for client-side only apps.
   */
  ssrWidth?: number
  /**
   * This is the height that will be used for the browser `window` when rendering this component in SSR.
   * This prop isn't relevant for client-side only apps.
   */
  ssrHeight?: number
  /**
   * This determines how often (in frames per second) to update the scroll position of the
   * browser `window` in state, and as a result the rate the masonry grid recalculates its visible cells.
   * The default value of `12` has been very reasonable in my own testing, but if you have particularly
   * heavy `render` components it may be prudent to reduce this number.
   * @default 12
   */
  scrollFps?: number
}
export interface MasonryScrollerProps
  extends Omit<
      MasonryProps,
      'columnWidth' | 'columnGutter' | 'columnCount' | 'ssrWidth' | 'ssrHeight'
    >,
    Pick<
      UseMasonryOptions,
      'height' | 'positioner' | 'containerRef' | 'resizeObserver'
    > {
  /**
   * The vertical space in pixels between the top of the grid container and the top
   * of the browser `document.documentElement`.
   * @default 0
   */
  offset?: number
}
/**
 * This is just a single-column `<Masonry>` component with `rowGutter` prop instead of
 * a `columnGutter` prop.
 */
export declare const List: React.FC<ListProps>
export interface ListProps
  extends Omit<MasonryProps, 'columGutter' | 'columnCount' | 'columnWidth'> {
  /**
   * The amount of vertical space in pixels to add between the list cells.
   * @default 0
   */
  rowGutter?: number
}
/**
 * A hook for tracking whether the `window` is currently being scrolled and it's scroll position on
 * the y-axis. These values are used for determining which grid cells to render and when
 * to add styles to the masonry container that maximize scroll performance.
 *
 * @param offset The vertical space in pixels between the top of the grid container and the top
 *  of the browser `document.documentElement`.
 * @param fps This determines how often (in frames per second) to update the scroll position of the
 *  browser `window` in state, and as a result the rate the masonry grid recalculates its visible cells.
 *  The default value of `12` has been very reasonable in my own testing, but if you have particularly
 *  heavy `render` components it may be prudent to reduce this number.
 */
export declare const useScroller: (
  offset?: number,
  fps?: number
) => {
  scrollTop: number
  isScrolling: boolean
}
/**
 * A hook for measuring the width of the grid container, as well as its distance
 * from the top of the document. These values are necessary to correctly calculate the number/width
 * of columns to render, as well as the number of rows to render.
 *
 * @param elementRef A `ref` object created by `React.useRef()`. That ref should be provided to the
 *   `containerRef` property in `useMasonry()`.
 * @param deps You can force this hook to recalculate the `offset` and `width` whenever this
 *   dependencies list changes. A common dependencies list might look like `[windowWidth, windowHeight]`,
 *   which would force the hook to recalculate any time the size of the browser `window` changed.
 */
export declare const useContainerPosition: (
  elementRef: React.MutableRefObject<HTMLElement | null>,
  deps?: React.DependencyList
) => ContainerPosition
export interface ContainerPosition {
  /**
   * The distance in pixels between the top of the element in `elementRef` and the top of
   * the `document.documentElement`.
   */
  offset: number
  /**
   * The `offsetWidth` of the element in `elementRef`.
   */
  width: number
}
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
export declare const usePositioner: (
  {width, columnWidth, columnGutter, columnCount}: UsePositionerOptions,
  deps?: React.DependencyList
) => Positioner
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
 * Creates a resize observer that forces updates to the grid cell positions when mutations are
 * made to cells affecting their height.
 *
 * @param positioner The masonry cell positioner created by the `usePositioner()` hook.
 */
export declare const useResizeObserver: (
  positioner: Positioner
) => ResizeObserver
/**
 * Creates a resize observer that fires an `updater` callback whenever the height of
 * one or many cells change. The `useResizeObserver()` hook is using this under the hood.
 *
 * @param positioner A cell positioner created by the `usePositioner()` hook or the `createPositioner()` utility
 * @param updater A callback that fires whenever one or many cell heights change.
 */
export declare const createResizeObserver: (
  positioner: Positioner,
  updater: (updates: number[]) => void
) => ResizeObserver
/**
 * A utility hook for seamlessly adding infinite scroll behavior to the `useMasonry()` hook. This
 * hook invokes a callback each time the last rendered index surpasses the total number of items
 * in your items array or the number defined in the `totalItems` option.
 *
 * @param loadMoreItems This callback is invoked when more rows must be loaded. It will be used to
 *  determine when to refresh the list with the newly-loaded data. This callback may be called multiple
 *  times in reaction to a single scroll event, so it's important to memoize its arguments. If you're
 *  creating this callback inside of a functional component, make sure you wrap it in `React.useCallback()`,
 *  as well.
 * @param options
 */
export declare function useInfiniteLoader<T extends LoadMoreItemsCallback>(
  loadMoreItems: T,
  options?: UseInfiniteLoaderOptions
): LoadMoreItemsCallback
export interface UseInfiniteLoaderOptions {
  /**
   *  A callback responsible for determining the loaded state of each item. Should return `true`
   * if the item has already been loaded and `false` if not.
   * @default (index: number, items: any[]) => boolean
   */
  isItemLoaded?: (index: number, items: any[]) => boolean
  /**
   * The minimum number of new items to be loaded at a time.  This property can be used to
   * batch requests and reduce HTTP requests.
   * @default 16
   */
  minimumBatchSize?: number
  /**
   * The threshold at which to pre-fetch data. A threshold X means that new data should start
   * loading when a user scrolls within X cells of the end of your `items` array.
   * @default 16
   */
  threshold?: number
  /**
   * The total number of items you'll need to eventually load (if known). This can
   * be arbitrarily high if not known.
   * @default 9e9
   */
  totalItems?: number
}
export declare type LoadMoreItemsCallback = (
  startIndex: number,
  stopIndex: number | undefined,
  items: any[]
) => any
/**
 * Creates a cell positioner for the `useMasonry()` hook. The `usePositioner()` hook uses
 * this utility under the hood.
 *
 * @param columnCount The number of columns in the grid
 * @param columnWidth The width of each column in the grid
 * @param columnGutter The amount of horizontal and vertical space in pixels to render
 *  between each grid item.
 */
export declare const createPositioner: (
  columnCount: number,
  columnWidth: number,
  columnGutter?: number
) => Positioner
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
