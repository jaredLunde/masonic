import React, {useCallback, useEffect, useState, useRef} from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import trieMemoize from 'trie-memoize'
import OneKeyMap from '@essentials/one-key-map'
import memoizeOne from '@essentials/memoize-one'
import useLayoutEffect from '@react-hook/passive-layout-effect'
import useScrollPosition from '@react-hook/window-scroll'
import {useWindowSize} from '@react-hook/window-size'
import {requestTimeout, clearRequestTimeout} from '@essentials/request-timeout'
import createIntervalTree from './IntervalTree'

/**
 * This hook handles the render phases of the masonry layout and returns the grid as a React element.
 *
 * @param options Options for configuring the masonry layout renderer. See `UseMasonryOptions`.
 */
export const useMasonry = ({
  // Measurement and layout
  positioner,
  resizeObserver,
  // Grid items
  items,
  // Container props
  as: ContainerComponent = 'div',
  id,
  className,
  style,
  role = 'grid',
  tabIndex = 0,
  containerRef,
  // Item props
  itemAs: ItemComponent = 'div',
  itemStyle,
  itemHeightEstimate = 300,
  itemKey = defaultGetItemKey,
  // Rendering props
  overscanBy = 2,
  scrollTop,
  isScrolling,
  height,
  render: RenderComponent,
  onRender,
}: UseMasonryOptions) => {
  let startIndex = 0
  let stopIndex: number | undefined = void 0
  const forceUpdate = useForceUpdate()
  const setItemRef = getRefSetter(positioner, resizeObserver)
  const itemCount = items.length
  const {
    columnWidth,
    columnCount,
    range,
    estimateHeight,
    size,
    shortestColumn,
  } = positioner
  const measuredCount = size()
  const shortestColumnSize = shortestColumn()
  const children: React.ReactElement[] = []
  const itemRole = role + 'item'

  overscanBy = height * overscanBy
  const rangeEnd = scrollTop + overscanBy
  const needsFreshBatch =
    shortestColumnSize < rangeEnd && measuredCount < itemCount

  range(
    // We overscan in both directions because users scroll both ways,
    // though one must admit scrolling down is more common and thus
    // we only overscan by half the downward overscan amount
    Math.max(0, scrollTop - overscanBy / 2),
    rangeEnd,
    (index, left, top) => {
      const data = items[index]
      const key = itemKey(data, index)
      const phaseTwoStyle: React.CSSProperties = {
        top,
        left,
        width: columnWidth,
        writingMode: 'horizontal-tb',
        position: 'absolute',
      }

      children.push(
        <ItemComponent
          key={key}
          ref={setItemRef(index)}
          role={itemRole}
          style={
            typeof itemStyle === 'object' && itemStyle !== null
              ? Object.assign(phaseTwoStyle, itemStyle)
              : phaseTwoStyle
          }
        >
          {createRenderElement(RenderComponent, index, data, columnWidth)}
        </ItemComponent>
      )

      if (stopIndex === void 0) {
        startIndex = index
        stopIndex = index
      } else {
        startIndex = Math.min(startIndex, index)
        stopIndex = Math.max(stopIndex, index)
      }
    }
  )

  if (needsFreshBatch) {
    const batchSize = Math.min(
      itemCount - measuredCount,
      Math.ceil(
        ((scrollTop + overscanBy - shortestColumnSize) / itemHeightEstimate) *
          columnCount
      )
    )

    let index = measuredCount
    const phaseOneStyle = getCachedSize(columnWidth)

    for (; index < measuredCount + batchSize; index++) {
      const data = items[index]
      const key = itemKey(data, index)

      children.push(
        <ItemComponent
          key={key}
          ref={setItemRef(index)}
          role={itemRole}
          style={
            typeof itemStyle === 'object'
              ? Object.assign(phaseOneStyle, itemStyle)
              : phaseOneStyle
          }
        >
          {createRenderElement(RenderComponent, index, data, columnWidth)}
        </ItemComponent>
      )
    }
  }

  // Calls the onRender callback if the rendered indices changed
  useEffect(() => {
    if (typeof onRender === 'function' && stopIndex !== void 0)
      onRender(startIndex, stopIndex, items)

    didEverMount = '1'
  }, [startIndex, stopIndex, items, onRender])
  // If we needed a fresh batch we should reload our components with the measured
  // sizes
  useEffect(() => {
    if (needsFreshBatch) forceUpdate()
    // eslint-disable-next-line
  }, [needsFreshBatch])

  // gets the container style object based upon the estimated height and whether or not
  // the page is being scrolled
  const containerStyle = getContainerStyle(
    isScrolling,
    estimateHeight(itemCount, itemHeightEstimate)
  )

  return (
    <ContainerComponent
      ref={containerRef}
      key={didEverMount}
      id={id}
      role={role}
      className={className}
      tabIndex={tabIndex}
      style={
        typeof style === 'object'
          ? assignUserStyle(containerStyle, style)
          : containerStyle
      }
      children={children}
    />
  )
}

