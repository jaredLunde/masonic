import React, {useCallback} from 'react'
import emptyObj from 'empty/object'


/**
 * Returns all of the ranges within a larger range that contain unloaded rows.
 */
export const scanForUnloadedRanges = (
  isItemLoaded,
  minimumBatchSize,
  items,
  totalItems,
  startIndex,
  stopIndex
) => {
  let unloadedRanges = [], rangeStartIndex, rangeStopIndex

  for (let index = startIndex; index <= stopIndex; index++) {
    let loaded = isItemLoaded(index, items)

    if (loaded === false) {
      rangeStopIndex = index
      if (rangeStartIndex === void 0) {
        rangeStartIndex = index
      }
    }
    else if (rangeStopIndex !== void 0) {
      unloadedRanges.push(rangeStartIndex, rangeStopIndex)
      rangeStartIndex = rangeStopIndex = void 0
    }
  }

  // If :rangeStopIndex is not null it means we haven't ran out of unloaded rows.
  // Scan forward to try filling our :minimumBatchSize.
  if (rangeStopIndex !== void 0) {
    const potentialStopIndex = Math.min(
      Math.max(rangeStopIndex, rangeStartIndex + minimumBatchSize - 1),
      totalItems - 1,
    )

    for (let index = rangeStopIndex + 1; index <= potentialStopIndex; index++) {
      if (isItemLoaded(index, items) === false) {
        rangeStopIndex = index
      }
      else {
        break
      }
    }

    unloadedRanges.push(rangeStartIndex, rangeStopIndex)
  }

  // Check to see if our first range ended prematurely.
  // In this case we should scan backwards to try filling our :minimumBatchSize.
  if (unloadedRanges.length) {
    let
      firstUnloadedStart = unloadedRanges[0],
      firstUnloadedStop = unloadedRanges[1]

    while (
      firstUnloadedStop - firstUnloadedStart + 1 < minimumBatchSize
      && firstUnloadedStart > 0
    ) {
      let index = firstUnloadedStart - 1

      if (isItemLoaded(index, items) === false) {
        unloadedRanges[0] = firstUnloadedStart = index
      }
      else {
        break
      }
    }
  }

  return unloadedRanges
}

const defaultIsItemLoaded = (index, items) => items[index] !== void 0

const useInfiniteLoader = (
  /**
   * Callback to be invoked when more rows must be loaded.
   * It should implement the following signature: (startIndex, stopIndex, items): Promise
   * The returned Promise should be resolved once row data has finished loading.
   * It will be used to determine when to refresh the list with the newly-loaded data.
   * This callback may be called multiple times in reaction to a single scroll event.
   */
  loadMoreItems,
  opt = emptyObj
) => {
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
    totalItems = 9E9
  } = opt

  return useCallback(
    (startIndex, stopIndex, items) => {
      const unloadedRanges = scanForUnloadedRanges(
        isItemLoaded,
        minimumBatchSize,
        items,
        totalItems,
        Math.max(0, startIndex - threshold),
        Math.min(totalItems - 1, stopIndex + threshold),
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

export default useInfiniteLoader