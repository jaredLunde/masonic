import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
  useImperativeHandle,
} from 'react'
import {unstable_batchedUpdates} from 'react-dom'
import ResizeObserver from 'resize-observer-polyfill'
import trieMemoize from 'trie-memoize'
import OneKeyMap from '@essentials/one-key-map'
import memoizeOne from '@essentials/memoize-one'
import useLayoutEffect from '@react-hook/passive-layout-effect'
import useWindowScroll from '@react-hook/window-scroll'
import useWindowSize from '@react-hook/window-size'
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

interface IUpdatedItem {
  top: number
  left: number
  height: number
}

interface ItemPositioner {
  set: (index: number, height: number) => any
  get: (index: number | undefined) => any
  update: (updates: number[]) => (number | IUpdatedItem)[]
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
  const update = (updates: number[]): (number | IUpdatedItem)[] => {
    const columns: number[] = new Array(columnCount),
      updatedItems: (number | IUpdatedItem)[] = []
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

    if (prev !== false && prev > next && columnSizeMap[left] === prev)
      columnSizeMap[left] = next
    else {
      columnSizeMap[left] = Math.max(columnHeight || 0, next)
    }
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

export interface WindowScrollerOptions {
  size?: {
    wait?: number
  }
  scroll?: {
    fps?: number
  }
}

export interface WindowScrollerResult {
  width: number
  height: number
  scrollY: number
  isScrolling: boolean
}

const defaultSizeOpt = {wait: 120}

export const useWindowScroller = (
  initialWidth = 1280,
  initialHeight = 720,
  options: WindowScrollerOptions = emptyObj
): WindowScrollerResult => {
  const scrollY = useWindowScroll(options.scroll?.fps || 8)
  const [isScrolling, setIsScrolling] = useState<boolean>(false)
  const [width, height] = useWindowSize(
    initialWidth,
    initialHeight,
    options.size || defaultSizeOpt
  )

  useLayoutEffect(() => {
    if (!isScrolling) setIsScrolling(true)
    const to = window.setTimeout(() => {
      // This is here to prevent premature bail outs while maintaining high resolution
      // unsets. Without it there will always bee a lot of unnecessary DOM writes to style.
      setIsScrolling(false)
    }, 1000 / 6)
    return (): any => window.clearTimeout(to)
  }, [scrollY])

  return {width, height, scrollY, isScrolling}
}

const defaultRect = {top: 0, width: 0}
const getContainerRect = memoizeOne(
  (
    element: (element: HTMLElement) => void,
    width: number,
    top: number
  ): [ContainerRect, (element: HTMLElement) => void] => [{width, top}, element],
  (args, pargs) =>
    args[1] === pargs[1] && args[2] === pargs[2] && args[0] === pargs[0]
)

interface ContainerRect {
  top: number
  width: number
}

export const useContainerRect = (
  windowWidth: number,
  windowHeight: number
): [ContainerRect, (element: HTMLElement) => void] => {
  const [element, setElement] = useState<HTMLElement | null>(null)
  const [containerRect, setContainerRect] = useState<ContainerRect>(defaultRect)

  useLayoutEffect((): void | (() => void) => {
    if (element !== null) {
      const setRect = (): void => {
        // @ts-ignore
        const rect = element.getBoundingClientRect()
        if (
          rect.top !== containerRect.top ||
          rect.width !== containerRect.width
        ) {
          setContainerRect({top: rect.top, width: rect.width})
        }
      }
      setRect()
      // Got a better way to track changes to `top`?
      // Resize/MutationObserver() won't cover it I don't think (top)
      // Submit a PR
      const qi = window.setInterval(setRect, 360)
      return (): void => window.clearInterval(qi)
    }
  }, [windowWidth, windowHeight, containerRect, element])

  return getContainerRect(
    setElement,
    containerRect.width || windowWidth,
    containerRect.top
  )
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

export interface MasonryPropsBase {
  readonly columnWidth?: number
  readonly columnGutter?: number
  readonly columnCount?: number

  readonly as?: any
  readonly id?: string
  readonly className?: string
  readonly style?: React.CSSProperties
  readonly role?: string
  readonly tabIndex?: number | string
  readonly items: any[]
  readonly itemAs?: any
  readonly itemStyle?: React.CSSProperties
  readonly itemHeightEstimate?: number
  readonly itemKey?: (data: any, index: number) => string | number
  readonly overscanBy?: number
  readonly onRender?: (
    startIndex: number,
    stopIndex: number | undefined,
    items: any[]
  ) => void
  readonly render: any
}

export interface FreeMasonryProps extends MasonryPropsBase {
  readonly width: number // width of the container
  readonly height: number // height of the window
  readonly scrollTop: number
  readonly isScrolling?: boolean
  readonly containerRef?:
    | ((element: HTMLElement) => void)
    | React.MutableRefObject<HTMLElement | null>
}

const useForceUpdate = (): (() => void) => {
  const setState = useState<number>(0)[1]
  return useCallback(() => setState(current => ++current), emptyArr)
}

const elementsCache: WeakMap<Element, number> = new WeakMap()

interface ResizeObserverEntryBoxSize {
  /**
   * The length of the observed element's border box in the block dimension. For
   * boxes with a horizontal
   * [writing-mode](https://developer.mozilla.org/en-US/docs/Web/CSS/writing-mode),
   * this is the vertical dimension, or height; if the writing-mode is vertical,
   * this is the horizontal dimension, or width.
   */
  blockSize: number

  /**
   * The length of the observed element's border box in the inline dimension.
   * For boxes with a horizontal
   * [writing-mode](https://developer.mozilla.org/en-US/docs/Web/CSS/writing-mode),
   * this is the horizontal dimension, or width; if the writing-mode is
   * vertical, this is the vertical dimension, or height.
   */
  inlineSize: number
}

interface NativeResizeObserverEntry extends ResizeObserverEntry {
  borderBoxSize: ResizeObserverEntryBoxSize
  contentBoxSize: ResizeObserverEntryBoxSize
}

const getRefSetter = trieMemoize(
  [OneKeyMap, OneKeyMap, OneKeyMap],
  (
    resizeObserver: ResizeObserver,
    positionCache: PositionCache,
    itemPositioner: ItemPositioner
  ) =>
    trieMemoize([{}], index => (el: HTMLElement | null): void => {
      if (el === null) return
      resizeObserver.observe(el)
      elementsCache.set(el, index)

      if (itemPositioner.get(index) === void 0) {
        const item = itemPositioner.set(index, el.offsetHeight)
        positionCache.setPosition(index, item.left, item.top, item.height)
      }
    })
)

export const FreeMasonry: React.FC<FreeMasonryProps> = React.forwardRef(
  (
    {
      items,
      width,
      columnWidth,
      columnCount,
      columnGutter,
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
    },
    ref
  ) => {
    const didMount = useRef<string>('0')
    const initPositioner = (): ItemPositioner => {
      const gutter = columnGutter || 0
      const [computedColumnWidth, computedColumnCount] = getColumns(
        width,
        columnWidth || 200,
        gutter,
        columnCount
      )
      return createItemPositioner(
        computedColumnCount,
        computedColumnWidth,
        gutter
      )
    }
    const stopIndex = useRef<number | undefined>()
    const startIndex = useRef<number>(0)
    const [itemPositioner, setItemPositioner] = useState<ItemPositioner>(
      initPositioner
    )
    const [positionCache, setPositionCache] = useState<PositionCache>(
      createPositionCache
    )
    const forceUpdate = useForceUpdate()
    const resizeObserver = useMemo<ResizeObserver>(
      () =>
        new ResizeObserver(entries => {
          const updates: number[] = []

          for (let i = 0; i < entries.length; i++) {
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
              const item = updatedItems[i] as IUpdatedItem
              positionCache.setPosition(index, item.left, item.top, item.height)
            }

            forceUpdate()
          }
        }),
      [itemPositioner, positionCache]
    )

    // cleans up the resize observers when they change or the
    // component unmounts
    useEffect(() => resizeObserver.disconnect.bind(resizeObserver), [
      resizeObserver,
    ])
    // Calls the onRender callback if the rendered indices changed
    useEffect(() => {
      if (typeof onRender === 'function' && stopIndex.current !== void 0) {
        onRender(startIndex.current, stopIndex.current, items)
      }
    }, [items, startIndex.current, stopIndex.current])
    // Allows parent components to clear the position cache imperatively
    useImperativeHandle(
      ref,
      () => ({
        clearPositions: (): void => {
          setPositionCache(createPositionCache())
        },
      }),
      emptyArr
    )
    // Updates the item positions any time a prop potentially affecting their
    // size changes
    useLayoutEffect(() => {
      didMount.current = '1'
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
    }, [width, columnWidth, columnGutter, columnCount])

    const setItemRef = getRefSetter(
      resizeObserver,
      positionCache,
      itemPositioner
    )
    const itemCount = items.length
    const measuredCount = positionCache.size
    const shortestColumnSize = positionCache.getShortestColumnSize()
    const children: React.ReactElement[] = []
    const itemRole = `${role}item`
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

        const data = items[index],
          key = itemKey(data, index),
          observerStyle = getCachedItemStyle(
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
        const data = items[index],
          key = itemKey(data, index),
          observerStyle = getCachedSize(itemPositioner.columnWidth)

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
)

export interface MasonryProps extends MasonryPropsBase {
  readonly initialWidth?: number
  readonly initialHeight?: number
  readonly windowScroller?: WindowScrollerOptions
}

export const Masonry: React.FC<MasonryProps> = React.memo(
  React.forwardRef((props, ref) => {
    const {width, height, scrollY, isScrolling} = useWindowScroller(
        props.initialWidth,
        props.initialHeight,
        props.windowScroller
      ),
      [rect, containerRef] = useContainerRect(width, height)

    return React.createElement(
      FreeMasonry,
      Object.assign(
        {
          width: rect.width,
          height,
          scrollTop: Math.max(0, scrollY - (rect.top + scrollY)),
          isScrolling,
          containerRef,
          ref,
        },
        props
      )
    )
  })
)

export interface ListProps extends MasonryProps {
  columnGutter?: never
  columnCount?: never
  columnWidth?: never
  rowGutter?: number
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
    [totalItems, minimumBatchSize, threshold, isItemLoaded]
  )
}

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  Masonry.displayName = 'Masonry'
  FreeMasonry.displayName = 'FreeMasonry'
  List.displayName = 'List'
}
