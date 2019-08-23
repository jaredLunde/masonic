import binarySearch from './binarySearchBounds'

export default (columnCount, columnWidth, columnGutter = 0) => {
  // Track the height of each column.
  // Layout algorithm below always inserts into the shortest column.
  const columnHeights = new Array(columnCount),
    items = new Map(),
    columnItems = new Array(columnCount)

  for (let i = 0; i < columnCount; i++) {
    columnHeights[i] = 0
    columnItems[i] = []
  }

  const set = (index, height = 0) => {
    let column = 0

    // finds the shortest column and uses it
    for (let i = 1; i < columnHeights.length; i++) {
      if (columnHeights[i] < columnHeights[column]) column = i
    }

    const left = column * (columnWidth + columnGutter),
      top = columnHeights[column] || 0,
      item = {left, top, height, column}

    columnHeights[column] = top + height + columnGutter
    items.set(index, item)
    columnItems[column].push(index)
    return item
  }

  // this only updates items in the specific columns that have changed, on and after the
  // specific items that have changed
  const update = updates => {
    let columns = new Array(columnCount),
      updatedItems = [],
      i = 0,
      j = 0

    // determines which columns have items that changed, as well as the minimum index
    // changed in that column, as all items after that index will have their positions
    // affected by the change
    for (; i < updates.length - 1; i++) {
      const index = updates[i],
        item = items.get(index)
      item.height = updates[++i]
      columns[item.column] =
        columns[item.column] === void 0
          ? index
          : Math.min(index, columns[item.column])
    }

    for (i = 0; i < columns.length; i++) {
      // bails out if the column didn't change
      if (columns[i] === void 0) continue

      const itemsInColumn = columnItems[i],
        // the index order is sorted with certainty so binary search is a great solution
        // here as opposed to Array.indexOf()
        startIndex = binarySearch.eq(itemsInColumn, columns[i]),
        index = columnItems[i][startIndex],
        startItem = items.get(index)

      columnHeights[i] = startItem.top + startItem.height + columnGutter
      updatedItems.push(index, startItem)

      for (j = startIndex + 1; j < itemsInColumn.length; j++) {
        const index = itemsInColumn[j],
          item = items.get(index)
        item.top = columnHeights[i]
        columnHeights[i] = item.top + item.height + columnGutter
        updatedItems.push(index, item)
      }
    }

    return updatedItems
  }

  return {set, get: items.get.bind(items), update}
}
