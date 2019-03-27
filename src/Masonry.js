import React, {useCallback, useMemo, useEffect, useRef} from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import {strictShallowEqual} from '@render-props/utils'
import trieMemoize from 'trie-memoize'
import emptyArr from 'empty/array'
import {memoizeOne, OneKeyMap, createItemPositioner, createPositionCache} from './utils'
import useWindowScroller from './useWindowScroller'
import useContainerRect from './useContainerRect'


export const getColumns = (containerWidth = 0, minimumWidth = 0, gutter = 8, columnCount) => {
  columnCount = columnCount || Math.floor(containerWidth / (minimumWidth + gutter)) || 1
  const columnWidth = Math.floor((containerWidth - (gutter * (columnCount - 1))) / columnCount)
  return [columnWidth, columnCount]
}

const getContainerStyle = memoizeOne(
  (isScrolling, estimateTotalHeight) => ({
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    height: estimateTotalHeight,
    maxHeight: estimateTotalHeight,
    willChange: 'contents',
    pointerEvents: isScrolling ? 'none' : '',
    contain: 'strict'
  }),
)

const assignUserStyle = memoizeOne(
  (containerStyle, userStyle) => Object.assign({}, containerStyle, userStyle),
  (args, pargs) => args[0] === pargs[0] && args[1] === pargs[1]
)
const assignUserItemStyle = trieMemoize(
  [WeakMap, OneKeyMap],
  (itemStyle, userStyle) => Object.assign({}, itemStyle, userStyle)
)
const defaultGetItemKey = (_, i) => i
// tge below memoizations for for ensuring shallow equal is reliable for pure
// component children
const getCachedSize = memoizeOne(
  width => ({
    width,
    zIndex: -1000,
    visibility: 'hidden',
    position: 'absolute'
  }),
  (args, pargs) => args[0] === pargs[0]
)
const getCachedItemStyle = trieMemoize(
  [OneKeyMap, Map, Map],
  (width, left, top) => ({top, left, width, position: 'absolute'})
)

const SizeObserver = props => {
  const element = useRef(null)
  useEffect(
    () => () => element.current !== null && props.resizeObserver.unobserve(element.current),
    emptyArr
  )
  const ref = useCallback(
    el => {
      element.current = el
      props.observerRef(el)
    },
    [props.observerRef]
  )
  const elementProps = useMemo(() => ({ref, style: props.style}), [props.style, ref])
  return React.createElement(props.as, elementProps, props.children)
}

class Masonry extends React.Component {
  // TODO: initialWidth, initialHeight
  static propTypes = {}
  static defaultProps = {
    as: 'div',
    itemAs: 'div',
    tabIndex: 0,
    role: 'grid',
    columnWidth: 200,  // minimum column width
    columnGutter: 0, // gutter size in px
    getItemKey: defaultGetItemKey,
    estimatedItemHeight: 300,
    overscanBy: 2
  }