// This is for triggering a remount after SSR has loaded in the client w/ hydrate()
let didEverMount = '0'

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

//
// Render-phase utilities

// ~5.5x faster than createElement without the memo
const createRenderElement = trieMemoize(
  [OneKeyMap, {}, WeakMap, OneKeyMap],
  (RenderComponent, index, data, columnWidth) => (
    <RenderComponent index={index} data={data} width={columnWidth} />
  )
)

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

const getContainerStyle = memoizeOne(
  (isScrolling: boolean | undefined, estimateHeight: number) => ({
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    height: Math.ceil(estimateHeight),
    maxHeight: Math.ceil(estimateHeight),
    willChange: isScrolling ? 'contents' : void 0,
    pointerEvents: isScrolling ? 'none' : void 0,
  })
)

const cmp2 = (args: IArguments, pargs: IArguments | any[]): boolean =>
  args[0] === pargs[0] && args[1] === pargs[1]

const assignUserStyle = memoizeOne(
  (containerStyle, userStyle) => Object.assign({}, containerStyle, userStyle),
  // @ts-ignore
  cmp2
)

const defaultGetItemKey = (_: any[], i: number): typeof i => i
// the below memoizations for for ensuring shallow equal is reliable for pure
// component children
const getCachedSize = memoizeOne(
  (width: number): React.CSSProperties => ({
    width,
    zIndex: -1000,
    visibility: 'hidden',
    position: 'absolute',
    writingMode: 'horizontal-tb',
  }),
  (args, pargs) => args[0] === pargs[0]
)

const elementsCache: WeakMap<Element, number> = new WeakMap()

const getRefSetter = memoizeOne(
  (
    positioner: Positioner,
    resizeObserver?: UseMasonryOptions['resizeObserver']
  ) => (index: number) => (el: HTMLElement | null): void => {
    if (el === null) return
    if (resizeObserver) {
      resizeObserver.observe(el)
      elementsCache.set(el, index)
    }
    if (positioner.get(index) === void 0) positioner.set(index, el.offsetHeight)
  },
  // @ts-ignore
  cmp2
)

//
// Components

/**
 * A heavily-optimized component that updates `useMasonry()` when the scroll position of the browser `window`
 * changes. This bare-metal component is used by `<Masonry>` under the hood.
 */
export const MasonryScroller: React.FC<MasonryScrollerProps> = (props) => {
  // We put this in its own layer because it's the thing that will trigger the most updates
  // and we don't want to slower ourselves by cycling through all the functions, objects, and effects
  // of other hooks
  const {scrollTop, isScrolling} = useScroller(props.offset, props.scrollFps)
  // This is an update-heavy phase and while we could just Object.assign here,
  // it is way faster to inline and there's a relatively low hit to he bundle
  // size.
  return useMasonry({
    scrollTop,
    isScrolling,
    positioner: props.positioner,
    resizeObserver: props.resizeObserver,
    items: props.items,
    onRender: props.onRender,
    as: props.as,
    id: props.id,
    className: props.className,
    style: props.style,
    role: props.role,
    tabIndex: props.tabIndex,
    containerRef: props.containerRef,
    itemAs: props.itemAs,
    itemStyle: props.itemStyle,
    itemHeightEstimate: props.itemHeightEstimate,
    itemKey: props.itemKey,
    overscanBy: props.overscanBy,
    height: props.height,
    render: props.render,
  })
}

/**
 * A "batteries included" masonry grid which includes all of the implementation details below. This component is the
 * easiest way to get off and running in your app, before switching to more advanced implementations, if necessary.
 * It will change its column count to fit its container's width and will decide how many rows to render based upon
 * the height of the browser `window`.
 */
export const Masonry: React.FC<MasonryProps> = React.memo((props) => {
  const containerRef = useRef<null | HTMLElement>(null)
  const windowSize = useWindowSize({
    initialWidth: props.ssrWidth,
    initialHeight: props.ssrHeight,
  })
  const containerPos = useContainerPosition(containerRef, windowSize)
  const nextProps = Object.assign(
    {
      offset: containerPos.offset,
      width: containerPos.width || windowSize[0],
      height: windowSize[1],
      containerRef,
    },
    props
  ) as any
  nextProps.positioner = usePositioner(nextProps)
  nextProps.resizeObserver = useResizeObserver(nextProps.positioner)
  return React.createElement(MasonryScroller, nextProps)
})

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
export const List: React.FC<ListProps> = (props) =>
  React.createElement(
    Masonry,
    Object.assign({role: 'list'}, props, {
      columnGutter: props.rowGutter,
      columnCount: 1,
      columnWidth: 1,
    })
  )

