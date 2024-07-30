<hr>
<div align="center">
  <h1 align="center">
    🧱 masonic
  </h1>

  <div align="center">
    <a href="https://flexstack.com"><img src="https://flexstack.com/images/supported-by-flexstack.svg" height="38" alt="Supported by FlexStack"></a>
  </div>
</div>
<hr>
<p align="center">
  <a href="https://bundlephobia.com/result?p=masonic">
    <img alt="Bundlephobia" src="https://img.shields.io/bundlephobia/minzip/masonic?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Types" href="https://www.npmjs.com/package/masonic">
    <img alt="Types" src="https://img.shields.io/npm/types/masonic?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Code coverage report" href="https://codecov.io/gh/jaredLunde/masonic">
    <img alt="Code coverage" src="https://img.shields.io/codecov/c/gh/jaredLunde/masonic?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Build status" href="https://travis-ci.com/jaredLunde/masonic">
    <img alt="Build status" src="https://img.shields.io/travis/com/jaredLunde/masonic?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="NPM version" href="https://www.npmjs.com/package/masonic">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/masonic?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="License" href="https://jaredlunde.mit-license.org/">
    <img alt="MIT License" src="https://img.shields.io/npm/l/masonic?style=for-the-badge&labelColor=24292e">
  </a>
</p>

<pre align="center">npm i masonic</pre>

