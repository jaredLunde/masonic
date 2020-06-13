import * as React from 'react'
import type {MasonryScrollerProps} from './masonry-scroller'
import type {UsePositionerOptions} from './use-positioner'
/**
 * A "batteries included" masonry grid which includes all of the implementation details below. This component is the
 * easiest way to get off and running in your app, before switching to more advanced implementations, if necessary.
 * It will change its column count to fit its container's width and will decide how many rows to render based upon
 * the height of the browser `window`.
 */
export declare const Masonry: React.FC<MasonryProps>
export interface MasonryProps
  extends Omit<
      MasonryScrollerProps,
      'offset' | 'width' | 'height' | 'containerRef'
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
