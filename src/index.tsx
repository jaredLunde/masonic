import React, {useCallback, useEffect, useState, useMemo, useRef} from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import trieMemoize from 'trie-memoize'
import OneKeyMap from '@essentials/one-key-map'
import memoizeOne from '@essentials/memoize-one'
import useLayoutEffect from '@react-hook/passive-layout-effect'
import useScrollPosition from '@react-hook/window-scroll'
import {useWindowSize} from '@react-hook/window-size'
import {requestTimeout, clearRequestTimeout} from '@essentials/request-timeout'
import createIntervalTree from './IntervalTree'

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
}: UseMasonry) => {
  const didMount = useRef('0')
  const stopIndex = useRef<number | undefined>()
  const startIndex = useRef(0)
  const setItemRef = getRefSetter(positioner, resizeObserver)
  const itemCount = items.length
  const {
    columnWidth,
    columnCount,
    range,
    estimateHeight,
    size,
    getShortestColumn,
  } = positioner
  const measuredCount = size()
  const shortestColumnSize = getShortestColumn()
  const children: React.ReactElement[] = []
  const itemRole = `${role}item`

  // Calls the onRender callback if the rendered indices changed
  useEffect(() => {
    didMount.current = '1'

    if (typeof onRender === 'function' && stopIndex.current !== void 0)
      onRender(startIndex.current, stopIndex.current, items)
    // eslint-disable-next-line
  }, [onRender, items, startIndex.current, stopIndex.current])

  overscanBy = height * overscanBy
  stopIndex.current = void 0

  range(
    Math.max(0, scrollTop - overscanBy),
    scrollTop + overscanBy,
    (index, left, top) => {
      if (stopIndex.current === void 0) {
        startIndex.current = index
        stopIndex.current = index
      } else {
        startIndex.current = Math.min(startIndex.current, index)
        stopIndex.current = Math.max(stopIndex.current, index)
      }

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
              ? assignUserItemStyle(phaseTwoStyle, itemStyle)
              : phaseTwoStyle
          }
        >
          {createRenderElement(RenderComponent, index, data, columnWidth)}
        </ItemComponent>
      )
    }
  )

  if (
    shortestColumnSize < scrollTop + overscanBy &&
    measuredCount < itemCount
  ) {
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
            typeof itemStyle === 'object' && itemStyle !== null
              ? assignUserItemStyle(phaseOneStyle, itemStyle)
              : phaseOneStyle
          }
        >
          {createRenderElement(RenderComponent, index, data, columnWidth)}
        </ItemComponent>
      )
    }
  }
  // gets the container style object based upon the estimated height and whether or not
  // the page is being scrolled
  const containerStyle = getContainerStyle(
    isScrolling,
    estimateHeight(itemCount, itemHeightEstimate)
  )

  return (
    <ContainerComponent
      ref={containerRef}
      key={didMount.current}
      id={id}
      role={role}
      className={className}
      tabIndex={tabIndex}
      style={
        typeof style === 'object' && style !== null
          ? assignUserStyle(containerStyle, style)
          : containerStyle
      }
      children={children}
    />
  )
}

const createRenderElement = trieMemoize(
  [WeakMap, [], WeakMap, {}],
  (RenderComponent, index, data, columnWidth) => (
    <RenderComponent index={index} data={data} columnWidth={columnWidth} />
  )
)

// We put this in its own layer because it's the thing that will trigger the most updates
// and we don't want to slower ourselves by cycling through all the functions, objects, and effects
// of other hooks
const MasonryScroller: React.FC<MasonryScrollerProps> = (props) => {
  const [scrollY, isScrolling] = useScroller(props.scrollFps)

  return useMasonry({
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
    scrollTop: Math.max(0, scrollY - (props.top || 0)),
    isScrolling,
    height: props.height,
    render: props.render,
  })
}

export const Masonry: React.FC<MasonryProps> = React.memo((props) => {
  const containerRef = useRef<null | HTMLElement>(null)
  const windowSize = useWindowSize(props)
  const containerPos = useContainerPosition(containerRef, windowSize)
  const nextProps = Object.assign(
    {
      top: containerPos.top,
      width: containerPos.width || windowSize[0],
      height: windowSize[1],
      containerRef,
    },
    props
  ) as any
  nextProps.positioner = usePositioner(nextProps)
  nextProps.resizeObserver = useResizeObserver(nextProps.positioner)
  return /*#__PURE__*/ React.createElement(MasonryScroller, nextProps)
})

