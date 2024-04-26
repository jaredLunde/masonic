import * as React from "react";
import { Masonry } from "./masonry";
import type { MasonryProps } from "./masonry";

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

/**
 * This is just a single-column `<Masonry>` component without column-specific props.
 *
 * @param props
 */
export function List<Item>(props: ListProps<Item>) {
  return (
    <Masonry<Item>
      role="list"
      rowGutter={props.rowGutter}
      columnCount={1}
      columnWidth={1}
      {...props}
    />
  );
}

export interface ListProps<Item>
  extends Omit<
    MasonryProps<Item>,
    "columGutter" | "columnCount" | "columnWidth"
  > {
  /**
   * The amount of vertical space in pixels to add between the list cells.
   *
   * @default 0
   */
  rowGutter?: number;
}

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  List.displayName = "List";
}
