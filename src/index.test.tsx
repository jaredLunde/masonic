import { dimension } from "@shopify/jest-dom-mocks";
import { act, render, screen } from "@testing-library/react";
import { act as hookAct, renderHook } from "@testing-library/react-hooks";
import type { RenderHookResult } from "@testing-library/react-hooks";
import * as React from "react";
import {
  createResizeObserver,
  List,
  Masonry,
  MasonryScroller,
  useContainerPosition,
  useInfiniteLoader,
  useMasonry,
  usePositioner,
  useResizeObserver,
  useScroller,
} from "./index";
import * as useForceUpdateModule from "./use-force-update";

jest.useFakeTimers();

class ResizeObserver {
  els = [];
  callback: any;
  constructor(callback) {
    this.callback = callback;
  }
  observe(el) {
    // @ts-expect-error
    this.els.push(el);
  }
  unobserve() {
    // do nothing
  }
  disconnect() {}

  resize(index: number, height: number) {
    // @ts-expect-error
    this.els[index].offsetHeight = height;
    this.callback(
      this.els.map((el) => ({
        target: el,
      }))
    );
  }
}
window.ResizeObserver = ResizeObserver;

beforeEach(() => {
  dimension.mock({
    offsetHeight: (element) => {
      let el = element[Object.keys(element)[0]];

      while (el) {
        const height = el.pendingProps?.style?.height;
        if (height) return parseInt(height);
        el = el.child;
      }

      return 0;
    },
    offsetWidth: (element) => {
      let el = element[Object.keys(element)[0]];
      while (el) {
        const width = el.pendingProps?.style?.width;
        if (width) return parseInt(width);
        el = el.child;
      }

      return 0;
    },
  });

  perf.install();
});

afterEach(() => {
  resetSize();
  resetScroll();
  dimension.restore();
  perf.uninstall();
  jest.restoreAllMocks();
});

