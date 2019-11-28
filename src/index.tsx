import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useImperativeHandle,
} from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import trieMemoize from 'trie-memoize'
import OneKeyMap from '@essentials/one-key-map'
import memoizeOne from '@essentials/memoize-one'
import useLayoutEffect from '@react-hook/passive-layout-effect'
import useWindowScroll from '@react-hook/window-scroll'
import useWindowSize from '@react-hook/window-size'
import IntervalTree from './IntervalTree'

const defaultScrollFps = 8
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

interface ItemPositioner {
  set: (index: number, height: number) => any
  get: (index: number | undefined) => any
  update
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
  const update = (updates: number[]): number[] => {
    const columns: number[] = new Array(columnCount),
      updatedItems: number[] = []
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
  getSize: () => number
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
  updatePosition: (
    index: number,
    left: number,
    top: number,
    height: number
  ) => void
}

//   O(log(n)) lookup of cells to render for a given viewport size
//   O(1) lookup of shortest measured column (so we know when to enter phase 1)
const createPositionCache = (): PositionCache => {
  let count = 0
  // Store tops and bottoms of each cell for fast intersection lookup.
  const intervalTree = new IntervalTree(),
    // Tracks the intervals that were inserted into the interval tree so they can be
    // removed when positions are updated
    intervalValueMap = {},
    // Maps cell index to x coordinates for quick lookup.
    leftMap = {},
    // Tracks the height of each column
    columnSizeMap = {}

  const estimateTotalHeight = (
    itemCount: number,
    columnCount: number,
    defaultItemHeight: number
  ): number =>
    getTallestColumnSize() +
    Math.ceil((itemCount - count) / columnCount) * defaultItemHeight

  // Render all cells visible within the viewport range defined.
  const range = (
    lo: number,
    hi: number,
    renderCallback: (index: number, left: number, top: number) => void
  ): void => {
    intervalTree.queryInterval(lo, hi, r =>
      renderCallback(r[2] /*index*/, leftMap[r[2] /*index*/], r[0] /*top*/)
    )
  }

  const setPosition = (
    index: number,
    left: number,
    top: number,
    height: number
  ): void => {
    const interval = [top, top + height, index]
    intervalTree.insert(interval)
    intervalValueMap[index] = interval
    leftMap[index] = left
    const columnHeight = columnSizeMap[left]

    if (columnHeight === void 0) {
      height = top + height
      columnSizeMap[left] = height
    } else {
      height = Math.max(columnHeight, top + height)
      columnSizeMap[left] = height
    }

    count = intervalTree.count
  }

  // updates the position of an item in the interval tree
  const updatePosition = (
    index: number,
    left: number,
    top: number,
    height: number
  ): void => {
    const prevInterval = intervalValueMap[index],
      prev = prevInterval[1],
      next = top + height

    intervalTree.remove(prevInterval)
    const interval = [top, next, index]
    intervalTree.insert(interval)
    intervalValueMap[index] = interval

    const columnHeight = columnSizeMap[left]

    if (prev > next) {
      if (columnSizeMap[left] === prev) {
        columnSizeMap[left] = next
      }
    } else {
      columnSizeMap[left] = Math.max(columnHeight, next)
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
    getSize: (): number => count,
    estimateTotalHeight,
    getShortestColumnSize,
    setPosition,
    updatePosition,
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
  initialWidth: number,
  initialHeight: number,
  options: WindowScrollerOptions = emptyObj
): WindowScrollerResult => {
  const fps = options.scroll?.fps || defaultScrollFps
  const scrollY = useWindowScroll(fps)
  const [width, height] = useWindowSize(
    initialWidth,
    initialHeight,
    options.size || defaultSizeOpt
  )
  const [isScrolling, setIsScrolling] = useState<boolean>(false)
  const isScrollingTimeout = useRef<number | undefined>()

  useLayoutEffect(() => {
    if (isScrollingTimeout.current !== null) {
      clearTimeout(isScrollingTimeout.current)
      isScrollingTimeout.current = void 0
    }

    setIsScrolling(true)
    isScrollingTimeout.current = window.setTimeout(() => {
      // This is here to prevent premature bail outs while maintaining high resolution
      // unsets. Without it there will always bee a lot of unnecessary DOM writes to style.
      setIsScrolling(false)
      isScrollingTimeout.current = void 0
    }, 1000 / 6)
  }, [scrollY])
  // cleans up isScrollingTimeout on unmount
  useEffect(
    () => (): void => {
      isScrollingTimeout.current !== void 0 &&
        window.clearTimeout(isScrollingTimeout.current)
    },
    emptyArr
  )

  return {width, height, scrollY, isScrolling}
}

const defaultRect = {top: 0, width: 0}
const getContainerRect = memoizeOne(
  (element, width, top) => [{width, top}, element],
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
  const [element, setElement] = useState<HTMLElement | null>(null),
    queryInterval = useRef<number | undefined>()
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
      const qi = (queryInterval.current = window.setInterval(setRect, 360))
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

const getContainerStyle = memoizeOne((isScrolling, estimateTotalHeight) => ({
  position: 'relative',
  width: '100%',
  maxWidth: '100%',
  height: Math.ceil(estimateTotalHeight),
  maxHeight: Math.ceil(estimateTotalHeight),
  willChange: isScrolling ? 'contents, height' : void 0,
  pointerEvents: isScrolling ? 'none' : void 0,
}))

const assignUserStyle = memoizeOne(
  (containerStyle, userStyle) => Object.assign({}, containerStyle, userStyle),
  (args, pargs) => args[0] === pargs[0] && args[1] === pargs[1]
)

const assignUserItemStyle = trieMemoize(
  [WeakMap, OneKeyMap],
  (itemStyle, userStyle) => Object.assign({}, itemStyle, userStyle)
)

const defaultGetItemKey = (_: any[], i: number): number => i
// the below memoizations for for ensuring shallow equal is reliable for pure
// component children
const getCachedSize = memoizeOne(
  width => ({
    width,
    zIndex: -1000,
    visibility: 'hidden',
    position: 'absolute',
  }),
  (args, pargs) => args[0] === pargs[0]
)
const getCachedItemStyle = trieMemoize(
  [OneKeyMap, Map, Map],
  (width, left, top) => ({top, left, width, position: 'absolute'})
)

export interface SizeObserverProps {
  as: any
  role: string
  style: {[property: string]: any}
  resizeObserver: any
  observerRef: (element: HTMLElement) => void
}
const SizeObserver: React.FC<SizeObserverProps> = props => {
  const [element, setElement] = useState<HTMLElement | null>(null)
  useLayoutEffect((): void | (() => void) => {
    if (element !== null) {
      const observedElement = element
      props.observerRef(observedElement)
      return (): void => {
        props.resizeObserver.unobserve(observedElement)
      }
    }
  }, [element, props.observerRef, props.resizeObserver])
  return React.createElement(
    props.as,
    {ref: setElement, role: `${props.role}item`, style: props.style},
    props.children
  )
}

export interface MasonryPropsBase {
  readonly columnWidth?: number
  readonly columnGutter?: number
  readonly columnCount?: number

  readonly as?: any
  readonly id?: string
  readonly className?: string
  readonly style?: {[property: string]: any}
  readonly role?: string
  readonly tabIndex?: number | string
  readonly items: any[]
  readonly itemAs?: any
  readonly itemStyle?: {[property: string]: any}
  readonly itemHeightEstimate?: number
  readonly itemKey?: (items: any[], index: number) => string | number
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
  readonly containerRef?: (
    element: HTMLElement
  ) => void | {current: HTMLElement | null | undefined}
}

const useForceUpdate = (): (() => void) => {
  const setState = useState<number>(0)[1]
  return useCallback(() => setState(current => ++current), [])
}

const elementsCache: WeakMap<Element, number> = new WeakMap()

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
    const forceUpdate = useForceUpdate()
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
    const itemPositioner = useRef<ItemPositioner>(initPositioner())
    const positionCache = useRef<PositionCache>(createPositionCache())
    const [sizeUpdates, setSizeUpdates] = useState<number[] | undefined>()
    const [resizeObserver] = useState(
      () =>
        new ResizeObserver(entries => {
          const updates: number[] = []

          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i]

            if (entry.contentRect.height > 0) {
              const index = elementsCache.get(entry.target),
                height = (entry.target as HTMLElement).offsetHeight,
                position = itemPositioner.current.get(index)
              if (
                position !== void 0 &&
                index !== void 0 &&
                height !== position.height
              ) {
                updates.push(index, height)
              }
            }
          }

          if (updates.length > 0) setSizeUpdates(updates)
        })
    )
    const stopIndex = useRef<number | undefined>()
    const startIndex = useRef<number>(0)
    const prevStartIndex = useRef<number | undefined>()
    const prevStopIndex = useRef<number | undefined>()
    const prevChildren = useRef<React.ReactElement[]>([])
    const prevRange = useRef<number[]>([])

    useImperativeHandle(
      ref,
      () => ({
        clearPositions: (): void => {
          positionCache.current = createPositionCache()
          forceUpdate()
        },
      }),
      emptyArr
    )

    // updates the item positions any time a value potentially affecting their
    // size changes
    useEffect(() => {
      const prevPositioner = itemPositioner.current
      const nextPositionCache = createPositionCache()
      const nextItemPositioner = initPositioner()

      for (let index = 0; index < positionCache.current.getSize(); index++) {
        const pos = prevPositioner.get(index)
        if (pos !== void 0) {
          const item = nextItemPositioner.set(index, pos.height)
          nextPositionCache.setPosition(index, item.left, item.top, pos.height)
        }
      }

      itemPositioner.current = nextItemPositioner
      positionCache.current = nextPositionCache
      forceUpdate()
    }, [width, columnWidth, columnGutter, columnCount])

    // handles cells that resized
    useEffect(() => {
      if (sizeUpdates && sizeUpdates.length) {
        const updatedItems = itemPositioner.current.update(sizeUpdates)
        let i = 0

        for (; i < updatedItems.length - 1; i++) {
          const index = updatedItems[i],
            item = updatedItems[++i]
          positionCache.current.updatePosition(
            index,
            item.left,
            item.top,
            item.height
          )
        }

        forceUpdate()
      }
    }, [sizeUpdates])

    // calls the onRender callback if the rendered indices changed
    useLayoutEffect(() => {
      if (typeof onRender === 'function') {
        onRender(startIndex.current, stopIndex.current, items)
        prevStartIndex.current = startIndex.current
        prevStopIndex.current = stopIndex.current
      }
    }, [items, prevStartIndex.current, prevStopIndex.current])

    // cleans up the resize observers when this component unmounts
    useEffect(
      () => (): void => {
        resizeObserver.disconnect()
      },
      emptyArr
    )

    const setItemRef = useCallback(
      trieMemoize([{}], index => (el: HTMLElement): void => {
        if (resizeObserver !== null && el !== null) {
          if (elementsCache.get(el) === void 0) {
            elementsCache.set(el, index)
            resizeObserver.observe(el)
          }

          if (itemPositioner.current.get(index) === void 0) {
            const height = el.offsetHeight
            const item = itemPositioner.current.set(index, height)
            positionCache.current.setPosition(
              index,
              item.left,
              item.top,
              height
            )
          }
        }
      }),
      emptyArr
    )

    const itemCount = items.length
    const measuredCount = positionCache.current.getSize()
    const shortestColumnSize = positionCache.current.getShortestColumnSize()
    let children: React.ReactElement[] = []
    let rangeWasEqual = true
    const range: number[] = []
    overscanBy = height * overscanBy

    positionCache.current.range(
      Math.max(0, scrollTop - overscanBy),
      scrollTop + overscanBy,
      (i, l, t) => {
        range.push(i, l, t)
        const prev = prevRange.current

        if (
          rangeWasEqual &&
          (prev[range.length - 1] !== range[range.length - 1] ||
            prev[range.length - 2] !== range[range.length - 2] ||
            prev[range.length - 3] !== range[range.length - 3])
        ) {
          rangeWasEqual = false
        }
      }
    )

    if (range.length > 0) {
      if (rangeWasEqual && isScrolling && prevChildren.current.length > 0) {
        children = prevChildren.current
      } else {
        stopIndex.current = void 0

        for (let i = 0; i < range.length; i++) {
          const index = range[i],
            left = range[++i],
            top = range[++i]

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
              itemPositioner.current.columnWidth,
              left,
              top
            )

          children.push(
            React.createElement(
              SizeObserver,
              {
                key,
                as: itemAs,
                role,
                resizeObserver,
                observerRef: setItemRef(index),
                style:
                  typeof itemStyle === 'object' && itemStyle !== null
                    ? assignUserItemStyle(observerStyle, itemStyle)
                    : observerStyle,
              },
              React.createElement(render, {
                key,
                index,
                data,
                width: itemPositioner.current.columnWidth,
              })
            )
          )
        }

        prevRange.current = range
        prevChildren.current = children
      }
    }