interface UseMasonry {
  items: any[]
  positioner: Positioner
  resizeObserver?: ReturnType<typeof useResizeObserver>

  as?: keyof JSX.IntrinsicElements | React.ComponentType<any>
  id?: string
  className?: string
  style?: React.CSSProperties
  role?: string
  tabIndex?: number
  containerRef?:
    | ((element: HTMLElement) => void)
    | React.MutableRefObject<HTMLElement | null>

  itemAs?: keyof JSX.IntrinsicElements | React.ComponentType<any>
  itemStyle?: React.CSSProperties
  itemHeightEstimate?: number
  itemKey?: (data: any, index: number) => string | number
  overscanBy?: number

  height: number
  scrollTop: number
  isScrolling?: boolean

  render: React.ComponentType<any>
  onRender?: (
    startIndex: number,
    stopIndex: number | undefined,
    items: any[]
  ) => void
}

export interface MasonryProps
  extends Omit<
    UseMasonry,
    | 'scrollTop'
    | 'height'
    | 'isScrolling'
    | 'positioner'
    | 'resizeObserver'
    | 'containerRef'
  > {
  columnWidth?: number
  columnGutter?: number
  columnCount?: number
  initialWidth?: number
  initialHeight?: number
  scrollFps?: number
}

export interface MasonryScrollerProps
  extends Omit<
    MasonryProps,
    | 'columnWidth'
    | 'columnGutter'
    | 'columnCount'
    | 'initialWidth'
    | 'initialHeight'
  > {
  top?: number
  height: number
  containerRef?: UseMasonry['containerRef']
  positioner: Positioner
  resizeObserver: UseMasonry['resizeObserver']
}

export const List: React.FC<ListProps> = (props) =>
  /*#__PURE__*/ React.createElement(
    Masonry,
    Object.assign({role: 'list'}, props, {
      columnGutter: props.rowGutter,
      columnCount: 1,
      columnWidth: 1,
    })
  )

export interface ListProps extends MasonryProps {
  columnGutter?: never
  columnCount?: never
  columnWidth?: never
  rowGutter?: number
}

const emptyObj = {}
const emptyArr = []

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

const createPositioner = (
  columnCount: number,
  columnWidth: number,
  columnGutter = 0
): Positioner => {
  // O(log(n)) lookup of cells to render for a given viewport size
  // Store tops and bottoms of each cell for fast intersection lookup.
  const intervalTree = createIntervalTree()
  // Tracks the intervals that were inserted into the interval tree so they can be
  // removed when positions are updated
  const intervalValueMap: number[][] = []
  // Maps cell index to x coordinates for quick lookup.
  const leftMap: number[] = []
  // Tracks the height of each column
  const columnSizeMap: Record<string, number> = {}
  // Track the height of each column.
  // Layout algorithm below always inserts into the shortest column.
  const columnHeights = new Array(columnCount)
  // Used for O(1) item access
  const items: PositionerItem[] = []
  // Tracks the item indexes within an individual column
  const columnItems: number[][] = new Array(columnCount)

  for (let i = 0; i < columnCount; i++) {
    columnHeights[i] = 0
    columnItems[i] = []
  }

  const setPosition = (
    index: number,
    {top, left, height}: PositionerItem
  ): void => {
    const prevInterval = intervalValueMap[index]
    const prev = prevInterval !== void 0 && prevInterval[1]
    const next = top + height

    if (prevInterval !== void 0) intervalTree.remove.apply(null, prevInterval)
    intervalTree.insert(top, next, index)
    intervalValueMap[index] = [top, next, index]
    leftMap[index] = left
    const columnHeight = columnSizeMap[left]
    columnSizeMap[left] =
      columnHeight === prev ? next : Math.max(columnHeight || 0, next)
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
      setPosition(
        index,
        (items[index] = {
          left: column * (columnWidth + columnGutter),
          top,
          height,
          column,
        })
      )
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
        setPosition(index, item)
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
          const index = itemsInColumn[j],
            item = items[index]
          item.top = columnHeights[i]
          columnHeights[i] = item.top + item.height + columnGutter
          setPosition(index, item)
        }
      }
    },
    // Render all cells visible within the viewport range defined.
    range: (lo, hi, renderCallback) =>
      intervalTree.search(lo, hi, (index, top) =>
        renderCallback(index, leftMap[index], top)
      ),
    estimateHeight: (itemCount, defaultItemHeight): number => {
      const tallestColumn = Math.max(
        0,
        Math.max.apply(null, Object.values(columnSizeMap))
      )

      return itemCount === intervalTree.size
        ? tallestColumn
        : tallestColumn +
            Math.ceil((itemCount - intervalTree.size) / columnCount) *
              defaultItemHeight
    },
    getShortestColumn: () => {
      const sizes = Object.values(columnSizeMap)
      if (sizes.length > 1) return Math.min.apply(null, sizes)
      return sizes[0] || 0
    },
    size(): number {
      return intervalTree.size
    },
  }
}

