import React from 'react'
import ResizeObserver from 'resize-observer-polyfill'
export declare const useMasonry: ({
  positioner,
  resizeObserver,
  items,
  as: ContainerComponent,
  id,
  className,
  style,
  role,
  tabIndex,
  containerRef,
  itemAs: ItemComponent,
  itemStyle,
  itemHeightEstimate,
  itemKey,
  overscanBy,
  scrollTop,
  isScrolling,
  height,
  render: RenderComponent,
  onRender,
}: UseMasonry) => JSX.Element
export declare const Masonry: React.FC<MasonryProps>
interface UseMasonry {
  items: any[]
  positioner: Positioner
  resizeObserver?: ReturnType<typeof useResizeObserver>
  as?: keyof JSX.IntrinsicElements | React.ComponentType<any>
  id?: string
  className?: string
  style?: React.CSSProperties
  role?: string
  tabIndex?: number
  containerRef?:
    | ((element: HTMLElement) => void)
    | React.MutableRefObject<HTMLElement | null>
  itemAs?: keyof JSX.IntrinsicElements | React.ComponentType<any>
  itemStyle?: React.CSSProperties
  itemHeightEstimate?: number
  itemKey?: (data: any, index: number) => string | number
  overscanBy?: number
  height: number
  scrollTop: number
  isScrolling?: boolean
  render: React.ComponentType<any>
  onRender?: (
    startIndex: number,
    stopIndex: number | undefined,
    items: any[]
  ) => void
}
export interface MasonryProps
  extends Omit<
    UseMasonry,
    | 'scrollTop'
    | 'height'
    | 'isScrolling'
    | 'positioner'
    | 'resizeObserver'
    | 'containerRef'
  > {
  columnWidth?: number
  columnGutter?: number
  columnCount?: number
  initialWidth?: number
  initialHeight?: number
  scrollFps?: number
}
export interface MasonryScrollerProps
  extends Omit<
    MasonryProps,
    | 'columnWidth'
    | 'columnGutter'
    | 'columnCount'
    | 'initialWidth'
    | 'initialHeight'
  > {
  offset?: number
  height: number
  containerRef?: UseMasonry['containerRef']
  positioner: Positioner
  resizeObserver: UseMasonry['resizeObserver']
}
export declare const List: React.FC<ListProps>
export interface ListProps extends MasonryProps {
  columnGutter?: never
  columnCount?: never
  columnWidth?: never
  rowGutter?: number
}
export interface Positioner {
  columnCount: number
  columnWidth: number
  set: (index: number, height: number) => void
  get: (index: number) => PositionerItem | undefined
  update: (updates: number[]) => void
  range: (
    lo: number,
    hi: number,
    renderCallback: (index: number, left: number, top: number) => void
  ) => void
  size: () => number
  estimateHeight: (itemCount: number, defaultItemHeight: number) => number
  shortestColumn: () => number
}
export interface PositionerItem {
  top: number
  left: number
  height: number
  column: number
}
export declare const useScroller: (
  offset?: number,
  fps?: number
) => {
  scrollTop: number
  isScrolling: boolean
}
export declare const useContainerPosition: (
  element: React.MutableRefObject<HTMLElement | null>,
  deps?: React.DependencyList
) => ContainerPosition
interface ContainerPosition {
  offset: number
  width: number
}
export declare const usePositioner: ({
  width,
  columnWidth,
  columnGutter,
  columnCount,
}: {
  width: number
  columnWidth?: number | undefined
  columnGutter?: number | undefined
  columnCount?: number | undefined
}) => Positioner
export declare const useResizeObserver: (
  positioner: Positioner
) => ResizeObserver
export declare function useInfiniteLoader<T extends LoadMoreItemsCallback>(
  /**
   * Callback to be invoked when more rows must be loaded.
   * It should implement the following signature: (startIndex, stopIndex, items): Promise
   * The returned Promise should be resolved once row data has finished loading.
   * It will be used to determine when to refresh the list with the newly-loaded data.
   * This callback may be called multiple times in reaction to a single scroll event.
   */
  loadMoreItems: T,
  options?: InfiniteLoaderOptions
): LoadMoreItemsCallback
export interface InfiniteLoaderOptions {
  isItemLoaded?: (index: number, items: any[]) => boolean
  minimumBatchSize?: number
  threshold?: number
  totalItems?: number
}
export interface LoadMoreItemsCallback {
  (startIndex: number, stopIndex: number, items: any[]): void
}
export {}
