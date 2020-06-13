import * as React from 'react'
import type {MasonryProps} from './masonry'
/**
 * This is just a single-column `<Masonry>` component with `rowGutter` prop instead of
 * a `columnGutter` prop.
 */
export declare const List: React.FC<ListProps>
export interface ListProps
  extends Omit<MasonryProps, 'columGutter' | 'columnCount' | 'columnWidth'> {
  /**
   * The amount of vertical space in pixels to add between the list cells.
   * @default 0
   */
  rowGutter?: number
}
