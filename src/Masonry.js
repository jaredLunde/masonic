import React, {useCallback, useMemo, useEffect, useRef} from 'react'
import ResizeObserver from 'resize-observer-polyfill'
import trieMemoize from 'trie-memoize'
import OneKeyMap from '@essentials/one-key-map'
import emptyArr from 'empty/array'
import memoizeOne from '@essentials/memoize-one'
import {createItemPositioner, createPositionCache} from './utils'
import useWindowScroller from './useWindowScroller'
import useContainerRect from './useContainerRect'


export const getColumns = (width = 0, minimumWidth = 0, gutter = 8, columnCount) => {
  columnCount = columnCount || Math.floor(width / (minimumWidth + gutter)) || 1
  const columnWidth = Math.floor((width - (gutter * (columnCount - 1))) / columnCount)
  return [columnWidth, columnCount]
}

const getContainerStyle = memoizeOne(
  (isScrolling, estimateTotalHeight) => ({
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    height: estimateTotalHeight,
    maxHeight: estimateTotalHeight,
    willChange: isScrolling ? 'contents, height' : void 0,
    pointerEvents: isScrolling ? 'none' : void 0
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
  const elementProps = useMemo(
    () => ({ref, role: `${props.role}item`, style: props.style}),
    [props.style, props.role, ref]
  )
  return React.createElement(props.as, elementProps, props.children)
}

export class Masonry extends React.Component {
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
            height = entry.target.offsetHeight,
            position = this.itemPositioner.get(index)
          if (position !== void 0 && index !== void 0 && height !== position.height) {
            updates.push(index, height)
          }
        }
      }

      if (updates.length > 0) {
        this.updatePositions(updates)
      }
    })
    this.prevRange = []
    this.prevChildren = []
    this.prevStartIndex = 0
    this.initPositioner()
    this.positionCache = createPositionCache()
  }

  componentWillUnmount () {
    this.resizeObserver.disconnect()
  }

  componentDidUpdate (prevProps) {
    // updates the item positions any time a value potentially affecting their size changes
    if (
      prevProps.width !== this.props.width
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
      p.width,
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
      const pos = prevPositioner.get(index)

      if (pos !== void 0) {
        const item = this.itemPositioner.set(index, pos.height)
        nextPositionCache.setPosition(index, item.left, item.top, pos.height)
      }
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
    this.positionCache = createPositionCache()
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
      itemHeightEstimate,
      itemKey,
      overscanBy,

      scrollTop,
      isScrolling,
      height,

      render,
      children: renderChildren
    } = this.props
    const
      itemCount = items.length,
      measuredCount = this.positionCache.getSize(),
      shortestColumnSize = this.positionCache.getShortestColumnSize()
    let
      children = [],
      range = [],
      rangeWasEqual = true
    render = renderChildren || render
    overscanBy = height * overscanBy

    this.positionCache.range(
      Math.max(0, scrollTop - overscanBy),
      scrollTop + overscanBy,
      (i, l, t) => {
        range.push(i, l, t)
        let prev = this.prevRange

        if (
          rangeWasEqual === true && (
            prev[range.length - 1] !== range[range.length - 1]
            || prev[range.length - 2] !== range[range.length - 2]
            || prev[range.length - 3] !== range[range.length - 3]
          )
        ) {
          rangeWasEqual = false
        }
      }
    )

    if (range.length > 0) {
      if (rangeWasEqual === true && isScrolling === true && this.prevChildren.length > 0) {
        children = this.prevChildren
      }
      else {
        this.stopIndex = void 0

        for (let i = 0; i < range.length; i++) {
          const
            index = range[i],
            left = range[++i],
            top = range[++i]

          if (this.stopIndex === void 0) {
            this.startIndex = index
            this.stopIndex = index
          }
          else {
            this.startIndex = Math.min(this.startIndex, index)
            this.stopIndex = Math.max(this.stopIndex, index)
          }

          const
            data = items[index],
            key = itemKey(data, index),
            observerStyle = getCachedItemStyle(this.columnWidth, left, top)

          children.push(
            React.createElement(
              SizeObserver,
              {
                key,
                as: itemAs,
                role,
                resizeObserver: this.resizeObserver,
                observerRef: this.setItemRef(index),
                style:
                  typeof itemStyle === 'object' && itemStyle !== null
                    ? assignUserItemStyle(observerStyle, itemStyle)
                    : observerStyle,
              },
              React.createElement(render, {key, index, data, width: this.columnWidth})
            )
          )
        }

        this.prevRange = range
        this.prevChildren = children
      }
    }

    if (shortestColumnSize < (scrollTop + overscanBy) && measuredCount < itemCount) {
      const batchSize = Math.min(
        itemCount - measuredCount,
        Math.ceil(
          (scrollTop + overscanBy - shortestColumnSize)
          / itemHeightEstimate
          * this.columnCount,
        ),
      )

      let index = measuredCount
      children = children === this.prevChildren ? children.slice(0) : children

      for (; index < measuredCount + batchSize; index++) {
        const
          data =  items[index],
          key = itemKey(data, index),
          observerStyle = getCachedSize(this.columnWidth)

        children.push(
          React.createElement(
            SizeObserver,
            {
              key,
              as: itemAs,
              role,
              resizeObserver: this.resizeObserver,
              observerRef: this.setItemRef(index),
              style:
                typeof itemStyle === 'object' && itemStyle !== null
                  ? assignUserItemStyle(observerStyle, itemStyle)
                  : observerStyle
            },
            React.createElement(render, {key, index, data, width: this.columnWidth})
          ),
        )
      }
    }
    // gets the container style object based upon the estimated height and whether or not
    // the page is being scrolled
    const containerStyle = getContainerStyle(
      isScrolling,
      this.positionCache.estimateTotalHeight(itemCount, this.columnCount, itemHeightEstimate)
    )

    return React.createElement(
      as,
      {
        ref: containerRef,
        id,
        role,
        className,
        tabIndex,
        style:
          typeof style === 'object' && style !== null
            ? assignUserStyle(containerStyle, style)
            : containerStyle,
        children
      }
    )
  }
}