describe("useMasonry()", () => {
  const renderBasicMasonry = (
    withProps,
    initialProps: Record<string, any> = { scrollTop: 0 }
  ) =>
    renderHook(
      (props) => {
        const positioner = usePositioner({ width: 1280 });
        return useMasonry({
          height: 720,
          positioner,
          items: getFakeItems(1),
          render: FakeCard,
          ...withProps,
          ...props,
        });
      },
      { initialProps }
    );

  it("should apply default styles to the container", () => {
    const { result } = renderBasicMasonry({
      items: getFakeItems(1),
      overscanBy: 1,
      itemHeightEstimate: 240,
    });

    expect(result.current.props.style).toEqual({
      width: "100%",
      maxWidth: "100%",
      height: 240,
      maxHeight: 240,
      position: "relative",
      willChange: undefined,
      pointerEvents: undefined,
    });
  });

  it('should apply "isScrolling" styles to the container', () => {
    const { result } = renderBasicMasonry(
      {},
      { scrollTop: 0, isScrolling: true }
    );

    expect(result.current.props.style).toEqual(
      expect.objectContaining({
        willChange: "contents",
        pointerEvents: "none",
      })
    );
  });

  it("should estimate the height of the container", () => {
    const { result } = renderHook(
      (props) => {
        const positioner = usePositioner({
          width: 1280,
          columnWidth: 1280 / 4,
        });
        return useMasonry({
          height: 720,
          positioner,
          items: getFakeItems(16 * 4),
          overscanBy: 1,
          itemHeightEstimate: 720 / 4,
          render: FakeCard,
          ...props,
        });
      },
      {
        initialProps: { scrollTop: 0 },
      }
    );

    expect(result.current.props.style).toEqual(
      expect.objectContaining({
        height: 720 * 4,
        maxHeight: 720 * 4,
      })
    );
  });

  it("should adjust the estimated height of the container based upon the first phase measurements", () => {
    const hook = renderHook(
      (props) => {
        const positioner = usePositioner({
          width: 1280,
          columnWidth: 1280 / 4,
        });
        return useMasonry({
          height: 720,
          positioner,
          items: getFakeItems(4 * 4, 360),
          overscanBy: 1,
          itemHeightEstimate: 720 / 4,
          render: FakeCard,
          ...props,
        });
      },
      {
        initialProps: { scrollTop: 0 },
      }
    );

    expect(hook.result.current.props.style).toEqual(
      expect.objectContaining({
        height: 720,
        maxHeight: 720,
      })
    );

    renderPhase2(hook);

    expect(hook.result.current.props.style).toEqual(
      expect.objectContaining({
        height: 4 * 360,
        maxHeight: 4 * 360,
      })
    );
  });

  it("should render in batches", () => {
    const hook = renderHook(
      (props) => {
        const positioner = usePositioner({ width: 1280, columnWidth: 320 });
        return useMasonry({
          height: 720,
          positioner,
          items: getFakeItems(100 * 4, 720),
          itemHeightEstimate: 720,
          overscanBy: 1,
          render: FakeCard,
          ...props,
        });
      },
      {
        initialProps: { scrollTop: 0 },
      }
    );

    expect(hook.result.current.props.children.length).toEqual(4);
    renderPhase2(hook);
    expect(hook.result.current.props.children.length).toEqual(4);
    hook.rerender({ scrollTop: 720 });
    expect(hook.result.current.props.children.length).toEqual(8);
    // The first batch should retain their styles
    for (let i = 0; i < 3; i++) {
      expect(hook.result.current.props.children[i].props.style).not.toEqual(
        prerenderStyles(320)
      );
    }
    // The new batch should get prerender styles
    for (let i = 4; i < 8; i++) {
      expect(hook.result.current.props.children[i].props.style).toEqual(
        prerenderStyles(320)
      );
    }

    renderPhase2(hook);
    expect(hook.result.current.props.children.length).toEqual(8);
    // The new batch should get measured styles
    for (let i = 4; i < 8; i++) {
      expect(hook.result.current.props.children[i].props.style).not.toEqual(
        prerenderStyles(320)
      );
    }
  });

  it("should fire onRender function when new cells render", () => {
    const onRender = jest.fn();
    const items = getFakeItems(12, 720);

    const hook = renderHook(
      (props) => {
        const positioner = usePositioner({ width: 1280, columnWidth: 320 });
        return useMasonry({
          height: 720,
          positioner,
          items,
          itemHeightEstimate: 720,
          overscanBy: 1,
          onRender,
          render: FakeCard,
          ...props,
        });
      },
      {
        initialProps: { scrollTop: 0 },
      }
    );

    expect(onRender).not.toHaveBeenCalledWith();

    renderPhase2(hook, { scrollTop: 0 });
    // Needs to cycle through another useEffect() after phase 2
    hook.rerender({ scrollTop: 0 });
    expect(onRender).toHaveBeenCalledTimes(1);
    expect(onRender).toHaveBeenCalledWith(0, 3, items);

    hook.rerender({ scrollTop: 720 });
    renderPhase2(hook, { scrollTop: 720 });
    // Needs to cycle through another useEffect() after phase 2
    hook.rerender({ scrollTop: 720 });
    expect(onRender).toHaveBeenCalledTimes(2);
    expect(onRender).toHaveBeenCalledWith(0, 7, items);

    hook.rerender({ scrollTop: 1440 });

    expect(onRender).toHaveBeenCalledTimes(3);
    expect(onRender).toHaveBeenCalledWith(4, 7, items);

    renderPhase2(hook, { scrollTop: 1440 });
    expect(onRender).toHaveBeenCalledTimes(4);
    expect(onRender).toHaveBeenCalledWith(4, 11, items);
  });

  it('should add custom "style" to the container', () => {
    const { result } = renderBasicMasonry({
      style: { backgroundColor: "#000" },
    });
    expect(result.current.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: "#000",
      })
    );
  });

  it('should add custom "style" to its items', () => {
    const { result } = renderBasicMasonry({
      itemStyle: { backgroundColor: "#000" },
    });
    expect(result.current.props.children[0].props.style).toEqual(
      expect.objectContaining({
        backgroundColor: "#000",
      })
    );
  });

  it('should add custom "key" to its items', () => {
    const { result } = renderBasicMasonry({
      itemKey: (data) => `id:${data.id}`,
    });
    expect(result.current.props.children[0].key).toEqual("id:0");
  });

  it('should add custom "role" to its container and items', () => {
    const { result } = renderBasicMasonry({ role: "list" });
    expect(result.current.props.role).toEqual("list");
    expect(result.current.props.children[0].props.role).toEqual("listitem");
  });

  it('should add "tabIndex" to container', () => {
    const { result } = renderBasicMasonry({ tabIndex: -1 });
    expect(result.current.props.tabIndex).toEqual(-1);
  });

  it('should add "className" to container', () => {
    const { result } = renderBasicMasonry({ className: "foo" });
    expect(result.current.props.className).toEqual("foo");
  });

  it.skip('should render multiple batches if "itemHeightEstimate" isn\'t accurate', () => {
    // eslint-disable-next-line prefer-const
    let hook: RenderHookResult<
      { items: { id: number; height: number }[] },
      JSX.Element
    >;

    // Render hook again on useForceUpdate
    jest.spyOn(useForceUpdateModule, "useForceUpdate").mockReturnValue(() => {
      if (hook) {
        hook.rerender();
        render(hook.result.current);
      }
    });

    // Render hook with items-dependent positioner
    hook = renderHook(
      (props) => {
        const positioner = usePositioner({ width: 1280, columnWidth: 1280 }, [
          props.items[0],
        ]);
        return useMasonry({
          height: 1280,
          positioner,
          itemHeightEstimate: 640,
          overscanBy: 1,
          render: FakeCard,
          scrollTop: 0,
          ...props,
        });
      },
      {
        initialProps: {
          items: getFakeItems(100, 80),
        },
      }
    );

    // Switch items, positioner will update itself
    hook.rerender({
      items: getFakeItems(100, 80),
    });

    // All items should have measured styles
    for (let i = 0; i < 2; i++) {
      expect(hook.result.current.props.children[i].props.style).not.toEqual(
        prerenderStyles(1280)
      );
    }
  });
});