A performant and versatile virtualized masonry grid for React based on Brian Vaughn's [react-virtualized](https://github.com/bvaughn/react-virtualized)
and further inspired by [react-window](https://github.com/bvaughn/react-window).

Using Masonic, you're not just getting a component. You're getting the implementation details, as well, meaning advanced
usage requiring little code is possible.

## Features

- [x] **Easy to use** It takes two minutes to start creating your own masonry grid with this component.
      [For real, check out the demo on **CodeSandbox**](https://codesandbox.io/s/0oyxozv75v).
- [x] **Blazing™ fast** This component can seamlessly render tens of thousands of grid cells
      without lag via its virtualization algorithm and underlying
      [data structures](https://www.scaler.com/topics/data-structures/what-is-data-structure/). For example, it uses
      a [red black interval tree](https://www.geeksforgeeks.org/interval-tree/) to determine which cells to
      render, based upon the scroll position and size of the window the grid is rendered in. Interval trees
      have `O(log n + m)` search performance 😱.
- [x] **TypeScript** Intellisense and type safety mean fewer bugs in your implementation.
- [x] **Versatility** All of [`<Masonry>`](#masonry)'s implementation details (hooks, utilities) are exported,
      so you're not locked into to the default implementation. As you advance, it will be useful to have access
      to those internals. It's also possible to kick the virtualization out of the equation by providing an
      `Infinity` value to the `overscanBy` prop, though this would be a terrible idea for large lists.
- [x] **Autosizing** The default [`<Masonry>`](#masonry) component will automatically resize itself and its
      items if the content of the grid cells changes or resizes. For example, when an image lazily loads this
      component will automatically do the work of recalculating the size of that grid cell. That said, you
      should try to premeasure things (including images) as often as possible in order to achieve the best
      user experience.

## Quick Start

[Check out the demo on **CodeSandbox**](https://codesandbox.io/s/0oyxozv75v)

```jsx harmony
import * as React from "react";
import { Masonry } from "masonic";

let i = 0;
const items = Array.from(Array(5000), () => ({ id: i++ }));

const EasyMasonryComponent = (props) => (
  <Masonry items={items} render={MasonryCard} />
);

const MasonryCard = ({ index, data: { id }, width }) => (
  <div>
    <div>Index: {index}</div>
    <pre>ID: {id}</pre>
    <div>Column width: {width}</div>
  </div>
);
```

## Documentation

### Components

| Component                               | Description                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`<Masonry>`](#masonry)                 | A "batteries included" masonry grid which includes all of the implementation details below. This component is the easiest way to get off and running in your app, before switching to more advanced implementations, if necessary. It will change its column count to fit its container's width and will decide how many rows to render based upon the height of the browser `window`. |
| [`<MasonryScroller>`](#masonryscroller) | A heavily-optimized component that updates [`useMasonry()`](#usemasonryoptions) when the scroll position of the browser `window` changes. This bare-metal component is used by [`<Masonry>`](#masonry) above.                                                                                                                                                                          |
| [`<List>`](#list)                       | This is just a single-column [`<Masonry>`](#masonry) component with no `columnGutter` prop, only `rowGutter`.                                                                                                                                                                                                                                                                          |

### Hooks

| Hook                                                             | Description                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`useMasonry()`](#usemasonryoptions)                             | This hook handles the render phases of the masonry layout and returns the grid as a React element.                                                                                                                                                                                                    |
| [`usePositioner()`](#usepositioneroptions-deps)                  | This hook creates the grid cell positioner and cache required by [`useMasonry()`](#usemasonryoptions). This is the meat of the grid's layout algorithm, determining which cells to render at a given scroll position, as well as where to place new items in the grid.                                |
| [`useResizeObserver()`](#useresizeobserverpositioner)            | Creates a resize observer that forces updates to the grid when mutations are made to the grid cells affecting their size.                                                                                                                                                                             |
| [`useContainerPosition()`](#usecontainerpositionelementref-deps) | A hook for measuring the width of the grid container, as well as its distance from the top of the document. These values are necessary to correctly calculate the number/width of columns to render, as well as the number of rows to render.                                                         |
| [`useScroller()`](#usescrolleroffset-fps)                        | A hook for tracking whether the `window` is currently being scrolled and it's scroll position on the y-axis. These values are used for determining which grid cells to render and when to add styles to the grid container that maximize scroll performance.                                          |
| [`useScrollToIndex()`](#usescrolltoindexpositioner-options)      | A hook that creates a callback for scrolling to a specific index in the "items" array.                                                                                                                                                                                                                |
| [`useInfiniteLoader()`](#useinfiniteloaderloadmoreitems-options) | A utility hook for seamlessly adding infinite scroll behavior to the [`useMasonry()`](#usemasonryoptions) hook. This hook invokes a callback each time the last rendered index surpasses the total number of items in your items array or the number defined in the `totalItems` option of this hook. |

### Utilities

| Utility                                                                                 | Description                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`createPositioner()`](#createpositionercolumncount-columnwidth-columngutter-rowgutter) | Creates a cell positioner for the [`useMasonry()`](#usemasonryoptions) hook. The [`usePositioner()`](#usepositioneroptions-deps) hook uses this utility under the hood.                                  |
| [`createResizeObserver()`](#createresizeobserverpositioner-updater)                     | Creates a resize observer that fires an `updater` callback whenever the height of one or many cells change. The [`useResizeObserver()`](#useresizeobserverpositioner) hook is using this under the hood. |

### Recipes

- [Add infinite scrolling behavior to your Masonry component.](https://codesandbox.io/s/useinfiniteloader-example-vn30p?file=/src/index.js)
- [Cells don't resize once they're measured? Build a Masonry grid without the resize observer.](https://codesandbox.io/s/usemasonry-example-3pcg9?file=/src/index.js)
- [Reset `<Masonry>` layout when switching between routes within the same <Route> component.](https://codesandbox.io/s/masonic-w-react-router-example-2b5f9?file=/src/index.js)
  - [Do the same with an advanced custom implementation using the `usePositioner()` hook.](https://codesandbox.io/s/masonic-w-react-router-and-advanced-config-example-8em42?file=/src/index.js)
- [Render a Masonry component relative to a scrollable HTML element rather than the browser `window`.](https://codesandbox.io/s/masonic-inside-of-a-scrollable-div-example-k9l6c?file=/src/index.js)
- [Add an `isScrolling` prop to cells](https://codesandbox.io/s/usemasonry-example-3pcg9?file=/src/index.js)

---

### &lt;Masonry&gt;

An autosizing masonry grid that only renders items currently visible in the browser `window`. This
component will change its column count to fit its container's width and will decide how many rows
to render based upon the height of the browser `window`. To facilitate this, it uses [`useMasonry()`](#usemasonryoptions),
[`usePositioner()`](#usepositioneroptions-deps), [`useResizeObserver()`](#useresizeobserverpositioner),  
[`useContainerPosition()`](#usecontainerpositionelementref-deps), and [`useScroller()`](#usescrolleroffset-fps) under the hood.

This is the "batteries included" option. It's the easiest way to get off and running with your app and a
great stepping stone to more advanced implementations, should you need them.

[Check out an example on **CodeSandbox**](https://codesandbox.io/s/0oyxozv75v)

```jsx harmony
import * as React from "react";
import { Masonry } from "masonic";

let i = 0;
const items = Array.from(Array(5000), () => ({ id: i++ }));

const EasyMasonryComponent = (props) => (
  <Masonry items={items} render={MasonryCard} />
);

const MasonryCard = ({ index, data: { id }, width }) => (
  <div>
    <div>Index: {index}</div>
    <pre>ID: {id}</pre>
    <div>Column width: {width}</div>
  </div>
);
```

#### Props

**Required props**

| Prop   | Type                                                                 | Required? | Description                                                                                                                                                                                                          |
| ------ | -------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| items  | `any[]`                                                              | Yes       | An array containing the data used by the grid items.                                                                                                                                                                 |
| render | [`React.ComponentType<RenderComponentProps>`](#rendercomponentprops) | Yes       | This component is rendered for each item of your `items` prop array. It should accept three props: `index`, `width`, and `data`. See [`RenderComponentProps`](#rendercomponentprops) for more detail on those props. |

**Column props**

Props for tuning the column width, count, and gutter of your component.

| Prop           | Type     | Default                | Required? | Description                                                                                                                                                                                                                                                                          |
| -------------- | -------- | ---------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| columnWidth    | `number` | `240`                  | No        | This is the minimum column width. `Masonic` will automatically size your columns to fill its container based on your provided `columnWidth` and `columnGutter` values. It will never render anything smaller than this defined width unless its container is smaller than its value. |
| columnGutter   | `number` | `0`                    | No        | This sets the horizontal space between grid columns in pixels. If `rowGutter` is not set, this also sets the vertical space between cells within a column in pixels.                                                                                                                 |
| rowGutter      | `number` | Same as `columnGutter` | No        | This sets the vertical space between cells within a column in pixels.                                                                                                                                                                                                                |
| columnCount    | `number` |                        | No        | By default, `Masonic` derives the column count from the `columnWidth` prop. However, in some situations it is nice to be able to override that behavior e.g. when creating a [`<List>`](#list).                                                                                      |
| maxColumnCount | `number` |                        | No        | Limits the number of columns used by `Masonic`. Useful for implementing responsive layouts.                                                                                                                                                                                          |

**Grid container props**

These props customize how the grid container element is rendered.

| Prop      | Type                                                                            | Default  | Required? | Description                                                                                                                   |
| --------- | ------------------------------------------------------------------------------- | -------- | --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| as        | <code>keyof JSX.IntrinsicElements &#0124; React.ComponentType&lt;any&gt;</code> | `"div"`  | No        | This is the type of element the grid container will be rendered as.                                                           |
| id        | `string`                                                                        |          | No        | Gives the grid container an `id`.                                                                                             |
| className | `string`                                                                        |          | No        | Gives the grid container a `className`.                                                                                       |
| style     | `React.CSSProperties`                                                           |          | No        | Adds extra `style` attributes to the container in addition to those created by the [`useMasonry()`](#usemasonryoptions) hook. |
| role      | <code>"grid" &#124; "list"</code>                                               | `"grid"` | No        | Optionally swap out the accessibility `role` prop of the container and its items.                                             |
| tabIndex  | `number`                                                                        | `0`      | No        | Change the `tabIndex` of the grid container.                                                                                  |

**Grid item props**

Props that customize how individual grid item containers are rendered.

| Prop               | Type                                                                            | Default                  | Required? | Description                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------- | ------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| itemAs             | <code>keyof JSX.IntrinsicElements &#0124; React.ComponentType&lt;any&gt;</code> | `"div"`                  | No        | This is the type of element the grid items will be rendered as.                                                                                                                                                                                                                                                                                                               |
| itemStyle          | `React.CSSProperties`                                                           |                          | No        | Adds extra `style` attributes to the grid items in addition to those created by the [`useMasonry()`](#usemasonryoptions) hook.                                                                                                                                                                                                                                                |
| itemHeightEstimate | `number`                                                                        | `300`                    | No        | This value is used for estimating the initial height of the masonry grid. It is important for the UX of the scrolling behavior and in determining how many `items` to render in a batch, so it's wise to set this value with some level accuracy, though it doesn't need to be perfect.                                                                                       |
| itemKey            | <code>(data: any, index: number) => string &#124; number</code>                 | `(data, index) => index` | No        | The value returned here must be unique to the item. By default, the key is the item's index. This is ok if your collection of items is never modified. Setting this property ensures that the component in `render` is reused each time the masonry grid is reflowed. A common pattern would be to return the item's database ID here if there is one, e.g. `data => data.id` |

**Callbacks**

| Prop     | Type                                                                       | Default | Required? | Description                                                                                                                               |
| -------- | -------------------------------------------------------------------------- | ------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| onRender | <code>(startIndex: number, stopIndex: number, items: any[]) => void</code> |         | No        | This callback is invoked any time the items currently being rendered by the grid change. See [onRender() arguments](#onrender-arguments). |

**Other props**

| Prop          | Type                                                                | Default | Required? | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------- | ------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| overscanBy    | `number`                                                            | `2`     | No        | This number is used for determining the number of grid cells outside of the visible window to render. The default value is `2` which means "render 2 windows worth (2 \* `height`) of content before and after the items in the visible window". A value of `3` would be 3 windows worth of grid cells, so it's a linear relationship. Overscanning is important for preventing tearing when scrolling through items in the grid, but setting too high of a value may create too much work for React to handle, so it's best that you tune this value accordingly. |
| scrollToIndex | `number` \| `{index: number, align: "top" \| "center" \| "bottom"}` |         | No        | Scrolls to a given index within the grid. The grid will re-scroll any time the index changes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

#### `onRender()` arguments

| Argument   | Type     | Description                                                        |
| ---------- | -------- | ------------------------------------------------------------------ |
| startIndex | `number` | The index of the first item currently being rendered in the window |
| stopIndex  | `number` | The index of the last item currently being rendered in the window  |
| items      | `any[]`  | The array of items you provided to the `items` prop                |

### RenderComponentProps

| Prop  | Type     | Description                                             |
| ----- | -------- | ------------------------------------------------------- |
| index | `number` | The index of the cell in the `items` prop array.        |
| width | `number` | The rendered width of the cell's column.                |
| data  | `any`    | The data at `items[index]` of your `items` prop array.. |

---

### &lt;MasonryScroller&gt;

A heavily-optimized component that updates [`useMasonry()`](#usemasonryoptions) when the scroll position of the
browser `window` changes. This bare-metal component is used by [`<Masonry>`](#masonry) above.

When would you use this? If you're building an advanced masonry grid implementation, but you don't want
to deal with figuring out how to optimize the exchange between scroll position changes in the browser
`window` and the [`useMasonry() hook`](#usemasonryoptions).

[Check out an example on **CodeSandbox**](https://codesandbox.io/s/masonryscroller-example-b7xvn?file=/src/index.js)

```jsx harmony
import * as React from "react";
import { MasonryScroller, usePositioner, useContainerPosition } from "masonic";
import { useWindowSize } from "@react-hook/window-size";

const MyMasonry = (props) => {
  const containerRef = React.useRef(null);
  const [windowWidth, windowHeight] = useWindowSize();
  const { offset, width } = useContainerPosition(containerRef, [
    windowWidth,
    windowHeight,
  ]);
  const positioner = usePositioner({ width, columnWidth: 320 });

  return (
    <MasonryScroller
      positioner={positioner}
      // The distance in px between the top of the document and the top of the
      // masonry grid container
      offset={offset}
      // The height of the virtualization window
      height={windowHeight}
      // Forwards the ref to the masonry container element
      containerRef={containerRef}
      {...props}
    />
  );
};
```

#### Props

In addition to these props, this component accepts all of the props outlined in [`<Masonry>`](#masonry)
with exception to `columnGutter`, `rowGutter`, `columnWidth`, `columnCount`, `maxColumntCount`, `ssrWidth`, and `ssrHeight`.

| Prop           | Type                                                                | Default | Required? | Description                                                                                                                                                                                                                                                                                                             |
| -------------- | ------------------------------------------------------------------- | ------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| offset         | `number`                                                            | `0`     | No        | The vertical space in pixels between the top of the grid container and the top of the browser `document.documentElement`.                                                                                                                                                                                               |
| height         | `number`                                                            |         | Yes       | This is the height of the window. If you're rendering the grid relative to the browser `window`, the current `document.documentElement.clientHeight` is the value you'll want to set here. If you're rendering the grid inside of another HTML element, you'll want to provide the current `element.offsetHeight` here. |
| positioner     | [`Positioner`](#positioner)                                         |         | Yes       | A grid cell positioner and cache created by the [`usePositioner()`](#usepositioneroptions-deps) hook or [`createPositioner()`](#createpositionercolumncount-columnwidth-columngutter-rowgutter) utility.                                                                                                                |
| containerRef   | <code>React.MutableRefObject&lt;HTMLElement &#0124; null&gt;</code> |         | No        | Forwards a React ref to the grid container.                                                                                                                                                                                                                                                                             |
| resizeObserver | `ResizeObserver`                                                    |         | No        | A resize observer that tracks mutations to the grid cells and forces the Masonry grid to recalculate its layout if any cells affect column heights change. Check out the [`useResizeObserver()`](#useresizeobserverpositioner) hook and [`createResizeObserver()`](#createresizeobserverpositioner-updater) utility.    |

---

### &lt;List&gt;

This is a single-column [`<Masonry>`](#masonry) component. That is, it uses the [`useMasonry()`](#usemasonryoptions) hook
and other utilities to create a virtualized list.

[Check out an example on **CodeSandbox**](https://codesandbox.io/s/list-example-3g0tc?file=/src/index.js)

```jsx harmony
import * as React from "react";
import { List } from "masonic";

let i = 0;
const items = Array.from(Array(5000), () => ({ id: i++ }));

const EasyListComponent = (props) => (
  <List items={items} rowGutter={32} render={ListCard} />
);

const ListCard = ({ index, data: { id }, width }) => (
  <div>
    <div>Index: {index}</div>
    <pre>ID: {id}</pre>
    <div>Column width: {width}</div>
  </div>
);
```

#### Props

In addition to these props, this component accepts all of the props outlined in [`<Masonry>`](#masonry)
with exception to `columnGutter`, `columnWidth`, `columnCount`, and `maxColumnCount`.

| Prop      | Type     | Default | Required? | Description                                                            |
| --------- | -------- | ------- | --------- | ---------------------------------------------------------------------- |
| rowGutter | `number` | `0`     | No        | The amount of vertical space in pixels to add between list item cards. |

---

### useMasonry(options)

This hook handles the render phases of the masonry layout and returns the grid as a React element.

[Check out an example on **CodeSandbox**](https://codesandbox.io/s/usemasonry-example-3pcg9?file=/src/index.js)

```jsx harmony
import * as React from "react";
import { useWindowSize } from "@react-hook/window-size";
import {
  useMasonry,
  usePositioner,
  useContainerPosition,
  useScroller,
} from "masonic";

const MyMasonry = (props) => {
  const containerRef = React.useRef(null);
  const [windowWidth, height] = useWindowSize();
  const { offset, width } = useContainerPosition(containerRef, [
    windowWidth,
    height,
  ]);
  const { scrollTop, isScrolling } = useScroller(offset);
  const positioner = usePositioner({ width });

  return useMasonry({
    positioner,
    scrollTop,
    isScrolling,
    height,
    containerRef,
    ...props,
  });
};
```

#### Arguments

| Argument | Type                                        | Description                                                                                  |
| -------- | ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| options  | [`UseMasonryOptions`](#usemasonryoptions-1) | The distance in pixels between the top of your masonry container and the top of the document |

#### UseMasonryOptions

**Required options**

| Prop       | Type                                                                 | Required? | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | -------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| items      | `any[]`                                                              | Yes       | An array containing the data used by the grid items.                                                                                                                                                                                                                                                                                                                                                                                                         |
| positioner | [`Positioner`](#positioner)                                          | Yes       | A grid cell positioner and cache created by the [`usePositioner()`](#usepositioneroptions-deps) hook or [`createPositioner()`](#createpositionercolumncount-columnwidth-columngutter-rowgutter) utility.                                                                                                                                                                                                                                                     |
| height     | `number`                                                             | Yes       | This is the height of the window. If you're rendering the grid relative to the browser `window`, the current `document.documentElement.clientHeight` is the value you'll want to set here. If you're rendering the grid inside of another HTML element, you'll want to provide the current `element.offsetHeight` here.                                                                                                                                      |
| scrollTop  | `number`                                                             | Yes       | The current scroll progress in pixel of the window the grid is rendered in. If you're rendering the grid relative to the browser `window`, you'll want the most current `window.scrollY` here. If you're rendering the grid inside of another HTML element, you'll want the current `element.scrollTop` value here. The `useScroller()` hook and `<MasonryScroller>` components will help you if you're rendering the grid relative to the browser `window`. |
| render     | [`React.ComponentType<RenderComponentProps>`](#rendercomponentprops) | Yes       | This component is rendered for each item of your `items` prop array. It should accept three props: `index`, `width`, and `data`. See [`RenderComponentProps`](#rendercomponentprops).                                                                                                                                                                                                                                                                        |

**Grid container options**

| Prop         | Type                                                                            | Default  | Required? | Description                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------- | -------- | --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| as           | <code>keyof JSX.IntrinsicElements &#0124; React.ComponentType&lt;any&gt;</code> | `"div"`  | No        | This is the type of element the grid container will be rendered as.                                                           |
| id           | `string`                                                                        |          | No        | Optionally gives the grid container an `id` prop.                                                                             |
| className    | `string`                                                                        |          | No        | Optionally gives the grid container a `className` prop.                                                                       |
| style        | `React.CSSProperties`                                                           |          | No        | Adds extra `style` attributes to the container in addition to those created by the [`useMasonry()`](#usemasonryoptions) hook. |
| role         | <code>"grid" &#124; "list"</code>                                               | `"grid"` | No        | Optionally swap out the accessibility `role` prop of the container and its items.                                             |
| tabIndex     | `number`                                                                        | `0`      | No        | Change the `tabIndex` of the grid container.                                                                                  |
| containerRef | <code>React.MutableRefObject&lt;HTMLElement &#0124; null&gt;</code>             |          | No        | Forwards a React ref to the grid container.                                                                                   |

**Grid item options**

| Prop               | Type                                                                            | Default                  | Required? | Description                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------- | ------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| itemAs             | <code>keyof JSX.IntrinsicElements &#0124; React.ComponentType&lt;any&gt;</code> | `"div"`                  | No        | This is the type of element the grid items will be rendered as.                                                                                                                                                                                                                                                                                                               |
| itemStyle          | `React.CSSProperties`                                                           |                          | No        | Adds extra `style` attributes to the grid items in addition to those created by the [`useMasonry()`](#usemasonryoptions) hook.                                                                                                                                                                                                                                                |
| itemHeightEstimate | `number`                                                                        | `300`                    | No        | This value is used for estimating the initial height of the masonry grid. It is important for the UX of the scrolling behavior and in determining how many `items` to render in a batch, so it's wise to set this value with some level accuracy, though it doesn't need to be perfect.                                                                                       |
| itemKey            | <code>(data: any, index: number) => string &#124; number</code>                 | `(data, index) => index` | No        | The value returned here must be unique to the item. By default, the key is the item's index. This is ok if your collection of items is never modified. Setting this property ensures that the component in `render` is reused each time the masonry grid is reflowed. A common pattern would be to return the item's database ID here if there is one, e.g. `data => data.id` |

**Callbacks**

| Prop     | Type                                                                                        | Default | Required? | Description                                                                              |
| -------- | ------------------------------------------------------------------------------------------- | ------- | --------- | ---------------------------------------------------------------------------------------- |
| onRender | <code>(startIndex: number, stopIndex: number &#124; undefined, items: any[]) => void</code> |         | No        | This callback is invoked any time the items currently being rendered by the grid change. |

**Other options**

| Prop           | Type             | Default | Required? | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------- | ---------------- | ------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| overscanBy     | `number`         | `2`     | No        | This number is used for determining the number of grid cells outside of the visible window to render. The default value is `2` which means "render 2 windows worth (2 \* `height`) of content before and after the items in the visible window". A value of `3` would be 3 windows worth of grid cells, so it's a linear relationship. Overscanning is important for preventing tearing when scrolling through items in the grid, but setting too high of a value may create too much work for React to handle, so it's best that you tune this value accordingly. |
| resizeObserver | `ResizeObserver` |         | No        | A resize observer that tracks mutations to the grid cells and forces the Masonry grid to recalculate its layout if any cells affect column heights change. Check out the [`useResizeObserver()`](#useresizeobserverpositioner) hook and [`createResizeObserver()`](#createresizeobserverpositioner-updater) utility.                                                                                                                                                                                                                                               |

---

### usePositioner(options, deps?)

This hook creates the grid cell positioner and cache required by [`useMasonry()`](#usemasonryoptions). This is
the meat of the grid's layout algorithm, determining which cells to render at a given scroll
position, as well as where to place new items in the grid.

[Check out an example on **CodeSandbox**](https://codesandbox.io/s/usemasonry-example-3pcg9?file=/src/index.js)

```jsx harmony
import * as React from "react";
import { usePositioner, useContainerPosition, MasonryScroller } from "masonic";

const MyMasonry = ({ columnWidth = 300, columnGutter = 16, ...props }) => {
  const { width, offset } = useContainerPosition();
  const positioner = usePositioner({ width, columnWidth, columnGutter });
  return <MasonryScroller positioner={positioner} offset={offset} {...props} />;
};
```

#### Arguments

| Argument | Type                                                        | Default | Required? | Description                                                                                                                    |
| -------- | ----------------------------------------------------------- | ------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| options  | [`UsePositionerOptions`](#usepositioneroptions-depsoptions) |         | Yes       | Properties that determine the number of columns in the grid, as well as their widths.                                          |
| deps     | `React.DependenciesList`                                    | `[]`    | No        | This hook will create a new positioner, clearing all existing cached positions, whenever the dependencies in this list change. |

#### UsePositionerOptions

| Argument       | Type     | Default                | Required? | Description                                                                                                                                                                                                                                                                                                                                                                          |
| -------------- | -------- | ---------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| width          | `number` |                        | Yes       | The width of the container you're rendering the grid within, e.g. the container element's `element.offsetWidth`. That said, you can provide any width here.                                                                                                                                                                                                                          |
| columnWidth    | `number` | `200`                  | No        | The minimum column width. The [`usePositioner()`](#usepositioneroptions-deps) hook will automatically size the columns to fill their container based upon the `columnWidth` and `columnGutter` values. It will never render anything smaller than this width unless its container itself is smaller than its value. This property has no effect if you're providing a `columnCount`. |
| columnGutter   | `number` | `0`                    | No        | This sets the horizontal space between grid columns in pixels. If `rowGutter` is not set, this also sets the vertical space between cells within a column in pixels.                                                                                                                                                                                                                 |
| rowGutter      | `number` | Same as `columnGutter` | No        | This sets the vertical space between cells within a column in pixels.                                                                                                                                                                                                                                                                                                                |
| columnCount    | `number` |                        | No        | By default, [`usePositioner()`](#usepositioneroptions-deps) derives the column count from the `columnWidth`, `columnGutter`, and `width` props. However, in some situations it is nice to be able to override that behavior (e.g. creating a [`<List>`-like](#list) component).                                                                                                      |
| maxColumnCount | `number` |                        | No        | Limits the number of columns used by [`usePositioner()`](#usepositioneroptions-deps). Useful for implementing responsive layouts.                                                                                                                                                                                                                                                    |

#### Returns a [`Positioner`](#positioner)

### Positioner

```ts
export interface Positioner {
  /**
   * The number of columns in the grid
   */
  columnCount: number;
  /**
   * The width of each column in the grid
   */
  columnWidth: number;
  /**
   * Sets the position for the cell at `index` based upon the cell's height
   */
  set: (index: number, height: number) => void;
  /**
   * Gets the `PositionerItem` for the cell at `index`
   */
  get: (index: number) => PositionerItem | undefined;
  /**
   * Updates cells based on their indexes and heights
   * positioner.update([index, height, index, height, index, height...])
   */
  update: (updates: number[]) => void;
  /**
   * Searches the interval tree for grid cells with a `top` value in
   * betwen `lo` and `hi` and invokes the callback for each item that
   * is discovered
   */
  range: (
    lo: number,
    hi: number,
    renderCallback: (index: number, left: number, top: number) => void
  ) => void;
  /**
   * Returns the number of grid cells in the cache
   */
  size: () => number;
  /**
   * Estimates the total height of the grid
   */
  estimateHeight: (itemCount: number, defaultItemHeight: number) => number;
  /**
   * Returns the height of the shortest column in the grid
   */
  shortestColumn: () => number;
  /**
   * Returns all `PositionerItem` items
   */
  all: () => PositionerItem[];
}

export interface PositionerItem {
  /**
   * This is how far from the top edge of the grid container in pixels the
   * item is placed
   */
  top: number;
  /**
   * This is how far from the left edge of the grid container in pixels the
   * item is placed
   */
  left: number;
  /**
   * This is the height of the grid cell
   */
  height: number;
  /**
   * This is the column number containing the grid cell
   */
  column: number;
}
```

---

### useScroller(offset?, fps?)

A hook for tracking whether the `window` is currently being scrolled and it's scroll position
on the y-axis. These values are used for determining which grid cells to render and when
to add styles to the masonry container that maximize scroll performance.

[Check out an example on **CodeSandbox**](https://codesandbox.io/s/usemasonry-example-3pcg9?file=/src/index.js)

```jsx harmony
import * as React from "react";
import { useMasonry, usePositioner, useScroller } from "masonic";

const MyMasonry = (props) => {
  const containerRef = React.useRef(null);
  const { offset, width } = useContainerPosition(containerRef);
  const positioner = usePositioner({ width });
  const { scrollTop, isScrolling } = useScroller(offset);

  return useMasonry({
    ...props,
    containerRef,
    positioner,
    scrollTop,
    isScrolling,
  });
};
```

#### Arguments

| Argument | Type     | Description                                                                                                                                                                                                                                                                                                                                                      |
| -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| offset   | `number` | The vertical space in pixels between the top of the grid container and the top of the browser `document.documentElement`.                                                                                                                                                                                                                                        |
| fps      | `number` | This determines how often (in frames per second) to update the scroll position of the browser `window` in state, and as a result the rate the masonry grid recalculates its visible cells. The default value of `12` has been very reasonable in my own testing, but if you have particularly heavy `render` components it may be prudent to reduce this number. |

#### Returns `{scrollTop: number; isScrolling: boolean}`

---

### useContainerPosition(elementRef, deps?)

A hook for measuring the width of the grid container, as well as its distance
from the top of the document. These values are necessary to correctly calculate the number/width
of columns to render, as well as the number of rows to render.

[Check out an example on **CodeSandbox**](https://codesandbox.io/s/usemasonry-example-3pcg9?file=/src/index.js)

```jsx harmony
import * as React from "react";
import { useWindowSize } from "@react-hook/window-size";
import { useContainerPosition, MasonryScroller } from "masonic";

const MyMasonry = (props) => {
  const containerRef = React.useRef(null);
  const [windowWidth, windowHeight] = useWindowSize();
  const { offset, width } = useContainerRect(
    containerRef,
    // In this example, we want to recalculate the `offset` and `width`
    // any time the size of the window changes
    [windowWidth, windowHeight]
  );

  return (
    <MasonryScroller
      width={width}
      height={windowHeight}
      containerRef={containerRef}
      {...props}
    />
  );
};
```

#### Arguments

| Argument   | Type                     | Description                                                                                                                                                                                                                                                                     |
| ---------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| elementRef | `number`                 | A `ref` object created by `React.useRef()`. That ref should be provided to the `containerRef` property in [`useMasonry()`](#usemasonryoptions).                                                                                                                                 |
| deps       | `React.DependenciesList` | You can force this hook to recalculate the `offset` and `width` whenever this dependencies list changes. A common dependencies list might look like `[windowWidth, windowHeight]`, which would force the hook to recalculate any time the size of the browser `window` changed. |

#### Returns [`ContainerPosition`](#containerposition)

### ContainerPosition

```ts
export interface ContainerPosition {
  /**
   * The distance in pixels between the top of the element in `elementRef` and the top of
   * the `document.documentElement`.
   */
  offset: number;
  /**
   * The `offsetWidth` of the element in `elementRef`.
   */
  width: number;
}
```

---

### useScrollToIndex(positioner, options?)

A hook that creates a callback for scrolling to a specific index in the "items" array.

[Check out an example on **CodeSandbox**](https://codesandbox.io/s/usescrolltoindex-example-k5leo?file=/src/index.js)

```jsx harmony
import * as React from "react";
import {
  useMasonry,
  usePositioner,
  useContainerPosition,
  useScroller,
  useScrollToIndex,
} from "masonic";

const MyMasonry = (props) => {
  const containerRef = React.useRef(null);
  const { offset, width } = useContainerPosition(containerRef);
  const { scrollTop, isScrolling } = useScroller(offset);
  const positioner = usePositioner({ width });
  const scrollToIndex = useScrollToIndex(positioner);

  React.useEffect(() => {
    if (props.scrollToIndex) {
      scrollToIndex(props.scrollToIndex);
    }
  }, [props.scrollToIndex, scrollToIndex]);

  return useMasonry({
    ...props,
    containerRef,
    positioner,
    scrollTop,
    isScrolling,
  });
};
```

#### Arguments

| Argument   | Type                                                  | Description                                                                       |
| ---------- | ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| positioner | [`Positioner`](#positioner)                           | A positioner created by the [`usePositioner()`](#usepositioner) hook.             |
| options    | [`UseScrollToIndexOptions`](#usescrolltoindexoptions) | Configuration options. See [`UseScrollToIndexOptions`](#usescrolltoindexoptions). |

#### `UseScrollToIndexOptions`

| Option  | Type                                                                  | Description                                                                                    |
| ------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| element | `Window` \| `HTMLElement` \| `React.RefObject<HTMLElement>` \| `null` | The window element or a React ref for the window element. That is, this is the grid container. |
| align   | `"top"` \| `"center"` \| `"bottom"`                                   | Sets the vertical alignment of the cell within the grid container.                             |
| height  | `number`                                                              | The height of the grid.                                                                        |
| offset  | `number`                                                              | The vertical space in pixels between the top of the grid container and the top of the window.  |

#### Returns `(index: number) => void`

---

### useResizeObserver(positioner)

This hook creates a resize observer that forces updates to the grid cell positions when mutations are
made to cells affecting their height.

[Check out an example on **CodeSandbox**](https://codesandbox.io/s/useresizeobserver-example-w7r9i?file=/src/index.js)

```jsx harmony
import * as React from "react";
import { useMasonry, usePositioner, useResizeObserver } from "masonic";

const MyMasonry = (props) => {
  const positioner = usePositioner({ width: 1024 });
  const resizeObserver = useResizeObserver(positioner);

  return useMasonry({
    positioner,
    resizeObserver,
    scrollTop,
    isScrolling,
    height,
    ...props,
  });
};
```

#### Arguments

| Argument   | Type                        | Description                                                                              |
| ---------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| positioner | [`Positioner`](#positioner) | The cell positioner created by the [`usePositioner()`](#usepositioneroptions-deps) hook. |

#### Returns a [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)

---

### useInfiniteLoader(loadMoreItems, options?)

A utility hook for seamlessly adding infinite scroll behavior to the [`useMasonry()`](#usemasonryoptions) hook
and the components that use it. This hook invokes a callback each time the last rendered index surpasses
the total number of items in your items array or the number defined in the `totalItems` option.

[Check out an example on **CodeSandbox**](https://codesandbox.io/s/useinfiniteloader-example-vn30p?file=/src/index.js)

```jsx harmony
import * as React from "react";
import { Masonry, useInfiniteLoader } from "masonic";

const InfiniteMasonry = (props) => {
  const [items, setItems] = useState([
    /* initial items */
  ]);
  const fetchMoreItems = async (startIndex, stopIndex, currentItems) => {
    const nextItems = await fetch(
      `/api/get-more?after=${startIndex}&limit=${startIndex + stopIndex}`
    );

    setItems((current) => [...current, ...nextItems]);
  };
  const maybeLoadMore = useInfiniteLoader(fetchMoreItems, {
    isItemLoaded: (index, items) => !!items[index],
  });

  return <Masonry {...props} items={items} onRender={maybeLoadMore} />;
};
```

#### Arguments

| Argument      | Type                                                           | Description                                                                                                                               |
| ------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| loadMoreItems | `(startIndex: number, stopIndex: number, items: any[]) => any` | This callback is invoked when more rows must be loaded. It will be used to determine when to refresh the list with the newly-loaded data. |
| options       | [`UseInfiniteLoaderOptions` ](#useinfiniteloaderoptions)       | Configuration object for your loader, see [`UseInfiniteLoaderOptions`](#useinfiniteloaderoptions) below.                                  |

#### UseInfiniteLoaderOptions

| Property         | Type                                       | Default                                        | Description                                                                                                                                                           |
| ---------------- | ------------------------------------------ | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| isItemLoaded     | `(index: number, items: any[]) => boolean` | `(index, items) => items[index] !== undefined` | A callback responsible for determining the loaded state of each item. Should return `true` if the item has already been loaded and `false` if not.                    |
| minimumBatchSize | `number`                                   | `16`                                           | The minimum number of new items to be loaded at a time. This property can be used to batch requests and reduce HTTP requests.                                         |
| threshold        | `number`                                   | `16`                                           | The threshold at which to pre-fetch data. A threshold X means that new data should start loading when a user scrolls within X cells of the end of your `items` array. |
| totalItems       | `number`                                   | `9E9`                                          | The total number of items you'll need to eventually load (if known). This can be arbitrarily high if not known.                                                       |

#### Returns `(startIndex: number, stopIndex: number, items: any[]) => any`

---

### createPositioner(columnCount, columnWidth, columnGutter, rowGutter)

Creates a cell positioner for the `useMasonry()` hook. The `usePositioner()` hook uses
this utility under the hood.

#### Arguments

| Argument       | Type     | Description                                                                                          |
| -------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| columnCount    | `number` | The number of columns in the grid                                                                    |
| columnWidth    | `number` | The width of each column in the grid                                                                 |
| columnGutter   | `number` | The amount of horizontal space between columns in pixels.                                            |
| rowGutter      | `number` | The amount of vertical space between cells within a column in pixels (falls back to `columnGutter`). |
| maxColumnCount | `number` | The upper bound of column count.                                                                     |

#### Returns [`Positioner`](#positioner)

---

### createResizeObserver(positioner, updater)

Creates a resize observer that forces updates to the grid cell positions when mutations are
made to cells affecting their height.

#### Arguments

| Argument   | Type                          | Description                                                                                                                                                                                  |
| ---------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| positioner | [`Positioner`](#positioner)   | A cell positioner created by the [`usePositioner()`](#usepositioneroptions-deps) hook or the [`createPositioner()`](#createpositionercolumncount-columnwidth-columngutter-rowgutter) utility |
| updater    | `(updates: number[]) => void` | A callback that fires whenever one or many cell heights change. Updates are provided to the callback in the form of a flat array: `[index, height, index, height, index, height, ...]`       |

#### Returns a [`ResizeObserver`](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)

---

## Differences from [react-virtualized](https://github.com/bvaughn/react-virtualized)

There are actually quite a few differences between these components and
the originals, despite the overall design being highly inspired by them.

1. The `react-virtualized` component requires a `<CellMeasurer>`,
   `cellPositioner`, and `cellMeasurerCache` and a ton of custom implementation
   to get off the ground. It's very difficult to work with. In `Masonic` this
   functionality is built in using [`resize-observer-polyfill`](https://github.com/que-etc/resize-observer-polyfill)
   for tracking cell size changes.

2. This component can auto-calculate the number of columns to render based
   upon the defined `columnWidth` property. The column count will update
   any time it changes.

3. The algoirthm for updating cell positions and sizes is much more
   efficient in this component because only specific cells and columns are
   updated when cell sizes change, whereas in the original a complete reflow
   has to triggered.

4. The API and internals are a complete rewrite and because of the above points, is
   much easier to use in my opinion.

---

## Legacy Documentation

- [Version 2 documentation](./docs/v2.md)

## LICENSE

MIT
