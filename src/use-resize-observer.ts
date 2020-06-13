import * as React from 'react'
import trieMemoize from 'trie-memoize'
import ResizeObserver from 'resize-observer-polyfill'
import {elementsCache} from './elements-cache'
import {useForceUpdate} from './use-force-update'
import type {Positioner} from './use-positioner'

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
  React.useEffect(() => () => resizeObserver.disconnect(), [resizeObserver])
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
