import * as React from 'react'
import {useWindowSize} from '@react-hook/window-size'
import {MasonryScroller} from './masonry-scroller'
import type {MasonryScrollerProps} from './masonry-scroller'
import {useContainerPosition} from './use-container-position'
import {useResizeObserver} from './use-resize-observer'
import {usePositioner} from './use-positioner'
import type {UsePositionerOptions} from './use-positioner'
import {useScrollToIndex} from './use-scroll-to-index'
import type {UseScrollToIndexOptions} from './use-scroll-to-index'

/**
 * A "batteries included" masonry grid which includes all of the implementation details below. This component is the
 * easiest way to get off and running in your app, before switching to more advanced implementations, if necessary.
 * It will change its column count to fit its container's width and will decide how many rows to render based upon
 * the height of the browser `window`.
 */
export function Masonry<Item>(props: MasonryProps<Item>) {
  const containerRef = React.useRef<null | HTMLElement>(null)
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
  const scrollToIndex = useScrollToIndex(nextProps.positioner, {
    height: nextProps.height,
    offset: containerPos.offset,
    align:
      typeof props.scrollToIndex === 'object'
        ? props.scrollToIndex.align
        : void 0,
  })

  React.useEffect(() => {
    const index = props.scrollToIndex

    if (index !== void 0) {
      scrollToIndex(typeof index === 'number' ? index : index.index)
    }
  }, [props.scrollToIndex, scrollToIndex])

  return React.createElement(MasonryScroller, nextProps)
}

export interface MasonryProps<Item>
  extends Omit<
      MasonryScrollerProps<Item>,
      'offset' | 'width' | 'height' | 'containerRef' | 'positioner'
    >,
    Pick<UsePositionerOptions, 'columnWidth' | 'columnGutter' | 'columnCount'> {
  /**
   * Scrolls to a given index within the grid. The grid will re-scroll
   * any time the index changes.
   */
  scrollToIndex?:
    | number
    | {
        index: number
        align: UseScrollToIndexOptions['align']
      }
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

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  Masonry.displayName = 'Masonry'
}
