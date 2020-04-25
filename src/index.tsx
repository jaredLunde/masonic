import React, {useCallback, useEffect, useState, useMemo, useRef} from 'react'
import {unstable_batchedUpdates} from 'react-dom'
import ResizeObserver from 'resize-observer-polyfill'
import trieMemoize from 'trie-memoize'
import OneKeyMap from '@essentials/one-key-map'
import memoizeOne from '@essentials/memoize-one'
import useLayoutEffect from '@react-hook/passive-layout-effect'
import useScrollPosition from '@react-hook/window-scroll'
import {
  useWindowSize,
  DebouncedWindowSizeOptions,
} from '@react-hook/window-size'
import {requestTimeout, clearRequestTimeout} from '@essentials/request-timeout'
import createIntervalTree from './IntervalTree'

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

interface UpdatedItem {
  top: number
  left: number
  height: number
}

interface ItemPositioner {
  set: (index: number, height: number) => any
  get: (index: number | undefined) => any
  update: (updates: number[]) => (number | UpdatedItem)[]
  columnCount: number
  columnWidth: number
  columnGutter: number
}

const createItemPositioner = (
  columnCount: number,
  columnWidth: number,
  columnGutter = 0
): ItemPositioner => {
  // Track the height of each column.
  // Layout algorithm below always inserts into the shortest column.
  const columnHeights = new Array(columnCount),
    items: Record<number, any> = {},
    columnItems: number[][] = new Array(columnCount)

  for (let i = 0; i < columnCount; i++) {
    columnHeights[i] = 0
    columnItems[i] = []
  }

  const set = (index: number, height = 0): any => {
    let column = 0

    // finds the shortest column and uses it
    for (let i = 1; i < columnHeights.length; i++) {
      if (columnHeights[i] < columnHeights[column]) column = i
    }

    const left = column * (columnWidth + columnGutter),
      top = columnHeights[column] || 0,
      item = {left, top, height, column}

    columnHeights[column] = top + height + columnGutter
    items[index] = item
    columnItems[column].push(index)
    return item
  }

  // this only updates items in the specific columns that have changed, on and after the
  // specific items that have changed
  const update = (updates: number[]): (number | UpdatedItem)[] => {
    const columns: number[] = new Array(columnCount),
      updatedItems: (number | UpdatedItem)[] = []
    let i = 0,
      j = 0

    // determines which columns have items that changed, as well as the minimum index
    // changed in that column, as all items after that index will have their positions
    // affected by the change
    for (; i < updates.length - 1; i++) {
      const index = updates[i],
        item = items[index]
      item.height = updates[++i]
      columns[item.column] =
        columns[item.column] === void 0
          ? index
          : Math.min(index, columns[item.column])
    }

    for (i = 0; i < columns.length; i++) {
      // bails out if the column didn't change
      if (columns[i] === void 0) continue

      const itemsInColumn = columnItems[i],
        // the index order is sorted with certainty so binary search is a great solution
        // here as opposed to Array.indexOf()
        startIndex = binarySearch(itemsInColumn, columns[i]),
        index = columnItems[i][startIndex],
        startItem = items[index]

      columnHeights[i] = startItem.top + startItem.height + columnGutter
      updatedItems.push(index, startItem)

      for (j = startIndex + 1; j < itemsInColumn.length; j++) {
        const index = itemsInColumn[j],
          item = items[index]
        item.top = columnHeights[i]
        columnHeights[i] = item.top + item.height + columnGutter
        updatedItems.push(index, item)
      }
    }

    return updatedItems
  }

  return {
    set,
    get: (index: number | undefined): any =>
      index === void 0 ? index : items[index],
    update,
    columnCount,
    columnWidth,
    columnGutter,
  }
}

// Position cache requirements:
interface PositionCache {
  range: (
    lo: number,
    hi: number,
    renderCallback: (index: number, left: number, top: number) => void
  ) => void
  size: number
  estimateTotalHeight: (
    itemCount: number,
    columnCount: number,
    defaultItemHeight: number
  ) => number
  getShortestColumnSize: () => number
  setPosition: (
    index: number,
    left: number,
    top: number,
    height: number
  ) => void
}