export interface Positioner {
  columnCount: number
  columnWidth: number
  set: (index: number, height: number) => void
  get: (index: number) => PositionerItem | undefined
  update: (updates: number[]) => void
  range: (
    lo: number,
    hi: number,
    renderCallback: (index: number, left: number, top: number) => void
  ) => void
  size: () => number
  estimateHeight: (itemCount: number, defaultItemHeight: number) => number
  getShortestColumn: () => number
}

export interface PositionerItem {
  top: number
  left: number
  height: number
  column: number
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

const assignUserStyle = memoizeOne(
  (containerStyle, userStyle) => Object.assign({}, containerStyle, userStyle),
  (args, pargs) => args[0] === pargs[0] && args[1] === pargs[1]
)

const assignUserItemStyle = trieMemoize(
  [WeakMap, OneKeyMap],
  (itemStyle: React.CSSProperties, userStyle: React.CSSProperties) =>
    Object.assign({}, itemStyle, userStyle)
)

const defaultGetItemKey = (_: any[], i: number): number => i
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

const useForceUpdate = () => {
  const setState = useState(emptyObj)[1]
  return useRef(() => setState({})).current
}

const elementsCache: WeakMap<Element, number> = new WeakMap()

const getRefSetter = trieMemoize(
  [OneKeyMap, OneKeyMap],
  (positioner: Positioner, resizeObserver?: ResizeObserver) =>
    trieMemoize([[]], (index: number) => (el: HTMLElement | null): void => {
      if (el === null) return
      if (resizeObserver) resizeObserver.observe(el)
      elementsCache.set(el, index)
      if (positioner.get(index) === void 0)
        positioner.set(index, el.offsetHeight)
    })
)

export const useScroller = (fps = 12): [number, boolean] => {
  const scrollY = useScrollPosition(fps)
  const [isScrolling, setIsScrolling] = useState<boolean>(false)

  useEffect(() => {
    setIsScrolling(true)
    const to = requestTimeout(() => {
      // This is here to prevent premature bail outs while maintaining high resolution
      // unsets. Without it there will always bee a lot of unnecessary DOM writes to style.
      setIsScrolling(false)
    }, 40 + 1000 / fps)
    return () => clearRequestTimeout(to)
  }, [fps, scrollY])

  return [scrollY, isScrolling]
}

export const useContainerPosition = (
  element: React.MutableRefObject<HTMLElement | null>,
  deps: React.DependencyList = emptyArr
): ContainerPosition => {
  const [containerPosition, setContainerPosition] = useState<
    Omit<ContainerPosition, 'height'>
  >(defaultContainerPos)

  useLayoutEffect(() => {
    const {current} = element
    if (current !== null) {
      const rect = current.getBoundingClientRect()
      let top = 0
      let el = current

      do {
        top += el.offsetTop || 0
        el = el.offsetParent as HTMLElement
      } while (el)

      if (
        top !== containerPosition.top ||
        rect.width !== containerPosition.width
      ) {
        setContainerPosition({
          top,
          width: rect.width,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return containerPosition
}

interface ContainerPosition {
  top: number
  width: number
}

const defaultContainerPos = {top: 0, width: 0}

export const usePositioner = ({
  width,
  columnWidth = 200,
  columnGutter = 0,
  columnCount,
}: {
  width: number
  columnWidth?: number
  columnGutter?: number
  columnCount?: number
}): Positioner => {
  const initPositioner = (): Positioner => {
    const gutter = columnGutter
    const [computedColumnWidth, computedColumnCount] = getColumns(
      width,
      columnWidth,
      gutter,
      columnCount
    )
    return createPositioner(computedColumnCount, computedColumnWidth, gutter)
  }
  const [positioner, setPositioner] = useState<Positioner>(initPositioner)

  // Updates the item positions any time a prop potentially affecting their
  // size changes
  useLayoutEffect(() => {
    const cacheSize = positioner.size()
    const nextPositioner = initPositioner()

    for (let index = 0; index < cacheSize; index++) {
      const pos = positioner.get(index)
      nextPositioner.set(index, pos !== void 0 ? pos.height : 0)
    }

    setPositioner(nextPositioner)
    // eslint-disable-next-line
  }, [width, columnWidth, columnGutter, columnCount])

  return positioner
}

export const useResizeObserver = (positioner: Positioner) => {
  const forceUpdate = useForceUpdate()
  const resizeObserver = useMemo<ResizeObserver>(
    () =>
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
          forceUpdate()
        }
      }),
    [positioner, forceUpdate]
  )

  // Cleans up the resize observers when they change or the
  // component unmounts
  useEffect(() => () => resizeObserver.disconnect(), [resizeObserver])

  return resizeObserver
}

interface ResizeObserverEntryBoxSize {
  blockSize: number
  inlineSize: number
}

interface NativeResizeObserverEntry extends ResizeObserverEntry {
  borderBoxSize: ResizeObserverEntryBoxSize
  contentBoxSize: ResizeObserverEntryBoxSize
}

export function useInfiniteLoader<T extends LoadMoreItemsCallback>(
  /**
   * Callback to be invoked when more rows must be loaded.
   * It should implement the following signature: (startIndex, stopIndex, items): Promise
   * The returned Promise should be resolved once row data has finished loading.
   * It will be used to determine when to refresh the list with the newly-loaded data.
   * This callback may be called multiple times in reaction to a single scroll event.
   */
  loadMoreItems: T,
  options: InfiniteLoaderOptions = emptyObj
): LoadMoreItemsCallback {
  const {
    /**
     * Function responsible for tracking the loaded state of each row.
     * It should implement the following signature: (index): boolean
     */
    isItemLoaded = defaultIsItemLoaded,
    /**
     * Minimum number of rows to be loaded at a time.
     * This property can be used to batch requests to reduce HTTP requests.
     */
    minimumBatchSize = 16,
    /**
     * Threshold at which to pre-fetch data.
     * A threshold X means that data will start loading when a user scrolls within X rows.
     * This value defaults to 15.
     */
    threshold = 16,
    /**
     * The total number of items you'll need to eventually load (if known). This can
     * be arbitrarily high if not known.
     */
    totalItems = 9e9,
  } = options

  return useCallback(
    (startIndex, stopIndex, items) => {
      const unloadedRanges = scanForUnloadedRanges(
        isItemLoaded,
        minimumBatchSize,
        items,
        totalItems,
        Math.max(0, startIndex - threshold),
        Math.min(totalItems - 1, stopIndex + threshold)
      )
      // The user is responsible for memoizing their loadMoreItems() function
      // because we don't want to make assumptions about how they want to deal
      // with `items`
      for (let i = 0; i < unloadedRanges.length - 1; ++i)
        loadMoreItems(unloadedRanges[i], unloadedRanges[++i], items)
    },
    [loadMoreItems, totalItems, minimumBatchSize, threshold, isItemLoaded]
  )
}

/**
 * Returns all of the ranges within a larger range that contain unloaded rows.
 */
const scanForUnloadedRanges = (
  isItemLoaded: (index: number, items: any[]) => boolean,
  minimumBatchSize: number,
  items: any[],
  totalItems: number,
  startIndex: number,
  stopIndex: number
): number[] => {
  const unloadedRanges: number[] = []
  let rangeStartIndex, rangeStopIndex

  for (let index = startIndex; index <= stopIndex; index++) {
    const loaded = isItemLoaded(index, items)

    if (!loaded) {
      rangeStopIndex = index
      if (rangeStartIndex === void 0) {
        rangeStartIndex = index
      }
    } else if (rangeStopIndex !== void 0) {
      unloadedRanges.push(rangeStartIndex, rangeStopIndex)
      rangeStartIndex = rangeStopIndex = void 0
    }
  }

  // If :rangeStopIndex is not null it means we haven't ran out of unloaded rows.
  // Scan forward to try filling our :minimumBatchSize.
  if (rangeStopIndex !== void 0) {
    const potentialStopIndex = Math.min(
      Math.max(rangeStopIndex, rangeStartIndex + minimumBatchSize - 1),
      totalItems - 1
    )

    for (let index = rangeStopIndex + 1; index <= potentialStopIndex; index++) {
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

export interface InfiniteLoaderOptions {
  isItemLoaded?: (index: number, items: any[]) => boolean
  minimumBatchSize?: number
  threshold?: number
  totalItems?: number
}

export interface LoadMoreItemsCallback {
  (startIndex: number, stopIndex: number, items: any[]): void
}

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  Masonry.displayName = 'Masonry'
  List.displayName = 'List'
}