export interface ListProps
  extends Omit<MasonryProps, 'columGutter' | 'columnCount' | 'columnWidth'> {
  /**
   * The amount of vertical space in pixels to add between the list cells.
   * @default 0
   */
  rowGutter?: number
}

const emptyObj = {}
const emptyArr: [] = []

//
// Hooks
const useForceUpdate = () => {
  const setState = useState(emptyObj)[1]
  return useRef(() => setState({})).current
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
export const useScroller = (
  offset = 0,
  fps = 12
): {scrollTop: number; isScrolling: boolean} => {
  const scrollTop = useScrollPosition(fps)
  const [isScrolling, setIsScrolling] = useState<boolean>(false)
  const didMount = useRef('0')

  useEffect(() => {
    if (didMount.current === '1') setIsScrolling(true)
    const to = requestTimeout(() => {
      // This is here to prevent premature bail outs while maintaining high resolution
      // unsets. Without it there will always bee a lot of unnecessary DOM writes to style.
      setIsScrolling(false)
    }, 40 + 1000 / fps)
    didMount.current = '1'
    return () => clearRequestTimeout(to)
  }, [fps, scrollTop])

  return {scrollTop: Math.max(0, scrollTop - offset), isScrolling}
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
export const useContainerPosition = (
  elementRef: React.MutableRefObject<HTMLElement | null>,
  deps: React.DependencyList = emptyArr
): ContainerPosition => {
  const [containerPosition, setContainerPosition] = useState<ContainerPosition>(
    {offset: 0, width: 0}
  )

  useLayoutEffect(() => {
    const {current} = elementRef
    if (current !== null) {
      let offset = 0
      let el = current

      do {
        offset += el.offsetTop || 0
        el = el.offsetParent as HTMLElement
      } while (el)

      if (
        offset !== containerPosition.offset ||
        current.offsetWidth !== containerPosition.width
      ) {
        setContainerPosition({
          offset,
          width: current.offsetWidth,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return containerPosition
}

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
export const usePositioner = (
  {
    width,
    columnWidth = 200,
    columnGutter = 0,
    columnCount,
  }: UsePositionerOptions,
  deps: React.DependencyList = emptyArr
): Positioner => {
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
  const [positioner, setPositioner] = useState<Positioner>(initPositioner)
  const didMount = useRef(0)

  // Create a new positioner when the dependencies change
  useEffect(() => {
    if (didMount.current) setPositioner(initPositioner())
    didMount.current = 1
    // eslint-disable-next-line
  }, deps)

  // Updates the item positions any time a prop potentially affecting their
  // size changes
  useLayoutEffect(() => {
    if (didMount.current) {
      const cacheSize = positioner.size()
      const nextPositioner = initPositioner()
      let index = 0

      for (; index < cacheSize; index++) {
        const pos = positioner.get(index)
        nextPositioner.set(index, pos !== void 0 ? pos.height : 0)
      }

      setPositioner(nextPositioner)
    }
    // eslint-disable-next-line
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
 * Creates a resize observer that forces updates to the grid cell positions when mutations are
 * made to cells affecting their height.
 *
 * @param positioner The masonry cell positioner created by the `usePositioner()` hook.
 */
export const useResizeObserver = (positioner: Positioner) => {
  const forceUpdate = useForceUpdate()
  const resizeObserver = createResizeObserver(positioner, forceUpdate)
  // Cleans up the resize observers when they change or the
  // component unmounts
  useEffect(() => () => resizeObserver.disconnect(), [resizeObserver])
  return resizeObserver
}

/**
 * Creates a resize observer that fires an `updater` callback whenever the height of
 * one or many cells change. The `useResizeObserver()` hook is using this under the hood.
 *
 * @param positioner A cell positioner created by the `usePositioner()` hook or the `createPositioner()` utility
 * @param updater A callback that fires whenever one or many cell heights change.
 */
export const createResizeObserver = trieMemoize(
  [WeakMap],
  // TODO: figure out a way to test this
  /* istanbul ignore next */
  (positioner: Positioner, updater: (updates: number[]) => void) =>
    new ResizeObserver((entries) => {
      const updates: number[] = []
      let i = 0

      for (; i < entries.length; i++) {
        const entry = entries[i]
        // There are native resize observers that still don't have
        // the borderBoxSize property. For those we fallback to the
        // offset height of the target element.
        const height =
          (entry as NativeResizeObserverEntry).borderBoxSize !== void 0
            ? (entry as NativeResizeObserverEntry).borderBoxSize.blockSize
            : (entry.target as HTMLElement).offsetHeight
        if (height > 0) {
          const index = elementsCache.get(entry.target)

          if (index !== void 0) {
            const position = positioner.get(index)

            if (position !== void 0 && height !== position.height)
              updates.push(index, height)
          }
        }
      }

      if (updates.length > 0) {
        // Updates the size/positions of the cell with the resize
        // observer updates
        positioner.update(updates)
        updater(updates)
      }
    })
)

interface ResizeObserverEntryBoxSize {
  blockSize: number
  inlineSize: number
}

interface NativeResizeObserverEntry extends ResizeObserverEntry {
  borderBoxSize: ResizeObserverEntryBoxSize
  contentBoxSize: ResizeObserverEntryBoxSize
}

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
export function useInfiniteLoader<T extends LoadMoreItemsCallback>(
  loadMoreItems: T,
  options: UseInfiniteLoaderOptions = emptyObj
): LoadMoreItemsCallback {
  const {
    isItemLoaded,
    minimumBatchSize = 16,
    threshold = 16,
    totalItems = 9e9,
  } = options
  const storedLoadMoreItems = useRef(loadMoreItems)
  const storedIsItemLoaded = useRef(isItemLoaded)
  storedLoadMoreItems.current = loadMoreItems
  storedIsItemLoaded.current = isItemLoaded

  return useCallback(
    (startIndex, stopIndex, items) => {
      const unloadedRanges = scanForUnloadedRanges(
        storedIsItemLoaded.current,
        minimumBatchSize,
        items,
        totalItems,
        Math.max(0, startIndex - threshold),
        Math.min(totalItems - 1, stopIndex || 0 + threshold)
      )
      // The user is responsible for memoizing their loadMoreItems() function
      // because we don't want to make assumptions about how they want to deal
      // with `items`
      for (let i = 0; i < unloadedRanges.length - 1; ++i)
        storedLoadMoreItems.current(
          unloadedRanges[i],
          unloadedRanges[++i],
          items
        )
    },
    [totalItems, minimumBatchSize, threshold]
  )
}

/**
 * Returns all of the ranges within a larger range that contain unloaded rows.
 */
const scanForUnloadedRanges = (
  isItemLoaded: UseInfiniteLoaderOptions['isItemLoaded'] = defaultIsItemLoaded,
  minimumBatchSize: UseInfiniteLoaderOptions['minimumBatchSize'] = 16,
  items: any[],
  totalItems: UseInfiniteLoaderOptions['totalItems'] = 9e9,
  startIndex: number,
  stopIndex: number
): number[] => {
  const unloadedRanges: number[] = []
  let rangeStartIndex: number | undefined,
    rangeStopIndex: number | undefined,
    index = startIndex

  for (; index <= stopIndex; index++) {
    if (!isItemLoaded(index, items)) {
      rangeStopIndex = index
      if (rangeStartIndex === void 0) rangeStartIndex = index
    } else if (rangeStartIndex !== void 0 && rangeStopIndex !== void 0) {
      unloadedRanges.push(rangeStartIndex, rangeStopIndex)
      rangeStartIndex = rangeStopIndex = void 0
    }
  }

  // If :rangeStopIndex is not null it means we haven't run out of unloaded rows.
  // Scan forward to try filling our :minimumBatchSize.
  if (rangeStartIndex !== void 0 && rangeStopIndex !== void 0) {
    const potentialStopIndex = Math.min(
      Math.max(rangeStopIndex, rangeStartIndex + minimumBatchSize - 1),
      totalItems - 1
    )

    for (index = rangeStopIndex + 1; index <= potentialStopIndex; index++) {
      if (!isItemLoaded(index, items)) {
        rangeStopIndex = index
      } else {
        break
      }
    }

    unloadedRanges.push(rangeStartIndex, rangeStopIndex)
  }

  // Check to see if our first range ended prematurely.
  // In this case we should scan backwards to try filling our :minimumBatchSize.
  /* istanbul ignore next */
  if (unloadedRanges.length) {
    let firstUnloadedStart = unloadedRanges[0]
    const firstUnloadedStop = unloadedRanges[1]

    while (
      firstUnloadedStop - firstUnloadedStart + 1 < minimumBatchSize &&
      firstUnloadedStart > 0
    ) {
      const index = firstUnloadedStart - 1

      if (!isItemLoaded(index, items)) {
        unloadedRanges[0] = firstUnloadedStart = index
      } else {
        break
      }
    }
  }

  return unloadedRanges
}

const defaultIsItemLoaded = (index: number, items: any[]): boolean =>
  items[index] !== void 0

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

export type LoadMoreItemsCallback = (
  startIndex: number,
  stopIndex: number,
  items: any[]
) => any

//
// Utilities

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

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  Masonry.displayName = 'Masonry'
  MasonryScroller.displayName = 'MasonryScroller'
  List.displayName = 'List'
}