describe("usePositioner()", () => {
  it("should automatically derive column count and fill its container width", () => {
    const { result, rerender } = renderHook((props) => usePositioner(props), {
      initialProps: { width: 1280, columnWidth: 318 },
    });

    expect(result.current.columnCount).toBe(4);
    expect(result.current.columnWidth).toBe(320);

    rerender({ width: 600, columnWidth: 318 });
    expect(result.current.columnCount).toBe(1);
    expect(result.current.columnWidth).toBe(600);
  });

  it('should automatically derive column count and fill its container width accounting for "columnGutter"', () => {
    const { result, rerender } = renderHook((props) => usePositioner(props), {
      initialProps: { width: 1280, columnWidth: 310, columnGutter: 10 },
    });

    expect(result.current.columnCount).toBe(4);
    expect(result.current.columnWidth).toBe(312);

    rerender({ width: 600, columnWidth: 280, columnGutter: 12 });
    expect(result.current.columnCount).toBe(2);
    expect(result.current.columnWidth).toBe(294);
  });

  it("should automatically derive column width when a static column count is defined", () => {
    const { result, rerender } = renderHook((props) => usePositioner(props), {
      initialProps: { width: 1280, columnCount: 4, columnGutter: 10 },
    });

    expect(result.current.columnCount).toBe(4);
    expect(result.current.columnWidth).toBe(312);

    rerender({ width: 1280, columnCount: 3, columnGutter: 12 });
    expect(result.current.columnCount).toBe(3);
    expect(result.current.columnWidth).toBe(418);
  });

  it("should automatically derive column width when a maximum column width is defined", () => {
    const { result, rerender } = renderHook((props) => usePositioner(props), {
      initialProps: {
        width: 1280,
        columnCount: 4,
        columnGutter: 10,
        maxColumnWidth: 300,
      },
    });

    expect(result.current.columnCount).toBe(4);
    expect(result.current.columnWidth).toBe(300);

    rerender({
      width: 1280,
      columnCount: 3,
      columnGutter: 12,
      maxColumnWidth: 300,
    });
    expect(result.current.columnCount).toBe(3);
    expect(result.current.columnWidth).toBe(300);
  });

  it("should automatically derive column width when a maximum column count is defined", () => {
    const { result, rerender } = renderHook((props) => usePositioner(props), {
      initialProps: {
        width: 1280,
        columnCount: undefined,
        columnWidth: 20,
        columnGutter: 10,
        maxColumnCount: 4,
      },
    });

    expect(result.current.columnCount).toBe(4);
    expect(result.current.columnWidth).toBe(312);

    rerender({
      width: 1280,
      columnCount: undefined,
      columnWidth: 20,
      columnGutter: 10,
      maxColumnCount: 5,
    });
    expect(result.current.columnCount).toBe(5);
    expect(result.current.columnWidth).toBe(248);

    rerender({
      width: 1280,
      // @ts-expect-error
      columnCount: 1,
      columnWidth: 20,
      columnGutter: 10,
      maxColumnCount: 5,
    });
    expect(result.current.columnCount).toBe(1);
    expect(result.current.columnWidth).toBe(1280);
  });

  it("should create a new positioner when sizing deps change", () => {
    const { result, rerender } = renderHook((props) => usePositioner(props), {
      initialProps: { width: 1280, columnCount: 4, columnGutter: 10 },
    });

    const initialPositioner = result.current;
    rerender({ width: 1280, columnCount: 4, columnGutter: 10 });
    expect(result.current).toBe(initialPositioner);

    rerender({ width: 1280, columnCount: 2, columnGutter: 10 });
    expect(result.current).not.toBe(initialPositioner);
  });

  it("should copy existing positions into the new positioner when sizing deps change", () => {
    const { result, rerender } = renderHook((props) => usePositioner(props), {
      initialProps: { width: 1280, columnCount: 4, columnGutter: 10 },
    });

    result.current.set(0, 200);
    expect(result.current.size()).toBe(1);

    rerender({ width: 1280, columnCount: 2, columnGutter: 10 });
    expect(result.current.size()).toBe(1);
  });

  it("should update existing cells", () => {
    const { result } = renderHook((props) => usePositioner(props), {
      initialProps: { width: 400, columnCount: 1 },
    });

    result.current.set(0, 200);
    result.current.set(1, 200);
    result.current.set(2, 200);
    result.current.set(3, 200);
    expect(result.current.size()).toBe(4);
    expect(result.current.shortestColumn()).toBe(800);
    result.current.update([1, 204]);
    expect(result.current.shortestColumn()).toBe(804);
  });

  it("should create a new positioner when deps change", () => {
    const { result, rerender } = renderHook(
      ({ deps, ...props }) => usePositioner(props, deps),
      {
        initialProps: { width: 1280, columnCount: 1, deps: [1] },
      }
    );

    const initialPositioner = result.current;
    rerender({ width: 1280, columnCount: 1, deps: [1] });
    expect(result.current).toBe(initialPositioner);

    rerender({ width: 1280, columnCount: 1, deps: [2] });
    expect(result.current).not.toBe(initialPositioner);
  });

  it("should report items", () => {
    const { result } = renderHook((props) => usePositioner(props), {
      initialProps: { width: 1280 },
    });
    const length = 100;
    for (let i = 0; i < length; i++) {
      result.current.set(i, 200);
    }
    expect(result.current.size()).toBe(length);
    expect(result.current.all()).toHaveLength(length);
  });
});