//   O(log(n)) lookup of cells to render for a given viewport size
//   O(1) lookup of shortest measured column (so we know when to enter phase 1)
const createPositionCache = (): PositionCache => {
  // Store tops and bottoms of each cell for fast intersection lookup.
  const intervalTree = createIntervalTree(),
    // Tracks the intervals that were inserted into the interval tree so they can be
    // removed when positions are updated
    intervalValueMap: number[][] = [],
    // Maps cell index to x coordinates for quick lookup.
    leftMap: number[] = [],
    // Tracks the height of each column
    columnSizeMap = {}

  const estimateTotalHeight = (
    itemCount: number,
    columnCount: number,
    defaultItemHeight: number
  ): number =>
    itemCount === intervalTree.size
      ? getTallestColumnSize()
      : getTallestColumnSize() +
        Math.ceil((itemCount - intervalTree.size) / columnCount) *
          defaultItemHeight

  // Render all cells visible within the viewport range defined.
  const range = (
    lo: number,
    hi: number,
    renderCallback: (index: number, left: number, top: number) => void
  ): void => {
    intervalTree.search(lo, hi, (index, top) =>
      renderCallback(index, leftMap[index], top)
    )
  }

  const setPosition = (
    index: number,
    left: number,
    top: number,
    height: number
  ): void => {
    const prevInterval = intervalValueMap[index],
      prev = prevInterval !== void 0 && prevInterval[1],
      next = top + height

    if (prevInterval !== void 0) intervalTree.remove.apply(null, prevInterval)
    intervalTree.insert(top, next, index)
    intervalValueMap[index] = [top, next, index]
    leftMap[index] = left

    const columnHeight = columnSizeMap[left]
    columnSizeMap[left] =
      columnHeight === prev ? next : Math.max(columnHeight || 0, next)
  }

  const getShortestColumnSize = (): number => {
    const keys = Object.keys(columnSizeMap)
    let size = columnSizeMap[keys[0]],
      i = 1

    if (size !== void 0 && keys.length > 1) {
      for (; i < keys.length; i++) {
        const height = columnSizeMap[keys[i]]
        size = size < height ? size : height
      }
    }

    return size || 0
  }

  const getTallestColumnSize = (): number =>
    Math.max(0, Math.max.apply(null, Object.values(columnSizeMap)))

  return {
    range,
    get size(): number {
      return intervalTree.size
    },
    estimateTotalHeight,
    getShortestColumnSize,
    setPosition,
  }
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
  (isScrolling: boolean | undefined, estimateTotalHeight: number) => ({
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    height: Math.ceil(estimateTotalHeight),
    maxHeight: Math.ceil(estimateTotalHeight),
    willChange: isScrolling ? 'contents, height' : void 0,
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
const getCachedItemStyle = trieMemoize(
  [OneKeyMap, Map, Map],
  (width: number, left: number, top: number): React.CSSProperties => ({
    top,
    left,
    width,
    writingMode: 'horizontal-tb',
    position: 'absolute',
  })
)

const useForceUpdate = (): (() => void) => {
  const setState = useState<{}>({})[1]
  // eslint-disable-next-line
  return useCallback(() => setState({}), emptyArr)
}

const elementsCache: WeakMap<Element, number> = new WeakMap()

const getRefSetter = trieMemoize(
  [OneKeyMap, OneKeyMap, OneKeyMap],
  (
    positionCache: PositionCache,
    itemPositioner: ItemPositioner,
    resizeObserver?: ResizeObserver
  ) =>
    trieMemoize([{}], (index: number) => (el: HTMLElement | null): void => {
      if (el === null) return
      resizeObserver?.observe?.(el)
      elementsCache.set(el, index)

      if (itemPositioner.get(index) === void 0) {
        const item = itemPositioner.set(index, el.offsetHeight)
        positionCache.setPosition(index, item.left, item.top, item.height)
      }
    })
)

export const useScroller = (fps = 6): [number, boolean] => {
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
    // eslint-disable-next-line
  }, [scrollY])

  return [scrollY, isScrolling]
}

export const useContainerPosition = (
  deps: React.DependencyList = emptyArr
): [ContainerPosition, (element: HTMLElement) => void] => {
  const [element, setElement] = useState<HTMLElement | null>(null)
  const [containerPosition, setContainerPosition] = useState<
    Omit<ContainerPosition, 'height'>
  >(defaultRect)

  useLayoutEffect((): void | (() => void) => {
    if (element !== null) {
      const rect = element.getBoundingClientRect()
      let top = 0
      let el = element

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
  }, [element].concat(deps))

  return getContainerSize(
    setElement,
    containerPosition.width,
    containerPosition.top
  )
}

interface ContainerPosition {
  top: number
  width: number
}

const defaultRect = {top: 0, width: 0, height: 0}
const getContainerSize = memoizeOne(
  (
    element: (element: HTMLElement) => void,
    width: number,
    top: number
  ): [ContainerPosition, (element: HTMLElement) => void] => [
    {width, top},
    element,
  ],
  (args, pargs) =>
    args[1] === pargs[1] && args[2] === pargs[2] && args[0] === pargs[0]
)

export const usePositioner = ({
  width,
  columnWidth = 200,
  columnGutter = 0,
  columnCount,
}: FreeMasonryProps): [ItemPositioner, PositionCache] => {
  const initPositioner = (): ItemPositioner => {
    const gutter = columnGutter
    const [computedColumnWidth, computedColumnCount] = getColumns(
      width,
      columnWidth,
      gutter,
      columnCount
    )
    return createItemPositioner(
      computedColumnCount,
      computedColumnWidth,
      gutter
    )
  }
  const [itemPositioner, setItemPositioner] = useState<ItemPositioner>(
    initPositioner
  )
  const [positionCache, setPositionCache] = useState<PositionCache>(
    createPositionCache
  )

  // Updates the item positions any time a prop potentially affecting their
  // size changes
  useLayoutEffect(() => {
    const cacheSize = positionCache.size
    const nextPositionCache = createPositionCache()
    const nextItemPositioner = initPositioner()
    const stateUpdates = (): void => {
      setPositionCache(nextPositionCache)
      setItemPositioner(nextItemPositioner)
    }

    if (typeof unstable_batchedUpdates === 'function') {
      unstable_batchedUpdates(stateUpdates)
    } else {
      stateUpdates()
    }

    for (let index = 0; index < cacheSize; index++) {
      const pos = itemPositioner.get(index)

      if (pos !== void 0) {
        const item = nextItemPositioner.set(index, pos.height)
        nextPositionCache.setPosition(index, item.left, item.top, pos.height)
      }
    }
    // eslint-disable-next-line
  }, [width, columnWidth, columnGutter, columnCount])

  return [itemPositioner, positionCache]
}

export const useResizeObserver = (
  itemPositioner: ItemPositioner,
  positionCache: PositionCache
) => {
  const forceUpdate = useForceUpdate()
  const resizeObserver = useMemo<ResizeObserver>(
    () =>
      new ResizeObserver(entries => {
        const updates: number[] = []
        let i = 0
        const len = entries.length

        for (; i < len; i++) {
          const entry = entries[i]
          // There are native resize observers that still don't have
          // the borderBoxSize property. For those we fallback to the
          // offset height of the target element.
          const hasBorderBox =
            (entry as NativeResizeObserverEntry).borderBoxSize !== void 0
          const height = hasBorderBox
            ? (entry as NativeResizeObserverEntry).borderBoxSize.blockSize
            : (entry.target as HTMLElement).offsetHeight

          if (height > 0) {
            const index = elementsCache.get(entry.target)
            const position = itemPositioner.get(index)

            if (
              position !== void 0 &&
              index !== void 0 &&
              height !== position.height
            ) {
              updates.push(index, height)
            }
          }
        }

        if (updates.length > 0) {
          // Updates the size/positions of the cell with the resize
          // observer updates
          const updatedItems = itemPositioner.update(updates)
          for (let i = 0; i < updatedItems.length; i++) {
            const index = updatedItems[i++] as number
            const item = updatedItems[i] as UpdatedItem
            positionCache.setPosition(index, item.left, item.top, item.height)
          }

          forceUpdate()
        }
      }),
    // eslint-disable-next-line
    [itemPositioner, positionCache]
  )

  // Cleans up the resize observers when they change or the
  // component unmounts
  useEffect(() => resizeObserver.disconnect.bind(resizeObserver), [
    resizeObserver,
  ])

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

export const useMasonry = ({
  items,
  onRender,

  as = 'div',
  id,
  className,
  style,
  role = 'grid',
  tabIndex = 0,
  containerRef,
  itemAs = 'div',
  itemStyle,
  itemHeightEstimate = 300,
  itemKey = defaultGetItemKey,
  overscanBy = 2,

  scrollTop,
  isScrolling,
  height,

  render,

  resizeObserver,
  positionCache,
  itemPositioner,
}: FreeMasonryProps) => {
  const didMount = useRef('0')
  const stopIndex = useRef<number | undefined>()
  const startIndex = useRef(0)
  const setItemRef = getRefSetter(positionCache, itemPositioner, resizeObserver)
  const itemCount = items.length
  const measuredCount = positionCache.size
  const shortestColumnSize = positionCache.getShortestColumnSize()
  const children: React.ReactElement[] = []
  const itemRole = `${role}item`

  // Calls the onRender callback if the rendered indices changed
  useEffect(() => {
    didMount.current = '1'

    if (typeof onRender === 'function' && stopIndex.current !== void 0) {
      onRender(startIndex.current, stopIndex.current, items)
    }
    // eslint-disable-next-line
  }, [onRender, items, startIndex.current, stopIndex.current])

  overscanBy = height * overscanBy
  stopIndex.current = void 0

  positionCache.range(
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
      const observerStyle = getCachedItemStyle(
        itemPositioner.columnWidth,
        left,
        top
      )

      children.push(
        React.createElement(
          itemAs,
          {
            key,
            ref: setItemRef(index),
            role: itemRole,
            style:
              typeof itemStyle === 'object' && itemStyle !== null
                ? assignUserItemStyle(observerStyle, itemStyle)
                : observerStyle,
          },
          React.createElement(render, {
            key,
            index,
            data,
            width: itemPositioner.columnWidth,
          })
        )
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
          itemPositioner.columnCount
      )
    )

    let index = measuredCount

    for (; index < measuredCount + batchSize; index++) {
      const data = items[index]
      const key = itemKey(data, index)
      const observerStyle = getCachedSize(itemPositioner.columnWidth)

      children.push(
        React.createElement(
          itemAs,
          {
            key,
            ref: setItemRef(index),
            role: itemRole,
            style:
              typeof itemStyle === 'object' && itemStyle !== null
                ? assignUserItemStyle(observerStyle, itemStyle)
                : observerStyle,
          },
          React.createElement(render, {
            key,
            index,
            data,
            width: itemPositioner.columnWidth,
          })
        )
      )
    }
  }
  // gets the container style object based upon the estimated height and whether or not
  // the page is being scrolled
  const containerStyle = getContainerStyle(
    isScrolling,
    positionCache.estimateTotalHeight(
      itemCount,
      itemPositioner.columnCount,
      itemHeightEstimate
    )
  )

  return React.createElement(as, {
    ref: containerRef,
    id,
    key: didMount.current,
    role,
    className,
    tabIndex,
    style:
      typeof style === 'object' && style !== null
        ? assignUserStyle(containerStyle, style)
        : containerStyle,
    children,
  })
}

// We put this in its own layer because it's the thing that will trigger the most updates
// and we don't want to slower ourselves by cycling through all the functions, objects, and effects
// of other hooks
const MasonryScroller: React.FC<MasonryProps & {
  top?: number
}> = props => {
  const [scrollY, isScrolling] = useScroller(props.scrollerFps)

  return useMasonry(
    Object.assign(
      {
        scrollTop: Math.max(0, scrollY - props.top),
        isScrolling,
      },
      props
    )
  )
}

export const Masonry: React.FC<MasonryProps> = React.memo(props => {
  const windowSize = useWindowSize({
    initialWidth: props.initialWidth || 1280,
    initialHeight: props.initialHeight || 720,
  })
  const [rect, containerRef] = useContainerPosition(windowSize)
  const nextProps = Object.assign(
    {
      top: rect.top,
      width: rect.width || windowSize[0],
      height: windowSize[1],
      containerRef,
    },
    props
  ) as FreeMasonryProps
  const [itemPositioner, positionCache] = usePositioner(nextProps)
  const resizeObserver = useResizeObserver(itemPositioner, positionCache)
  nextProps.resizeObserver = resizeObserver
  nextProps.itemPositioner = itemPositioner
  nextProps.positionCache = positionCache
  return React.createElement(MasonryScroller, nextProps)
})

export interface MasonryPropsBase {
  columnWidth?: number
  columnGutter?: number
  columnCount?: number

  as?: any
  id?: string
  className?: string
  style?: React.CSSProperties
  role?: string
  tabIndex?: number | string

  items: any[]
  itemAs?: any
  itemStyle?: React.CSSProperties
  itemHeightEstimate?: number
  itemKey?: (data: any, index: number) => string | number
  overscanBy?: number

  onRender?: (
    startIndex: number,
    stopIndex: number | undefined,
    items: any[]
  ) => void
  render: any
}

interface FreeMasonryProps extends MasonryPropsBase {
  width: number // width of the container
  height: number // height of the window
  top?: number
  scrollTop: number
  isScrolling?: boolean
  containerRef?:
    | ((element: HTMLElement) => void)
    | React.MutableRefObject<HTMLElement | null>
  resizeObserver?: ReturnType<typeof useResizeObserver>
  positionCache: PositionCache
  itemPositioner: ItemPositioner
}

export interface MasonryProps extends MasonryPropsBase {
  initialWidth?: number
  initialHeight?: number
  scrollerFps?: number
}

export const List: React.FC<ListProps> = props =>
  React.createElement(
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
      // the user is responsible for memoizing their loadMoreItems() function
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
  // FreeMasonry.displayName = 'FreeMasonry'
  List.displayName = 'List'
}
