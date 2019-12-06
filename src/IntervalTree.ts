enum Color {
  Red,
  Black,
  Nil,
}

interface Interval {
  high: number
  index: number
}

enum ListResult {
  Delete,
  Keep,
  NotFound,
}

interface TreeNode {
  max: number
  low: number
  high: number
  color: Color
  parent: TreeNode
  right: TreeNode
  left: TreeNode
  list: Interval[]
}

interface Tree {
  root: TreeNode
  size: number
}

const addInterval = (
  treeNode: TreeNode,
  high: number,
  index: number
): boolean => {
  if (treeNode.list.length === 0) {
    treeNode.list.push({index, high})
    return true
  }

  for (let i = 0; i < treeNode.list.length; i++)
    if (treeNode.list[i].index === index) return false

  treeNode.list.push({index, high})
  return true
}

const removeInterval = (treeNode: TreeNode, index: number) => {
  if (treeNode.list === void 0) return ListResult.NotFound

  for (let i = treeNode.list.length - 1; i > -1; i--)
    if (treeNode.list[i].index === index) {
      treeNode.list.splice(i, 1)
      break
    }

  return treeNode.list.length > 0 ? ListResult.Keep : ListResult.Delete
}

const NULL_NODE: TreeNode = {
  low: 0,
  max: 0,
  high: 0,
  color: Color.Nil,
  // @ts-ignore
  parent: undefined,
  // @ts-ignore
  right: undefined,
  // @ts-ignore
  left: undefined,
  // @ts-ignore
  list: undefined,
}

NULL_NODE.parent = NULL_NODE
NULL_NODE.left = NULL_NODE
NULL_NODE.right = NULL_NODE

const updateMax = (node: TreeNode) => {
  const max = node.high
  if (node.left === NULL_NODE && node.right === NULL_NODE) node.max = max
  else if (node.left === NULL_NODE) node.max = Math.max(node.right.max, max)
  else if (node.right === NULL_NODE) node.max = Math.max(node.left.max, max)
  else node.max = Math.max(Math.max(node.left.max, node.right.max), max)
}

const updateMaxUp = (node: TreeNode) => {
  let x = node
  while (x.parent != NULL_NODE) {
    updateMax(x.parent)
    x = x.parent
  }
}

const rotateLeft = (tree: Tree, x: TreeNode) => {
  if (x.right == NULL_NODE) return
  const y = x.right
  x.right = y.left
  if (y.left !== NULL_NODE) y.left.parent = x
  y.parent = x.parent

  if (x.parent === NULL_NODE) tree.root = y
  else {
    if (x === x.parent.left) x.parent.left = y
    else x.parent.right = y
  }

  y.left = x
  x.parent = y

  updateMax(x)
  updateMax(y)
}

const rotateRight = (tree: Tree, x: TreeNode) => {
  if (x.left == NULL_NODE) return
  const y = x.left
  x.left = y.right
  if (y.right !== NULL_NODE) y.right.parent = x
  y.parent = x.parent

  if (x.parent === NULL_NODE) tree.root = y
  else {
    if (x === x.parent.right) x.parent.right = y
    else x.parent.left = y
  }

  y.right = x
  x.parent = y

  updateMax(x)
  updateMax(y)
}

const rbTransplant = (tree: Tree, u: TreeNode, v: TreeNode) => {
  if (u.parent === NULL_NODE) {
    tree.root = v
  } else if (u === u.parent.left) {
    u.parent.left = v
  } else {
    u.parent.right = v
  }
  v.parent = u.parent
}

const rbDeleteFixup = (tree: Tree, x: TreeNode) => {
  let w

  while (x !== NULL_NODE && x.color === Color.Black) {
    if (x === x.parent.left) {
      w = x.parent.right
      if (w.color === Color.Red) {
        w.color = Color.Black
        x.parent.color = Color.Red
        rotateLeft(tree, x.parent)
        w = x.parent.right
      }
      if (w.left.color === Color.Black && w.right.color === Color.Black) {
        w.color = Color.Red
        x = x.parent
      } else {
        if (w.right.color === Color.Black) {
          w.left.color = Color.Black
          w.color = Color.Red
          rotateRight(tree, w)
          w = x.parent.right
        }

        w.color = x.parent.color
        x.parent.color = Color.Black
        w.right.color = Color.Black
        rotateLeft(tree, x.parent)
        x = tree.root
      }
    } else {
      w = x.parent.left

      if (w.color === Color.Red) {
        w.color = Color.Black
        x.parent.color = Color.Red
        rotateRight(tree, x.parent)
        w = x.parent.left
      }
      if (w.right.color === Color.Black && w.left.color === Color.Black) {
        w.color = Color.Red
        x = x.parent
      } else {
        if (w.left.color === Color.Black) {
          w.right.color = Color.Black
          w.color = Color.Red
          rotateLeft(tree, w)
          w = x.parent.left
        }

        w.color = x.parent.color
        x.parent.color = Color.Black
        w.left.color = Color.Black
        rotateRight(tree, x.parent)
        x = tree.root
      }
    }
  }
  x.color = Color.Black
}