describe("useContainerPosition()", () => {
  it("should provide a width", () => {
    render(<div style={{ width: 800 }} data-testid="div" />);

    const fakeRef: { current: HTMLElement } = {
      current: screen.getByTestId("div"),
    };

    const { result } = renderHook(
      ({ deps }) => useContainerPosition(fakeRef, deps),
      { initialProps: { deps: [] } }
    );
    expect(result.current.width).toBe(800);
    expect(result.current.offset).toBe(0);
  });

  it("should update when deps change", () => {
    const element = render(<div style={{ width: 800 }} data-testid="div" />);
    const fakeRef: { current: HTMLElement } = {
      current: screen.getByTestId("div"),
    };
    const { result, rerender } = renderHook(
      ({ deps }) => useContainerPosition(fakeRef, deps),
      { initialProps: { deps: [1] } }
    );

    expect(result.current.width).toBe(800);
    expect(result.current.offset).toBe(0);

    element.rerender(<div key="2" style={{ width: 640 }} data-testid="div2" />);
    fakeRef.current = screen.getByTestId("div2");

    rerender({ deps: [2] });
    expect(result.current.width).toBe(640);
  });
});

describe("useResizeObserver()", () => {
  it("should disconnect on mount", () => {
    const { result, unmount } = renderHook(() => {
      const positioner = usePositioner({ width: 1280 });
      return useResizeObserver(positioner);
    });

    const disconnect = jest.spyOn(result.current, "disconnect");
    expect(disconnect).not.toHaveBeenCalledWith();
    expect(typeof result.current.observe).toBe("function");
    unmount();
    expect(disconnect).toHaveBeenCalledWith();
  });

  it("should disconnect and create a new one when the positioner changes", () => {
    const { result, rerender } = renderHook(
      (props) => {
        const positioner = usePositioner(props);
        return useResizeObserver(positioner);
      },
      {
        initialProps: {
          width: 1280,
        },
      }
    );

    const disconnect = jest.spyOn(result.current, "disconnect");
    expect(disconnect).not.toHaveBeenCalledWith();
    const prev = result.current;
    rerender({ width: 1200 });
    expect(disconnect).toHaveBeenCalledWith();
    expect(result.current).not.toBe(prev);
  });

  it("should call updater", () => {
    const updater = jest.fn();
    renderHook(
      (props) => {
        const positioner = usePositioner(props);
        return createResizeObserver(positioner, updater);
      },
      {
        initialProps: {
          width: 1280,
        },
      }
    );

    renderHook(() => {
      const positioner = usePositioner({ width: 1280 });
      return useMasonry({
        height: 720,
        positioner,
        items: getFakeItems(1),
        render: FakeCard,
        scrollTop: 0,
      });
    });

    expect(updater).not.toHaveBeenCalledWith();
    // TODO: make this check somehow
    expect(true).toBe(true);
  });
});

