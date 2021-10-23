import useLatest from "@react-hook/latest";
import * as React from "react";

/**
 * A utility hook for seamlessly adding infinite scroll behavior to the `useMasonry()` hook. This
 * hook invokes a callback each time the last rendered index surpasses the total number of items
 * in your items array or the number defined in the `totalItems` option.
 *
 * @param loadMoreItems - This callback is invoked when more rows must be loaded. It will be used to
 *  determine when to refresh the list with the newly-loaded data. This callback may be called multiple
 *  times in reaction to a single scroll event, so it's important to memoize its arguments. If you're
 *  creating this callback inside of a functional component, make sure you wrap it in `React.useCallback()`,
 *  as well.
 * @param options
 */
export function useInfiniteLoader<Item, T extends LoadMoreItemsCallback<Item>>(
  loadMoreItems: T,
  options: UseInfiniteLoaderOptions<Item> = emptyObj
): LoadMoreItemsCallback<Item> {
  const {
    isItemLoaded,
    minimumBatchSize = 16,
    threshold = 16,
    totalItems = 9e9,
  } = options;
  const storedLoadMoreItems = useLatest(loadMoreItems);
  const storedIsItemLoaded = useLatest(isItemLoaded);

  return React.useCallback(
    (startIndex, stopIndex, items) => {
      const unloadedRanges = scanForUnloadedRanges(
        storedIsItemLoaded.current,
        minimumBatchSize,
        items,
        totalItems,
        Math.max(0, startIndex - threshold),
        Math.min(totalItems - 1, (stopIndex || 0) + threshold)
      );
      // The user is responsible for memoizing their loadMoreItems() function
      // because we don't want to make assumptions about how they want to deal
      // with `items`
      for (let i = 0; i < unloadedRanges.length - 1; ++i)
        storedLoadMoreItems.current(
          unloadedRanges[i],
          unloadedRanges[++i],
          items
        );
    },
    [
      totalItems,
      minimumBatchSize,
      threshold,
      storedLoadMoreItems,
      storedIsItemLoaded,
    ]
  );
}

/**
 * Returns all of the ranges within a larger range that contain unloaded rows.
 *
 * @param isItemLoaded
 * @param minimumBatchSize
 * @param items
 * @param totalItems
 * @param startIndex
 * @param stopIndex
 */
function scanForUnloadedRanges<Item>(
  isItemLoaded: UseInfiniteLoaderOptions<Item>["isItemLoaded"] = defaultIsItemLoaded,
  minimumBatchSize: UseInfiniteLoaderOptions<Item>["minimumBatchSize"] = 16,
  items: any[],
  totalItems: UseInfiniteLoaderOptions<Item>["totalItems"] = 9e9,
  startIndex: number,
  stopIndex: number
): number[] {
  const unloadedRanges: number[] = [];
  let rangeStartIndex: number | undefined,
    rangeStopIndex: number | undefined,
    index = startIndex;

  /* istanbul ignore next */
  for (; index <= stopIndex; index++) {
    if (!isItemLoaded(index, items)) {
      rangeStopIndex = index;
      if (rangeStartIndex === void 0) rangeStartIndex = index;
    } else if (rangeStartIndex !== void 0 && rangeStopIndex !== void 0) {
      unloadedRanges.push(rangeStartIndex, rangeStopIndex);
      rangeStartIndex = rangeStopIndex = void 0;
    }
  }

  // If :rangeStopIndex is not null it means we haven't run out of unloaded rows.
  // Scan forward to try filling our :minimumBatchSize.
  if (rangeStartIndex !== void 0 && rangeStopIndex !== void 0) {
    const potentialStopIndex = Math.min(
      Math.max(rangeStopIndex, rangeStartIndex + minimumBatchSize - 1),
      totalItems - 1
    );

    /* istanbul ignore next */
    for (index = rangeStopIndex + 1; index <= potentialStopIndex; index++) {
      if (!isItemLoaded(index, items)) {
        rangeStopIndex = index;
      } else {
        break;
      }
    }

    unloadedRanges.push(rangeStartIndex, rangeStopIndex);
  }

  // Check to see if our first range ended prematurely.
  // In this case we should scan backwards to try filling our :minimumBatchSize.
  /* istanbul ignore next */
  if (unloadedRanges.length) {
    let firstUnloadedStart = unloadedRanges[0];
    const firstUnloadedStop = unloadedRanges[1];

    while (
      firstUnloadedStop - firstUnloadedStart + 1 < minimumBatchSize &&
      firstUnloadedStart > 0
    ) {
      const index = firstUnloadedStart - 1;

      if (!isItemLoaded(index, items)) {
        unloadedRanges[0] = firstUnloadedStart = index;
      } else {
        break;
      }
    }
  }

  return unloadedRanges;
}

const defaultIsItemLoaded = <Item>(index: number, items: Item[]): boolean =>
  items[index] !== void 0;

export interface UseInfiniteLoaderOptions<Item> {
  /**
   *  A callback responsible for determining the loaded state of each item. Should return `true`
   * if the item has already been loaded and `false` if not.
   *
   * @default (index: number, items: any[]) => boolean
   */
  isItemLoaded?: (index: number, items: Item[]) => boolean;
  /**
   * The minimum number of new items to be loaded at a time.  This property can be used to
   * batch requests and reduce HTTP requests.
   *
   * @default 16
   */
  minimumBatchSize?: number;
  /**
   * The threshold at which to pre-fetch data. A threshold X means that new data should start
   * loading when a user scrolls within X cells of the end of your `items` array.
   *
   * @default 16
   */
  threshold?: number;
  /**
   * The total number of items you'll need to eventually load (if known). This can
   * be arbitrarily high if not known.
   *
   * @default 9e9
   */
  totalItems?: number;
}

export type LoadMoreItemsCallback<Item> = (
  startIndex: number,
  stopIndex: number,
  items: Item[]
) => any;

const emptyObj = {};
