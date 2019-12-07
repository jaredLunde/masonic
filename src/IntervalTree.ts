type Color = 0 | 1 | 2
const RED = 0
const BLACK = 1
const NIL = 2

const DELETE = 0
const KEEP = 1
const NOT_FOUND = 2

interface TreeNode {
  max: number
  low: number
  high: number
  color: Color
  parent: TreeNode
  right: TreeNode
  left: TreeNode
  list: number[]
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
    treeNode.list.push(index, high)
    return true
  }

  for (let i = 0; i < treeNode.list.length; i++)
    if (treeNode.list[i] === index && i % 2 === 0) return false

  treeNode.list.push(index, high)
  return true
}

const removeInterval = (treeNode: TreeNode, index: number) => {
  if (treeNode.list === void 0) return NOT_FOUND

  for (let i = 0; i < treeNode.list.length; i++)
    if (treeNode.list[i] === index && i % 2 === 0) {
      treeNode.list.splice(i, 2)
      break
    }

  return treeNode.list.length > 0 ? KEEP : DELETE
}

const NULL_NODE: TreeNode = {
  low: 0,
  max: 0,
  high: 0,
  color: NIL,
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

  while (x.parent !== NULL_NODE) {
    updateMax(x.parent)
    x = x.parent
  }
}

const rotateLeft = (tree: Tree, x: TreeNode) => {
  if (x.right === NULL_NODE) return
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
  if (x.left === NULL_NODE) return
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

const replaceNode = (tree: Tree, x: TreeNode, y: TreeNode) => {
  if (x.parent === NULL_NODE) tree.root = y
  else if (x === x.parent.left) x.parent.left = y
  else x.parent.right = y
  y.parent = x.parent
}

const fixRemove = (tree: Tree, x: TreeNode) => {
  let w

  while (x !== NULL_NODE && x.color === BLACK) {
    if (x === x.parent.left) {
      w = x.parent.right

      if (w.color === RED) {
        w.color = BLACK
        x.parent.color = RED
        rotateLeft(tree, x.parent)
        w = x.parent.right
      }

      if (w.left.color === BLACK && w.right.color === BLACK) {
        w.color = RED
        x = x.parent
      } else {
        if (w.right.color === BLACK) {
          w.left.color = BLACK
          w.color = RED
          rotateRight(tree, w)
          w = x.parent.right
        }

        w.color = x.parent.color
        x.parent.color = BLACK
        w.right.color = BLACK
        rotateLeft(tree, x.parent)
        x = tree.root
      }
    } else {
      w = x.parent.left

      if (w.color === RED) {
        w.color = BLACK
        x.parent.color = RED
        rotateRight(tree, x.parent)
        w = x.parent.left
      }

      if (w.right.color === BLACK && w.left.color === BLACK) {
        w.color = RED
        x = x.parent
      } else {
        if (w.left.color === BLACK) {
          w.right.color = BLACK
          w.color = RED
          rotateLeft(tree, w)
          w = x.parent.left
        }

        w.color = x.parent.color
        x.parent.color = BLACK
        w.left.color = BLACK
        rotateRight(tree, x.parent)
        x = tree.root
      }
    }
  }

  x.color = BLACK
}

const minimumTree = (x: TreeNode) => {
  while (x.left !== NULL_NODE) x = x.left
  return x
}

// const searchNode = (x: TreeNode, low: number) => {
//   while (x !== NULL_NODE && low !== x.low) {
//     if (low < x.low) x = x.left
//     else x = x.right
//   }
//   return x
// }

const fixInsert = (tree: Tree, z: TreeNode) => {
  let y: TreeNode
  while (z.parent.color === RED) {
    if (z.parent === z.parent.parent.left) {
      y = z.parent.parent.right

      if (y.color === RED) {
        z.parent.color = BLACK
        y.color = BLACK
        z.parent.parent.color = RED
        z = z.parent.parent
      } else {
        if (z === z.parent.right) {
          z = z.parent
          rotateLeft(tree, z)
        }

        z.parent.color = BLACK
        z.parent.parent.color = RED
        rotateRight(tree, z.parent.parent)
      }
    } else {
      y = z.parent.parent.left

      if (y.color === RED) {
        z.parent.color = BLACK
        y.color = BLACK
        z.parent.parent.color = RED
        z = z.parent.parent
      } else {
        if (z === z.parent.left) {
          z = z.parent
          rotateRight(tree, z)
        }

        z.parent.color = BLACK
        z.parent.parent.color = RED
        rotateLeft(tree, z.parent.parent)
      }
    }
  }
  tree.root.color = BLACK
}

interface IIntervalTree {
  insert(low: number, high: number, index: number): void
  remove(low: number, high: number, index: number): void
  search(
    low: number,
    high: number,
    callback: (index: number, low: number) => any
  ): void
  size: number
  root: TreeNode
}

const IntervalTree = (): IIntervalTree => {
  const tree = {
    root: NULL_NODE,
    size: 0,
    // we know these indexes are a consistent, safe way to make look ups
    // for our case so it's a solid O(1) alternative to
    // the O(log n) searchNode()
    indexMap: {},
  }

  return {
    insert(low, high, index) {
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
        tree.indexMap[index] = y
        tree.size++
        return
      }

      const z: TreeNode = {
        low,
        high,
        max: high,
        color: RED,
        parent: y,
        left: NULL_NODE,
        right: NULL_NODE,
        list: [index, high],
      }

      if (y === NULL_NODE) {
        tree.root = z
      } else {
        if (z.low < y.low) y.left = z
        else y.right = z
        updateMaxUp(z)
      }

      fixInsert(tree, z)
      tree.indexMap[index] = z
      tree.size++
    },

    remove(low, high, index) {
      const z = tree.indexMap[index]
      if (z === void 0 || z.low !== low) return
      delete tree.indexMap[index]

      const intervalResult = removeInterval(z, index)
      if (intervalResult === NOT_FOUND) return
      if (intervalResult === KEEP) {
        z.high = z.list[1]
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
        replaceNode(tree, z, z.right)
      } else if (z.right === NULL_NODE) {
        x = z.left
        replaceNode(tree, z, z.left)
      } else {
        y = minimumTree(z.right)
        originalYColor = y.color
        x = y.right

        if (y.parent === z) {
          x.parent = y
        } else {
          replaceNode(tree, y, y.right)
          y.right = z.right
          y.right.parent = y
        }

        replaceNode(tree, z, y)
        y.left = z.left
        y.left.parent = y
        y.color = z.color
      }

      updateMax(x)
      updateMaxUp(x)

      if (originalYColor === BLACK) fixRemove(tree, x)
      tree.size--
    },

    search(low, high, callback) {
      const stack = [tree.root]
      while (stack.length !== 0) {
        const node = stack.pop() as TreeNode
        if (node === NULL_NODE || low > node.max) continue
        if (node.left !== NULL_NODE) stack.push(node.left)
        if (node.right !== NULL_NODE) stack.push(node.right)
        if (node.low <= high && node.high >= low) {
          for (let i = 0, len = node.list.length; i < len; i++) {
            const index = node.list[i++]
            // normally we'd include the high bound here, too, but since we
            // don't need it in practice, it makes sense to just leave it out
            if (node.list[i] >= low) callback(index, node.low)
          }
        }
      }
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
