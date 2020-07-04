import * as React from 'react'
import {Masonry} from './masonry'
import type {MasonryProps} from './masonry'

/**
 * This is just a single-column `<Masonry>` component with `rowGutter` prop instead of
 * a `columnGutter` prop.
 */
export function List<Item>(props: ListProps<Item>) {
  return (
    <Masonry<Item>
      role='list'
      columnGutter={props.rowGutter}
      columnCount={1}
      columnWidth={1}
      {...props}
    />
  )
}

export interface ListProps<Item>
  extends Omit<
    MasonryProps<Item>,
    'columGutter' | 'columnCount' | 'columnWidth'
  > {
  /**
   * The amount of vertical space in pixels to add between the list cells.
   * @default 0
   */
  rowGutter?: number
}

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  List.displayName = 'List'
}
