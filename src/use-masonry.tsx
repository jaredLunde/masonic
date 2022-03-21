import memoizeOne from "@essentials/memoize-one";
import OneKeyMap from "@essentials/one-key-map";
import useLatest from "@react-hook/latest";
import * as React from "react";
import trieMemoize from "trie-memoize";
import { elementsCache } from "./elements-cache";
import { useForceUpdate } from "./use-force-update";
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
export function useMasonry<Item>({
  // Measurement and layout
  positioner,
  resizeObserver,
  // Grid items
  items,
  // Container props
  as: ContainerComponent = "div",
  id,
  className,
  style,
  role = "grid",
  tabIndex = 0,
  containerRef,
  // Item props
  itemAs: ItemComponent = "div",
  itemStyle,
  itemHeightEstimate = 300,
  itemKey = defaultGetItemKey,
  // Rendering props
  overscanBy = 2,
  scrollTop,
  isScrolling,
  height,
  render: RenderComponent,
  onRender,
}: UseMasonryOptions<Item>) {
  let startIndex = 0;
  let stopIndex: number | undefined;
  const forceUpdate = useForceUpdate();
  const setItemRef = getRefSetter(positioner, resizeObserver);
  const itemCount = items.length;
  const {
    columnWidth,
    columnCount,
    range,
    estimateHeight,
    size,
    shortestColumn,
  } = positioner;
  const measuredCount = size();
  const shortestColumnSize = shortestColumn();
  const children: React.ReactElement[] = [];
  const itemRole =
    role === "list" ? "listitem" : role === "grid" ? "gridcell" : undefined;
  const storedOnRender = useLatest(onRender);

  overscanBy = height * overscanBy;
  const rangeEnd = scrollTop + overscanBy;
  const needsFreshBatch =
    shortestColumnSize < rangeEnd && measuredCount < itemCount;

  range(
    // We overscan in both directions because users scroll both ways,
    // though one must admit scrolling down is more common and thus
    // we only overscan by half the downward overscan amount
    Math.max(0, scrollTop - overscanBy / 2),
    rangeEnd,
    (index, left, top) => {
      const data = items[index];
      const key = itemKey(data, index);
      const phaseTwoStyle: React.CSSProperties = {
        top,
        left,
        width: columnWidth,
        writingMode: "horizontal-tb",
        position: "absolute",
      };

      /* istanbul ignore next */
      if (
        typeof process !== "undefined" &&
        process.env.NODE_ENV !== "production"
      ) {
        throwWithoutData(data, index);
      }

      children.push(
        <ItemComponent
          key={key}
          ref={setItemRef(index)}
          role={itemRole}
          style={
            typeof itemStyle === "object" && itemStyle !== null
              ? Object.assign({}, phaseTwoStyle, itemStyle)
              : phaseTwoStyle
          }
        >
          {createRenderElement(RenderComponent, index, data, columnWidth)}
        </ItemComponent>
      );

      if (stopIndex === void 0) {
        startIndex = index;
        stopIndex = index;
      } else {
        startIndex = Math.min(startIndex, index);
        stopIndex = Math.max(stopIndex, index);
      }
    }
  );

  if (needsFreshBatch) {
    const batchSize = Math.min(
      itemCount - measuredCount,
      Math.ceil(
        ((scrollTop + overscanBy - shortestColumnSize) / itemHeightEstimate) *
          columnCount
      )
    );

    let index = measuredCount;
    const phaseOneStyle = getCachedSize(columnWidth);

    for (; index < measuredCount + batchSize; index++) {
      const data = items[index];
      const key = itemKey(data, index);

      /* istanbul ignore next */
      if (
        typeof process !== "undefined" &&
        process.env.NODE_ENV !== "production"
      ) {
        throwWithoutData(data, index);
      }

      children.push(
        <ItemComponent
          key={key}
          ref={setItemRef(index)}
          role={itemRole}
          style={
            typeof itemStyle === "object"
              ? Object.assign({}, phaseOneStyle, itemStyle)
              : phaseOneStyle
          }
        >
          {createRenderElement(RenderComponent, index, data, columnWidth)}
        </ItemComponent>
      );
    }
  }

  // Calls the onRender callback if the rendered indices changed
  React.useEffect(() => {
    if (typeof storedOnRender.current === "function" && stopIndex !== void 0)
      storedOnRender.current(startIndex, stopIndex, items);

    didEverMount = "1";
  }, [startIndex, stopIndex, items, storedOnRender]);
  // If we needed a fresh batch we should reload our components with the measured
  // sizes
  React.useEffect(() => {
    if (needsFreshBatch) forceUpdate();
    // eslint-disable-next-line
  }, [needsFreshBatch, positioner]);

  // gets the container style object based upon the estimated height and whether or not
  // the page is being scrolled
  const containerStyle = getContainerStyle(
    isScrolling,
    estimateHeight(itemCount, itemHeightEstimate)
  );

  return (
    <ContainerComponent
      ref={containerRef}
      key={didEverMount}
      id={id}
      role={role}
      className={className}
      tabIndex={tabIndex}
      style={
        typeof style === "object"
          ? assignUserStyle(containerStyle, style)
          : containerStyle
      }
      children={children}
    />
  );
}