const minimumTree = (x: TreeNode) => {
  while (x.left !== NULL_NODE) x = x.left
  return x
}

const removeNode = (tree: Tree, low: number, index: number) => {
  const z = searchNode(tree.root, low)
  if (z === void 0) return

  const linkedListResult = removeInterval(z, index)
  if (linkedListResult === ListResult.NotFound) return
  if (linkedListResult === ListResult.Keep) {
    z.high = z.list[0].high
    updateMax(z)
    updateMaxUp(z)
    tree.size--
    return
  }

  let y = z
  let originalYColor = y.color
  let x
  if (z.left === NULL_NODE) {
    x = z.right
    rbTransplant(tree, z, z.right)
  } else if (z.right === NULL_NODE) {
    x = z.left
    rbTransplant(tree, z, z.left)
  } else {
    y = minimumTree(z.right)
    originalYColor = y.color
    x = y.right
    if (y.parent === z) {
      x.parent = y
    } else {
      rbTransplant(tree, y, y.right)
      y.right = z.right
      y.right.parent = y
    }
    rbTransplant(tree, z, y)
    y.left = z.left
    y.left.parent = y
    y.color = z.color
  }

  updateMax(x)
  updateMaxUp(x)

  if (originalYColor === Color.Black) rbDeleteFixup(tree, x)
  tree.size--
}

const searchNode = (x: TreeNode, low: number) => {
  while (x !== NULL_NODE && low !== x.low) {
    if (low < x.low) x = x.left
    else x = x.right
  }
  return x
}

const rbInsertFixup = (tree: Tree, z: TreeNode) => {
  let y: TreeNode
  while (z.parent.color === Color.Red) {
    if (z.parent === z.parent.parent.left) {
      y = z.parent.parent.right

      if (y.color === Color.Red) {
        z.parent.color = Color.Black
        y.color = Color.Black
        z.parent.parent.color = Color.Red
        z = z.parent.parent
      } else {
        if (z === z.parent.right) {
          z = z.parent
          rotateLeft(tree, z)
        }

        z.parent.color = Color.Black
        z.parent.parent.color = Color.Red
        rotateRight(tree, z.parent.parent)
      }
    } else {
      y = z.parent.parent.left

      if (y.color === Color.Red) {
        z.parent.color = Color.Black
        y.color = Color.Black
        z.parent.parent.color = Color.Red
        z = z.parent.parent
      } else {
        if (z === z.parent.left) {
          z = z.parent
          rotateRight(tree, z)
        }

        z.parent.color = Color.Black
        z.parent.parent.color = Color.Red
        rotateLeft(tree, z.parent.parent)
      }
    }
  }
  tree.root.color = Color.Black
}

const addNode = (tree: Tree, low: number, high: number, index: number) => {
  let x: TreeNode = tree.root
  let y: TreeNode = NULL_NODE

  while (x !== NULL_NODE) {
    y = x
    if (low === y.low) break
    if (low < x.low) x = x.left
    else x = x.right
  }

  if (low === y.low && y !== NULL_NODE) {
    if (!addInterval(y, high, index)) return
    y.high = Math.max(y.high, high)
    updateMax(y)
    updateMaxUp(y)
    tree.size++
    return
  }

  const z: TreeNode = {
    low,
    high,
    max: high,
    color: Color.Red,
    parent: y,
    left: NULL_NODE,
    right: NULL_NODE,
    list: [{index, high}],
  }

  if (y === NULL_NODE) {
    tree.root = z
  } else {
    if (z.low < y.low) y.left = z
    else y.right = z
    updateMaxUp(z)
  }

  rbInsertFixup(tree, z)
  tree.size++
}

const searchRecursive = (
  node: TreeNode,
  low: number,
  high: number,
  callback: (index: any, low: number, high: number) => any
) => {
  if (node === NULL_NODE || low > node.max) return
  if (node.left !== NULL_NODE) searchRecursive(node.left, low, high, callback)
  if (node.low <= high && node.high >= low) {
    for (let i = 0; i < node.list.length; i++) {
      const linkedInterval = (node.list as Interval[])[i]
      if (linkedInterval.high >= low)
        callback(linkedInterval.index, node.low, linkedInterval.high)
    }
  }
  if (node.right !== NULL_NODE) searchRecursive(node.right, low, high, callback)
}

interface IIntervalTree {
  insert(low: number, high: number, index: number): void
  remove(low: number, high: number, index: number): void
  search(
    low: number,
    high: number,
    callback: (index: number, low: number, high: number) => any
  ): void
  size: number
  root: TreeNode
}

const IntervalTree = (): IIntervalTree => {
  const tree = {
    root: NULL_NODE,
    size: 0,
  }

  return {
    insert(low, high, index) {
      addNode(tree, low, high, index)
    },
    remove(low, high, index) {
      removeNode(tree, low, index)
    },
    search(low, high, callback) {
      searchRecursive(tree.root, low, high, callback)
    },
    get size() {
      return tree.size
    },
    get root() {
      return tree.root
    },
  }
}

export default IntervalTree