const MasonryWindow = React.memo(
  React.forwardRef((props, ref) => {
    const
      {width, height, scrollY, isScrolling} = useWindowScroller(
        props.initialWidth,
        props.initialHeight,
        props.windowScroller
      ),
      [containerRef, rect] = useContainerRect(width, height)

    return React.createElement(
      Masonry,
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

MasonryWindow.defaultProps = {
  as: 'div',
  itemAs: 'div',
  tabIndex: 0,
  role: 'grid',
  columnWidth: 200,
  columnGutter: 0,
  initialWidth: 1280,
  initialHeight: 720,
  itemHeightEstimate: 300,
  itemKey: defaultGetItemKey,
  overscanBy: 2
}

if (__DEV__) {
  const PropTypes = require('prop-types')
  SizeObserver.displayName = 'SizeObserver'
  SizeObserver.propTypes = {
    as: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    role: PropTypes.string,
    style: PropTypes.object,
    resizeObserver: PropTypes.object,
    observerRef: PropTypes.func,
    children: PropTypes.element
  }
  Masonry.displayName = 'FreeMasonry'
  Masonry.propTypes = {
    columnCount: PropTypes.number,
    columnWidth: PropTypes.number.isRequired,
    columnGutter: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,  // width of the container
    height: PropTypes.number.isRequired, // height of the window
    scrollTop: PropTypes.number.isRequired,
    isScrolling: PropTypes.bool.isRequired,
    containerRef: PropTypes.shape({current: PropTypes.any}).isRequired,
  }

  MasonryWindow.displayName = 'Masonry'
  MasonryWindow.propTypes = {
    ...Masonry.propTypes,
    as: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired, // container node type
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    role: PropTypes.string,
    tabIndex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    columnCount: PropTypes.number,
    columnWidth: PropTypes.number.isRequired,
    columnGutter: PropTypes.number.isRequired,

    initialWidth: PropTypes.number.isRequired,
    initialHeight: PropTypes.number.isRequired,

    items: PropTypes.array.isRequired,
    itemAs: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    itemStyle: PropTypes.object,
    itemHeightEstimate: PropTypes.number.isRequired,
    itemKey: PropTypes.func,
    overscanBy: PropTypes.number,

    windowScroller: PropTypes.shape({
      scroll: PropTypes.shape({fps: PropTypes.number}),
      size: PropTypes.shape({wait: PropTypes.number}),
    }),

    onRender: PropTypes.func,
    render: PropTypes.func.isRequired,
    children: PropTypes.func
  }
}

export default MasonryWindow
