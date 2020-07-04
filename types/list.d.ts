/// <reference types="react" />
import type {MasonryProps} from './masonry'
/**
 * This is just a single-column `<Masonry>` component with `rowGutter` prop instead of
 * a `columnGutter` prop.
 */
export declare function List<Item>(props: ListProps<Item>): JSX.Element
export declare namespace List {
  var displayName: string
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