  constructor (props) {
    super(props)
    this.itemElements = new WeakMap()
    this.resizeObserver = new ResizeObserver(entries => {
      let updates = []

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]

        if (entry.contentRect.height > 0) {
          const
            index = this.itemElements.get(entry.target),
            height = entry.target.offsetHeight

          if (height !== this.itemPositioner.get(index).height) {
            updates.push(index, height)
          }
        }
      }

      if (updates.length > 0) {
        this.updatePositions(updates)
      }
    })
    this.prevStartIndex = 0
    this.initPositioner()
    this.positionCache = createPositionCache()
  }

  componentWillUnmount () {
    this.resizeObserver.disconnect()
  }

  shouldComponentUpdate (nextProps) {
    // this allows for a faster decision when scrolling or coming out of a scroll
    if (
      this.props.scrollTop !== nextProps.scrollTop
      || this.props.isScrolling !== nextProps.isScrolling
    ) {
      return true
    }

    return strictShallowEqual(this.props, nextProps) === false
  }

  componentDidUpdate (prevProps) {
    // updates the item positions any time a value potentially affecting their size changes
    if (
      prevProps.containerWidth !== this.props.containerWidth
      || prevProps.columnCount !== this.props.columnCount
      || prevProps.columnWidth !== this.props.columnWidth
      || prevProps.columnGutter !== this.props.columnGutter
    ) {
      this.repopulatePositions()
      this.forceUpdate()
    }

    // calls the onRender callback if the rendered indices changed
    if (
      typeof this.props.onRender === 'function'
      && this.stopIndex !== void 0
      && (this.prevStartIndex !== this.startIndex || this.prevStopIndex !== this.stopIndex)
    ) {
      this.props.onRender(this.startIndex, this.stopIndex, this.props.items)
      this.prevStartIndex = this.startIndex
      this.prevStopIndex = this.stopIndex
    }
  }

  initPositioner (p = this.props) {
    let [columnWidth, columnCount] = getColumns(
      p.containerWidth,
      p.columnWidth,
      p.columnGutter,
      p.columnCount
    )
    this.columnWidth = columnWidth
    this.columnCount = columnCount
    this.columnGutter = p.columnGutter
    this.itemPositioner = createItemPositioner(columnCount, columnWidth, p.columnGutter)
  }

  repopulatePositions = () => {
    const prevPositioner = this.itemPositioner
    this.initPositioner()
    const nextPositionCache = createPositionCache()

    for (let index = 0; index < this.positionCache.getSize(); index++) {
      const height = prevPositioner.get(index).height
      const item = this.itemPositioner.set(index, height)
      nextPositionCache.setPosition(index, item.left, item.top, height)
    }

    this.positionCache = nextPositionCache
  }

  updatePositions = updates => {
    let updatedItems = this.itemPositioner.update(updates), i = 0

    for (; i < updatedItems.length - 1; i++) {
      const index = updatedItems[i], item = updatedItems[++i]
      this.positionCache.updatePosition(index, item.left, item.top, item.height)
    }

    this.forceUpdate()
  }

  clearPositions = () => {
    this._positionCache = createPositionCache()
    this.forceUpdate()
  }

  setItemRef = trieMemoize(
    [Map],
    index => el => {
      if (this.resizeObserver !== null && el !== null) {
        if (this.itemElements.get(el) === void 0) {
          this.itemElements.set(el, index)
          this.resizeObserver.observe(el)
        }

        if (this.itemPositioner.get(index) === void 0) {
          const height = el.offsetHeight
          const item = this.itemPositioner.set(index, height)
          this.positionCache.setPosition(index, item.left, item.top, height)
        }
      }
    }
  )

  render () {
    let {
      // container element props
      as, // container node type
      id,
      className,
      style,
      role,
      tabIndex,
      containerRef,

      items,
      itemAs,
      itemStyle,
      estimatedItemHeight,
      getItemKey,
      overscanBy,

      scrollTop,
      isScrolling,
      windowHeight,

      render,
      children: renderChildren
    } = this.props
    const
      children = [],
      itemCount = items.length,
      measuredCount = this.positionCache.getSize(),
      shortestColumnSize = this.positionCache.getShortestColumnSize()
    let nextStartIndex = 0, nextStopIndex
    render = renderChildren || render
    overscanBy = windowHeight * overscanBy

    this.positionCache.range(
      Math.max(0, scrollTop - overscanBy),
      windowHeight + windowHeight + overscanBy,
      (index, left, top) => {
        if (nextStopIndex === void 0) {
          nextStartIndex = index
          nextStopIndex = index
        }
        else {
          nextStartIndex = Math.min(nextStartIndex, index)
          nextStopIndex = Math.max(nextStopIndex, index)
        }

        const
          data = items[index],
          key = getItemKey(data, index),
          observerStyle = getCachedItemStyle(this.columnWidth, left, top)

        children.push(
          React.createElement(
            SizeObserver,
            {
              key,
              as: itemAs,
              resizeObserver: this.resizeObserver,
              observerRef: this.setItemRef(index),
              style: typeof itemStyle === 'object' && itemStyle !== null
                ? assignUserItemStyle(observerStyle, itemStyle)
                : observerStyle,
            },
            React.createElement(
              render,
              {
                key,
                index,
                data,
                width: this.columnWidth
              }
            )
          )
        )
      },
    )

    this.startIndex = nextStartIndex
    // this may change below if there are more cells to render
    this.stopIndex = nextStopIndex

    if (
      shortestColumnSize < (scrollTop + windowHeight + overscanBy)
      && measuredCount < itemCount
    ) {
      const batchSize = Math.min(
        itemCount - measuredCount,
        Math.ceil(
          (scrollTop + windowHeight + overscanBy - shortestColumnSize)
          / estimatedItemHeight
          * this.columnCount,
        ),
      )

      let index = measuredCount

      for (; index < measuredCount + batchSize; index++) {
        const
          data =  items[index],
          key = getItemKey(data, index),
          columnNum = (index % this.columnCount) + 1
        const observerStyle = getCachedSize(this.columnWidth)

        children.push(
          React.createElement(
            SizeObserver,
            {
              key,
              as: itemAs,
              resizeObserver: this.resizeObserver,
              observerRef: this.setItemRef(index),
              style: typeof itemStyle === 'object' && itemStyle !== null
                ? assignUserItemStyle(observerStyle, itemStyle)
                : observerStyle
            },
            React.createElement(
              render,
              {
                key,
                index,
                data,
                width: this.columnWidth,
              }
            )
          ),
        )
      }

      this.stopIndex = index
    }
    // gets the container style object based upon the estimated height and whether or not
    // the page is being scrolled
    const containerStyle = getContainerStyle(
      isScrolling,
      this.positionCache.estimateTotalHeight(itemCount, this.columnCount, estimatedItemHeight)
    )

    return React.createElement(
      as,
      {
        ref: containerRef,
        id,
        role,
        className,
        tabIndex,
        style: typeof style === 'object' && style !== null
          ? assignUserStyle(containerStyle, style)
          : containerStyle,
        children
      }
    )
  }
}

export default React.memo(
  React.forwardRef(
    (props, ref) => {
      const {windowWidth, windowHeight, scrollY, isScrolling} = useWindowScroller()
      const [containerRef, containerWidth, top] = useContainerRect(windowWidth, windowHeight)

      return React.createElement(
        Masonry,
        Object.assign(
          {ref},
          {
            scrollTop: Math.max(0, scrollY - top),
            isScrolling,
            containerWidth,
            windowHeight,
            containerRef
          },
          props
        )
      )
    }
  )
)