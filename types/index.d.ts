import React from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import { DebouncedWindowSizeOptions } from '@react-hook/window-size';
interface UpdatedItem {
    top: number;
    left: number;
    height: number;
}
interface ItemPositioner {
    set: (index: number, height: number) => any;
    get: (index: number | undefined) => any;
    update: (updates: number[]) => (number | UpdatedItem)[];
    columnCount: number;
    columnWidth: number;
    columnGutter: number;
}
interface PositionCache {
    range: (lo: number, hi: number, renderCallback: (index: number, left: number, top: number) => void) => void;
    size: number;
    estimateTotalHeight: (itemCount: number, columnCount: number, defaultItemHeight: number) => number;
    getShortestColumnSize: () => number;
    setPosition: (index: number, left: number, top: number, height: number) => void;
}
export interface WindowScrollerOptions {
    size?: {
        wait?: number;
    };
    scroll?: {
        fps?: number;
    };
}
export declare const useScroller: (fps?: number) => [number, boolean];
interface ContainerRect {
    top: number;
    width: number;
    height: number;
}
export declare const useContainerSize: (options?: DebouncedWindowSizeOptions) => [ContainerRect, (element: HTMLElement) => void];
export declare const usePositioner: ({ width, columnWidth, columnGutter, columnCount, }: FreeMasonryProps) => [ItemPositioner, PositionCache];
export declare const useResizeObserver: (itemPositioner: ItemPositioner, positionCache: PositionCache) => ResizeObserver;
export declare const MasonryRenderer: React.FC<MasonryRendererProps>;
export declare const MasonryScroller: React.FC<MasonryProps & {
    top?: number;
}>;
export declare const Masonry: React.FC<MasonryProps>;
export interface MasonryPropsBase {
    columnWidth?: number;
    columnGutter?: number;
    columnCount?: number;
    as?: any;
    id?: string;
    className?: string;
    style?: React.CSSProperties;
    role?: string;
    tabIndex?: number | string;
    items: any[];
    itemAs?: any;
    itemStyle?: React.CSSProperties;
    itemHeightEstimate?: number;
    itemKey?: (data: any, index: number) => string | number;
    overscanBy?: number;
    onRender?: (startIndex: number, stopIndex: number | undefined, items: any[]) => void;
    render: any;
}
interface MasonryRendererProps extends MasonryPropsBase {
    width: number;
    height: number;
    top?: number;
    scrollTop: number;
    isScrolling?: boolean;
    containerRef?: ((element: HTMLElement) => void) | React.MutableRefObject<HTMLElement | null>;
    resizeObserver?: ReturnType<typeof useResizeObserver>;
    positionCache: PositionCache;
    itemPositioner: ItemPositioner;
}
export interface FreeMasonryProps extends MasonryRendererProps {
    top?: number;
}
export interface MasonryProps extends MasonryPropsBase {
    initialWidth?: number;
    initialHeight?: number;
    scrollerFps?: number;
}
export declare const List: React.FC<ListProps>;
export interface ListProps extends MasonryProps {
    columnGutter?: never;
    columnCount?: never;
    columnWidth?: never;
    rowGutter?: number;
}
export declare function useInfiniteLoader<T extends LoadMoreItemsCallback>(
/**
 * Callback to be invoked when more rows must be loaded.
 * It should implement the following signature: (startIndex, stopIndex, items): Promise
 * The returned Promise should be resolved once row data has finished loading.
 * It will be used to determine when to refresh the list with the newly-loaded data.
 * This callback may be called multiple times in reaction to a single scroll event.
 */
loadMoreItems: T, options?: InfiniteLoaderOptions): LoadMoreItemsCallback;
export interface InfiniteLoaderOptions {
    isItemLoaded?: (index: number, items: any[]) => boolean;
    minimumBatchSize?: number;
    threshold?: number;
    totalItems?: number;
}
export interface LoadMoreItemsCallback {
    (startIndex: number, stopIndex: number, items: any[]): void;
}
export {};