describe("useScroller()", () => {
  beforeEach(() => {
    perf.install();
    resetScroll();
  });

  afterEach(() => {
    perf.uninstall();
  });

  it('should unset "isScrolling" after timeout', () => {
    const original = window.requestAnimationFrame;
    // @ts-expect-error
    window.requestAnimationFrame = undefined;

    const { result } = renderHook(() => useScroller());

    expect(result.current.isScrolling).toBe(false);

    hookAct(() => {
      scrollTo(300);
      perf.advanceBy(40 + 1000 / 12);
    });

    hookAct(() => {
      scrollTo(301);
      perf.advanceBy(40 + 1000 / 12);
    });

    expect(result.current.isScrolling).toBe(true);

    hookAct(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.isScrolling).toBe(false);
    window.requestAnimationFrame = original;
  });
});

describe("useInfiniteLoader()", () => {
  it('should call "loadMoreItems" on render', () => {
    const loadMoreItems = jest.fn();
    let items = getFakeItems(1, 200);
    const loaderOptions = {
      minimumBatchSize: 12,
      threshold: 12,
    };
    const hook = renderHook(
      ({ items, scrollTop, options }) => {
        const positioner = usePositioner({ width: 1280, columnWidth: 320 });
        const infiniteLoader = useInfiniteLoader(loadMoreItems, options);
        return useMasonry<typeof items[0]>({
          height: 600,
          positioner,
          items,
          scrollTop,
          render: FakeCard,
          onRender: infiniteLoader,
        });
      },
      {
        initialProps: {
          items,
          scrollTop: 0,
          options: loaderOptions,
        },
      }
    );

    expect(loadMoreItems).not.toHaveBeenCalledWith();
    renderPhase2(hook, { items, scrollTop: 0, options: loaderOptions });
    hook.rerender({ items, scrollTop: 0, options: loaderOptions });
    expect(loadMoreItems).toHaveBeenCalledTimes(1);
    // '1' because '0' has already loaded
    expect(loadMoreItems).toHaveBeenCalledWith(1, 12, items);
    // Adds another item to the items list, so the expectation is that the next range
    // will be 1 + 1, 12 + 1
    items = getFakeItems(2, 200);
    renderPhase2(hook, { items, scrollTop: 0, options: loaderOptions });
    hook.rerender({ items, scrollTop: 0, options: loaderOptions });
    expect(loadMoreItems).toHaveBeenCalledTimes(2);
    expect(loadMoreItems).toHaveBeenCalledWith(2, 13, items);
  });

  it('should call custom "isItemLoaded" function', () => {
    const loadMoreItems = jest.fn();
    const items = getFakeItems(1, 200);
    const loaderOptions = {
      isItemLoaded: () => true,
    };

    const hook = renderHook(
      ({ items, scrollTop, options }) => {
        const positioner = usePositioner({ width: 1280, columnWidth: 320 });
        const infiniteLoader = useInfiniteLoader(loadMoreItems, options);
        return useMasonry<typeof items[0]>({
          height: 600,
          positioner,
          items,
          scrollTop,
          render: FakeCard,
          onRender: infiniteLoader,
        });
      },
      {
        initialProps: {
          items,
          scrollTop: 0,
          options: loaderOptions,
        },
      }
    );

    expect(loadMoreItems).not.toHaveBeenCalledWith();
    renderPhase2(hook, { items, scrollTop: 0, options: loaderOptions });
    hook.rerender({ items, scrollTop: 0, options: loaderOptions });
    // All the items have loaded so it should not be called
    expect(loadMoreItems).not.toHaveBeenCalledWith();
  });

  it('should not load more items if "totalItems" constraint is satisfied', () => {
    const loadMoreItems = jest.fn();
    const items = getFakeItems(1, 200);
    const loaderOptions = {
      totalItems: 1,
    };

    const hook = renderHook(
      ({ items, scrollTop, options }) => {
        const positioner = usePositioner({ width: 1280, columnWidth: 320 });
        const infiniteLoader = useInfiniteLoader(loadMoreItems, options);
        return useMasonry<typeof items[0]>({
          height: 600,
          positioner,
          items,
          scrollTop,
          render: FakeCard,
          onRender: infiniteLoader,
        });
      },
      {
        initialProps: {
          items,
          scrollTop: 0,
          options: loaderOptions,
        },
      }
    );

    expect(loadMoreItems).not.toHaveBeenCalledWith();
    renderPhase2(hook, { items, scrollTop: 0, options: loaderOptions });
    hook.rerender({ items, scrollTop: 0, options: loaderOptions });
    // All the items have loaded so it should not be called
    expect(loadMoreItems).not.toHaveBeenCalledWith();
  });

  it("should return a new callback if any of the options change", () => {
    const loadMoreItems = jest.fn();
    const loaderOptions = {
      minimumBatchSize: 16,
      threshold: 16,
      totalItems: 9e9,
    };

    const { result, rerender } = renderHook(
      ({ loadMoreItems, options }) => useInfiniteLoader(loadMoreItems, options),
      {
        initialProps: {
          loadMoreItems,
          options: loaderOptions,
        },
      }
    );

    let prev = result.current;
    rerender({ loadMoreItems, options: loaderOptions });
    expect(result.current).toBe(prev);

    rerender({ loadMoreItems, options: { ...loaderOptions, totalItems: 2 } });
    expect(result.current).not.toBe(prev);
    prev = result.current;

    rerender({
      loadMoreItems,
      options: { ...loaderOptions, minimumBatchSize: 12 },
    });
    expect(result.current).not.toBe(prev);
    prev = result.current;

    rerender({ loadMoreItems, options: { ...loaderOptions, threshold: 12 } });
    expect(result.current).not.toBe(prev);
  });
});