/* istanbul ignore next */
function throwWithoutData(data: any, index: number) {
  if (!data) {
    throw new Error(
      `No data was found at index: ${index}\n\n` +
        `This usually happens when you've mutated or changed the "items" array in a ` +
        `way that makes it shorter than the previous "items" array. Masonic knows nothing ` +
        `about your underlying data and when it caches cell positions, it assumes you aren't ` +
        `mutating the underlying "items".\n\n` +
        `See https://codesandbox.io/s/masonic-w-react-router-example-2b5f9?file=/src/index.js for ` +
        `an example that gets around this limitations. For advanced implementations, see ` +
        `https://codesandbox.io/s/masonic-w-react-router-and-advanced-config-example-8em42?file=/src/index.js\n\n` +
        `If this was the result of your removing an item from your "items", see this issue: ` +
        `https://github.com/jaredLunde/masonic/issues/12`
    );
  }
}

// This is for triggering a remount after SSR has loaded in the client w/ hydrate()
let didEverMount = "0";

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

//
// Render-phase utilities

// ~5.5x faster than createElement without the memo
const createRenderElement = trieMemoize(
  [OneKeyMap, {}, WeakMap, OneKeyMap],
  (RenderComponent, index, data, columnWidth) => (
    <RenderComponent index={index} data={data} width={columnWidth} />
  )
);

const getContainerStyle = memoizeOne(
  (isScrolling: boolean | undefined, estimateHeight: number) => ({
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    height: Math.ceil(estimateHeight),
    maxHeight: Math.ceil(estimateHeight),
    willChange: isScrolling ? "contents" : void 0,
    pointerEvents: isScrolling ? "none" : void 0,
  })
);

const cmp2 = (args: IArguments, pargs: IArguments | any[]): boolean =>
  args[0] === pargs[0] && args[1] === pargs[1];

const assignUserStyle = memoizeOne(
  (containerStyle, userStyle) => Object.assign({}, containerStyle, userStyle),
  // @ts-expect-error
  cmp2
);

function defaultGetItemKey<Item>(_: Item, i: number) {
  return i;
}

// the below memoizations for for ensuring shallow equal is reliable for pure
// component children
const getCachedSize = memoizeOne(
  (width: number): React.CSSProperties => ({
    width,
    zIndex: -1000,
    visibility: "hidden",
    position: "absolute",
    writingMode: "horizontal-tb",
  }),
  (args, pargs) => args[0] === pargs[0]
);

const getRefSetter = memoizeOne(
  (
      positioner: Positioner,
      resizeObserver?: UseMasonryOptions<any>["resizeObserver"]
    ) =>
    (index: number) =>
    (el: HTMLElement | null): void => {
      if (el === null) return;
      if (resizeObserver) {
        resizeObserver.observe(el);
        elementsCache.set(el, index);
      }
      if (positioner.get(index) === void 0)
        positioner.set(index, el.offsetHeight);
    },
  // @ts-expect-error
  cmp2
);