    if (
      shortestColumnSize < scrollTop + overscanBy &&
      measuredCount < itemCount
    ) {
      const batchSize = Math.min(
        itemCount - measuredCount,
        Math.ceil(
          ((scrollTop + overscanBy - shortestColumnSize) / itemHeightEstimate) *
            itemPositioner.current.columnCount
        )
      )

      let index = measuredCount
      children =
        children === prevChildren.current ? children.slice(0) : children

      for (; index < measuredCount + batchSize; index++) {
        const data = items[index],
          key = itemKey(data, index),
          observerStyle = getCachedSize(itemPositioner.current.columnWidth)

        children.push(
          React.createElement(
            SizeObserver,
            {
              key,
              as: itemAs,
              role,
              resizeObserver,
              observerRef: setItemRef(index),
              style:
                typeof itemStyle === 'object' && itemStyle !== null
                  ? assignUserItemStyle(observerStyle, itemStyle)
                  : observerStyle,
            },
            React.createElement(render, {
              key,
              index,
              data,
              width: itemPositioner.current.columnWidth,
            })
          )
        )
      }
    }
    // gets the container style object based upon the estimated height and whether or not
    // the page is being scrolled
    const containerStyle = getContainerStyle(
      isScrolling,
      positionCache.current.estimateTotalHeight(
        itemCount,
        itemPositioner.current.columnCount,
        itemHeightEstimate
      )
    )

    return React.createElement(as, {
      ref: containerRef,
      id,
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

interface MasonryProps extends FreeMasonryProps {
  readonly initialWidth?: number
  readonly initialHeight?: number
  readonly windowScroller?: WindowScrollerOptions
}

export const Masonry: React.FC<MasonryProps> = React.memo(
  React.forwardRef((props, ref) => {
    const {width, height, scrollY, isScrolling} = useWindowScroller(
        props.initialWidth || 1280,
        props.initialHeight || 720,
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

export const List: React.FC<ListProps> = props => (
  <Masonry
    role="list"
    {...props}
    columnGutter={props.rowGutter}
    columnCount={1}
    columnWidth={1}
  />
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

export const useInfiniteLoader = (
  /**
   * Callback to be invoked when more rows must be loaded.
   * It should implement the following signature: (startIndex, stopIndex, items): Promise
   * The returned Promise should be resolved once row data has finished loading.
   * It will be used to determine when to refresh the list with the newly-loaded data.
   * This callback may be called multiple times in reaction to a single scroll event.
   */
  loadMoreItems,
  options: InfiniteLoaderOptions = emptyObj
): ((startIndex: number, stopIndex: number, items: any[]) => void) => {
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
