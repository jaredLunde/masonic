import * as React from "react";
import type { Positioner } from "./use-positioner";
/**
 * This hook handles the render phases of the masonry layout and returns the grid as a React element.
 *
 * @param options - Options for configuring the masonry layout renderer. See `UseMasonryOptions`.
 * @param options.positioner
 * @param options.resizeObserver
 * @param options.items
 * @param options.as
 * @param options.id
 * @param options.className
 * @param options.style
 * @param options.role
 * @param options.tabIndex
 * @param options.containerRef
 * @param options.itemAs
 * @param options.itemStyle
 * @param options.itemHeightEstimate
 * @param options.itemKey
 * @param options.overscanBy
 * @param options.scrollTop
 * @param options.isScrolling
 * @param options.height
 * @param options.render
 * @param options.onRender
 */
export declare function useMasonry<Item>({
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
}: UseMasonryOptions<Item>): JSX.Element;
export interface UseMasonryOptions<Item> {
  /**
   * An array containing the data used by the grid items.
   */
  items: Item[];
  /**
   * A grid cell positioner and cache created by the `usePositioner()` hook or
   * the `createPositioner` utility.
   */
  positioner: Positioner;
  /**
   * A resize observer that tracks mutations to the grid cells and forces the
   * Masonry grid to recalculate its layout if any cells affect column heights
   * change. Check out the `useResizeObserver()` hook.
   */
  resizeObserver?: {
    observe: ResizeObserver["observe"];
    disconnect: ResizeObserver["observe"];
    unobserve: ResizeObserver["unobserve"];
  };
  /**
   * This is the type of element the grid container will be rendered as.
   *
   * @default "div"`
   */
  as?: keyof JSX.IntrinsicElements | React.ComponentType<any>;
  /**
   * Optionally gives the grid container an `id` prop.
   */
  id?: string;
  /**
   * Optionally gives the grid container a `className` prop.
   */
  className?: string;
  /**
   * Adds extra `style` attributes to the container in addition to those
   * created by the `useMasonry()` hook.
   */
  style?: React.CSSProperties;
  /**
   * Optionally swap out the accessibility `role` prop of the container and its items.
   *
   * @default "grid"
   */
  role?: "grid" | "list";
  /**
   * Change the `tabIndex` of the grid container.
   *
   * @default 0
   */
  tabIndex?: number;
  /**
   * Forwards a React ref to the grid container.
   */
  containerRef?:
    | ((element: HTMLElement) => void)
    | React.MutableRefObject<HTMLElement | null>;
  /**
   * This is the type of element the grid items will be rendered as.
   *
   * @default "div"
   */
  itemAs?: keyof JSX.IntrinsicElements | React.ComponentType<any>;
  /**
   * Adds extra `style` attributes to the grid items in addition to those
   * created by the `useMasonry()` hook.
   */
  itemStyle?: React.CSSProperties;
  /**
   * This value is used for estimating the initial height of the masonry grid. It is important for
   * the UX of the scrolling behavior and in determining how many `items` to render in a batch, so it's
   * wise to set this value with some level accuracy, though it doesn't need to be perfect.
   *
   * @default 300
   */
  itemHeightEstimate?: number;
  /**
   * The value returned here must be unique to the item. By default, the key is the item's index. This is ok
   * if your collection of items is never modified. Setting this property ensures that the component in `render`
   * is reused each time the masonry grid is reflowed. A common pattern would be to return the item's database
   * ID here if there is one, e.g. `data => data.id`
   *
   * @default (data, index) => index`
   */
  itemKey?: (data: Item, index: number) => string | number;
  /**
     * This number is used for determining the number of grid cells outside of the visible window to render.
     * The default value is `2` which means "render 2 windows worth (2 * `height`) of content before and after
     * the items in the visible window". A value of `3` would be 3 windows worth of grid cells, so it's a
     * linear relationship.
     *
     * Overscanning is important for preventing tearing when scrolling through items in the grid, but setting
     * too high of a vaimport { useForceUpdate } from './use-force-update';
  lue may create too much work for React to handle, so it's best that you tune this
     * value accordingly.
     *
     * @default 2
     */
  overscanBy?: number;
  /**
   * This is the height of the window. If you're rendering the grid relative to the browser `window`,
   * the current `document.documentElement.clientHeight` is the value you'll want to set here. If you're
   * rendering the grid inside of another HTML element, you'll want to provide the current `element.offsetHeight`
   * here.
   */
  height: number;
  /**
   * The current scroll progress in pixel of the window the grid is rendered in. If you're rendering
   * the grid relative to the browser `window`, you'll want the most current `window.scrollY` here.
   * If you're rendering the grid inside of another HTML element, you'll want the current `element.scrollTop`
   * value here. The `useScroller()` hook and `<MasonryScroller>` components will help you if you're
   * rendering the grid relative to the browser `window`.
   */
  scrollTop: number;
  /**
   * This property is used for determining whether or not the grid container should add styles that
   * dramatically increase scroll performance. That is, turning off `pointer-events` and adding a
   * `will-change: contents;` value to the style string. You can forgo using this prop, but I would
   * not recommend that. The `useScroller()` hook and `<MasonryScroller>` components will help you if
   * you're rendering the grid relative to the browser `window`.
   *
   * @default false
   */
  isScrolling?: boolean;
  /**
   * This component is rendered for each item of your `items` prop array. It should accept three props:
   * `index`, `width`, and `data`. See RenderComponentProps.
   */
  render: React.ComponentType<RenderComponentProps<Item>>;
  /**
   * This callback is invoked any time the items currently being rendered by the grid change.
   */
  onRender?: (startIndex: number, stopIndex: number, items: Item[]) => void;
}
export interface RenderComponentProps<Item> {
  /**
   * The index of the cell in the `items` prop array.
   */
  index: number;
  /**
   * The rendered width of the cell's column.
   */
  width: number;
  /**
   * The data at `items[index]` of your `items` prop array.
   */
  data: Item;
}
