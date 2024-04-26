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
export declare function useInfiniteLoader<
  Item,
  T extends LoadMoreItemsCallback<Item>
>(
  loadMoreItems: T,
  options?: UseInfiniteLoaderOptions<Item>
): LoadMoreItemsCallback<Item>;
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
export declare type LoadMoreItemsCallback<Item> = (
  startIndex: number,
  stopIndex: number,
  items: Item[]
) => any;