describe("<MasonryScroller>", () => {
  it("should update when scrolling", () => {
    const Component = () => {
      const positioner = usePositioner({ width: 1280, columnWidth: 320 });
      return (
        <MasonryScroller
          items={getFakeItems(1)}
          height={720}
          positioner={positioner}
          render={FakeCard}
        />
      );
    };

    const result = render(<Component />);
    expect(result.asFragment()).toMatchSnapshot(
      "pointer-events: none is NOT defined"
    );

    act(() => {
      scrollTo(720);
    });

    expect(result.asFragment()).toMatchSnapshot(
      "pointer-events: none IS defined"
    );
  });
});

describe("<Masonry>", () => {
  it("should update when the size of the window changes", () => {
    resizeTo(400, 200);
    const Component = () => {
      return (
        <Masonry
          items={getFakeItems(4, 400)}
          itemHeightEstimate={400}
          overscanBy={1}
          render={FakeCard}
        />
      );
    };

    const result = render(<Component />);
    expect(result.asFragment()).toMatchSnapshot("Should display one element");

    act(() => {
      resizeTo(1280, 800);
      jest.advanceTimersByTime(100);
    });

    result.rerender(<Component />);
    expect(result.asFragment()).toMatchSnapshot("Should display two elements");
  });

  it("should scroll to index", () => {
    resizeTo(400, 200);
    const Component = () => {
      return (
        <Masonry
          items={getFakeItems(6, 400)}
          itemHeightEstimate={400}
          overscanBy={1}
          scrollToIndex={4}
          render={FakeCard}
        />
      );
    };
    window.scrollTo = jest.fn();
    render(<Component />);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 1600);
  });

  it("should scroll to cached index", () => {
    resizeTo(400, 200);
    const Component = () => {
      return (
        <Masonry
          items={getFakeItems(4, 400)}
          itemHeightEstimate={400}
          overscanBy={1}
          scrollToIndex={0}
          render={FakeCard}
        />
      );
    };
    window.scrollTo = jest.fn();
    render(<Component />);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});

describe("<List>", () => {
  it("should have a row gutter", () => {
    const Component = () => {
      return (
        <List items={getFakeItems(3, 200)} rowGutter={32} render={FakeCard} />
      );
    };

    render(<Component />);
    expect(
      // @ts-expect-error
      screen.getByText("0").parentNode.parentNode.style.top
    ).toBe("0px");
    expect(
      // @ts-expect-error
      screen.getByText("1").parentNode.parentNode.style.top
    ).toBe("232px");
    expect(
      // @ts-expect-error
      screen.getByText("2").parentNode.parentNode.style.top
    ).toBe("464px");
  });
});

const prerenderStyles = (width) => ({
  width,
  zIndex: -1000,
  visibility: "hidden",
  position: "absolute",
  writingMode: "horizontal-tb",
});

const renderPhase2 = ({ result, rerender }, props?: Record<string, any>) => {
  // Enter phase two by rendering the element in React
  render(result.current);
  // Creates a new element with the phase two styles
  rerender(props);
};

const heights = [360, 420, 372, 460, 520, 356, 340, 376, 524];
const getHeight = (i) => heights[i % heights.length];

const getFakeItems = (n = 10, height = 0): { id: number; height: number }[] => {
  const fakeItems: { id: number; height: number }[] = [];
  for (let i = 0; i < n; i++)
    fakeItems.push({ id: i, height: height || getHeight(i) });
  return fakeItems;
};

const FakeCard = ({ data: { height }, index }): React.ReactElement => (
  <div style={{ width: "100%", height }}>
    <span children={index} />
    Hello
  </div>
);

// Simulate scroll events
const scrollEvent = document.createEvent("Event");
scrollEvent.initEvent("scroll", true, true);
const setScroll = (value): void => {
  Object.defineProperty(window, "scrollY", { value, configurable: true });
};
const scrollTo = (value): void => {
  setScroll(value);
  window.dispatchEvent(scrollEvent);
};
const resetScroll = (): void => {
  setScroll(0);
};

// Simulate window resize event
const resizeEvent = document.createEvent("Event");
resizeEvent.initEvent("resize", true, true);
const orientationEvent = document.createEvent("Event");
orientationEvent.initEvent("orientationchange", true, true);

const setWindowSize = (width, height) => {
  Object.defineProperty(document.documentElement, "clientWidth", {
    value: width,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    value: height,
    configurable: true,
  });
};

const resizeTo = (width, height) => {
  setWindowSize(width, height);
  window.dispatchEvent(resizeEvent);
};

const resetSize = () => {
  setWindowSize(1280, 720);
};

// performance.now mock
const mockPerf = () => {
  // @ts-expect-error
  const original = global?.performance;
  let ts = (typeof performance !== "undefined" ? performance : Date).now();

  return {
    install: () => {
      ts = Date.now();
      const perfNowStub = jest
        .spyOn(performance, "now")
        .mockImplementation(() => ts);
      // @ts-expect-error
      global.performance = {
        now: perfNowStub,
      };
    },
    advanceBy: (amt: number) => (ts += amt),
    advanceTo: (t: number) => (ts = t),
    uninstall: () => {
      if (original) {
        //@ts-expect-error
        global.performance = original;
      }
    },
  };
};

const perf = mockPerf();
