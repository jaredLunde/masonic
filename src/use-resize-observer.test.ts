import { elementsCache } from "./elements-cache";
import { createPositioner } from "./use-positioner";
import { createResizeObserver } from "./use-resize-observer";

// mock requestAnimationFrame
// https://stackoverflow.com/questions/61593774/how-do-i-test-code-that-uses-requestanimationframe-in-jest
beforeEach(() => {
  jest.useFakeTimers();

  let count = 0;
  jest
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation(
      (cb: any) => setTimeout(() => cb(100 * ++count), 100) as any as number
    );
});

afterEach(() => {
  // @ts-expect-error
  window.requestAnimationFrame.mockRestore();
  jest.clearAllTimers();
});

class ResizeObserver {
  els = [];
  callback: any;
  constructor(callback) {
    this.callback = callback;
  }
  observe(el) {
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

describe("createResizeObserver", () => {
  it("should update elements' position's height after resized in a short duration", async () => {
    const els = [
      { offsetHeight: 100 },
      { offsetHeight: 100 },
      { offsetHeight: 100 },
      { offsetHeight: 100 },
      { offsetHeight: 100 },
    ];

    const positioner = createPositioner(5, 100);

    els.forEach((el, i) => {
      elementsCache.set(el, i);
      positioner.set(i, el.offsetHeight);
    });

    const observer = createResizeObserver(positioner, () => {});
    els.forEach((el) => {
      observer.observe(el);
    });

    for (let i = 0; i < 5; i++) {
      observer.resize(i, 200);
    }

    await jest.runAllTimers();

    for (let i = 0; i < 5; i++) {
      expect(positioner.get(i).height).toBe(200);
    }
  });
});
