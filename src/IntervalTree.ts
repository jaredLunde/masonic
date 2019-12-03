const NOT_FOUND = 0
const SUCCESS = 1
const EMPTY = 2

const binarySearchGe = (
  a: number[][],
  y: number[],
  c: (x: number[], y: number[]) => number
): number => {
  let h = a.length - 1
  let i = h + 1
  let l = 0

  while (l <= h) {
    const m = (l + h) >>> 1
    const x = a[m]
    if (c(x, y) >= 0) {
      i = m
      h = m - 1
    } else {
      l = m + 1
    }
  }

  return i
}

interface IIntervalTreeNode {
  mid: number
  left: IIntervalTreeNode | null
  right: IIntervalTreeNode | null
  leftPoints: number[][]
  rightPoints: number[][]
  size: number
  intervals: (result: number[][]) => number[][]
  insert: (interval: number[]) => void
  remove: (interval: number[]) => void | number
  queryInterval: (
    lo: number,
    hi: number,
    cb: (r: number[]) => void
  ) => number[] | void
}

const IntervalTreeNode = (
  mid,
  left,
  right,
  leftPoints,
  rightPoints
): IIntervalTreeNode => ({
  mid,
  left,
  right,
  leftPoints,
  rightPoints,
  size: (left ? left.size : 0) + (right ? right.size : 0) + leftPoints.length,
  intervals(result): number[][] {
    result.push.apply(result, this.leftPoints)

    if (this.left !== null) {
      this.left.intervals(result)
    }

    if (this.right !== null) {
      this.right.intervals(result)
    }

    return result
  },
  insert(interval): void {
    const weight = this.size - this.leftPoints.length
    this.size++

    if (interval[1] < this.mid) {
      if (this.left !== null) {
        if (4 * (this.left.size + 1) > 3 * (weight + 1)) {
          rebuildWithInterval(this, interval)
        } else {
          this.left.insert(interval)
        }
      } else {
        this.left = createIntervalTree([interval])
      }
    } else if (interval[0] > this.mid) {
      if (this.right !== null) {
        if (4 * (this.right.size + 1) > 3 * (weight + 1)) {
          rebuildWithInterval(this, interval)
        } else {
          this.right.insert(interval)
        }
      } else {
        this.right = createIntervalTree([interval])
      }
    } else {
      const l = binarySearchGe(this.leftPoints, interval, compareBegin)
      const r = binarySearchGe(this.rightPoints, interval, compareEnd)
      this.leftPoints.splice(l, 0, interval)
      this.rightPoints.splice(r, 0, interval)
    }
  },
  remove(interval: number[]): void | number {
    const {leftPoints, rightPoints, left, mid, right} = this
    const weight = this.size - leftPoints.length

    if (interval[1] < mid) {
      if (left === null) return NOT_FOUND
      const rw = right === null ? 0 : right.size

      if (4 * rw > 3 * (weight - 1)) {
        return rebuildWithoutInterval(this, interval)
      }

      const r = left.remove(interval)

      if (r === EMPTY) {
        this.left = null
        this.size--
        return SUCCESS
      } else if (r === SUCCESS) {
        this.size--
      }

      return r
    } else if (interval[0] > this.mid) {
      if (right === null) {
        return NOT_FOUND
      }

      const lw = left === null ? 0 : left.size

      if (4 * lw > 3 * (weight - 1)) {
        return rebuildWithoutInterval(this, interval)
      }

      const r = right.remove(interval)

      if (r === EMPTY) {
        this.right = null
        this.size--
        return SUCCESS
      } else if (r === SUCCESS) {
        this.size--
      }

      return r
    } else {
      if (this.size === 1) return leftPoints[0] === interval ? EMPTY : NOT_FOUND

      if (leftPoints.length === 1 && leftPoints[0] === interval) {
        if (left !== null && right !== null) {
          let p: IIntervalTreeNode = this
          let n = left

          while (n.right) {
            p = n
            n = n.right
          }

          if (p === this) {
            n.right = right
          } else {
            p.size -= n.size
            p.right = n.left
            n.left = left
            n.right = right
          }

          copy(this, n)

          this.size =
            // need to use `this.` here because of the copy() above potentially
            // altering the current node
            (this.left === null ? 0 : this.left.size) +
            (this.right === null ? 0 : this.right.size) +
            this.leftPoints.length
        } else if (left !== null) {
          copy(this, left)
        } else if (right !== null) {
          copy(this, right)
        }

        return SUCCESS
      }
      for (
        let l = binarySearchGe(leftPoints, interval, compareBegin);
        l < leftPoints.length;
        ++l
      ) {
        if (leftPoints[l][0] !== interval[0]) break
        if (leftPoints[l] === interval) {
          this.size--
          leftPoints.splice(l, 1)

          for (
            let r = binarySearchGe(rightPoints, interval, compareEnd);
            r < rightPoints.length;
            ++r
          ) {
            if (rightPoints[r][1] !== interval[1]) {
              break
            } else if (rightPoints[r] === interval) {
              rightPoints.splice(r, 1)
              return SUCCESS
            }
          }
        }
      }

      return NOT_FOUND
    }
  },
  queryInterval(lo, hi, cb): number[] | void {
    if (lo < this.mid && this.left !== null) {
      this.left.queryInterval(lo, hi, cb)
    }
    if (hi > this.mid && this.right !== null) {
      this.right.queryInterval(lo, hi, cb)
    }

    if (hi < this.mid) reportLeftRange(this.leftPoints, hi, cb)
    else if (lo > this.mid) reportRightRange(this.rightPoints, lo, cb)
    else reportRange(this.leftPoints, cb)
  },
})

const copy = (a: IIntervalTreeNode, b: IIntervalTreeNode): void => {
  a.mid = b.mid
  a.left = b.left
  a.right = b.right
  a.leftPoints = b.leftPoints
  a.rightPoints = b.rightPoints
  a.size = b.size
}

const rebuild = (node: IIntervalTreeNode, intervals: number[][]): void => {
  const ntree = createIntervalTree(intervals)
  if (!ntree) return
  node.mid = ntree.mid
  node.left = ntree.left
  node.right = ntree.right
  node.leftPoints = ntree.leftPoints
  node.rightPoints = ntree.rightPoints
  node.size = ntree.size
}

const rebuildWithInterval = (
  node: IIntervalTreeNode,
  interval: number[]
): void => {
  const intervals = node.intervals([])
  intervals.push(interval)
  rebuild(node, intervals)
}

const rebuildWithoutInterval = (
  node: IIntervalTreeNode,
  interval: number[]
): number => {
  const intervals = node.intervals([])
  const idx = intervals.indexOf(interval)
  if (idx === -1) return NOT_FOUND
  intervals.splice(idx, 1)
  rebuild(node, intervals)
  return SUCCESS
}

const reportLeftRange = (
  arr: number[][],
  hi: number,
  cb: (r: number[]) => any
): number[] | void => {
  for (let i = 0; i < arr.length && arr[i][0] <= hi; ++i) cb(arr[i])
}

const reportRightRange = (
  arr: number[][],
  lo: number,
  cb: (r: number[]) => any
): number[] | void => {
  for (let i = arr.length - 1; i >= 0 && arr[i][1] >= lo; --i) cb(arr[i])
}

const reportRange = (
  arr: number[][],
  cb: (r: number[]) => any
): number[] | void => {
  for (let i = 0; i < arr.length; ++i) cb(arr[i])
}

const compareBegin = (a: number[], b: number[]): number => {
  const d = a[0] - b[0]
  return d !== 0 ? d : a[1] - b[1]
}

const compareEnd = (a: number[], b: number[]): number => {
  const d = a[1] - b[1]
  return d !== 0 ? d : a[0] - b[0]
}

const bInsert = (
  array: number[],
  value: number,
  startVal?: number,
  endVal?: number
): void => {
  const length = array.length,
    start = startVal !== void 0 ? startVal : 0,
    end = endVal !== void 0 ? endVal : length - 1,
    m = start + Math.floor((end - start) / 2)

  if (length === 0) array.push(value)
  else if (value > array[end]) array.splice(end + 1, 0, value)
  else if (value < array[start]) array.splice(start, 0, value)
  else if (value === array[m]) array.splice(m, 0, value)
  else if (start >= end) return
  else if (value < array[m]) bInsert(array, value, start, m - 1)
  else if (value > array[m]) bInsert(array, value, m + 1, end)
}

const createIntervalTree = (
  intervals: number[][]
): IIntervalTreeNode | null => {
  if (intervals.length === 0) return null

  let i = 0
  const pts = []

  for (; i < intervals.length; ++i) {
    bInsert(pts, intervals[i][0])
    bInsert(pts, intervals[i][1])
  }

  const mid = pts[pts.length >> 1],
    leftIntervals: number[][] = [],
    rightIntervals: number[][] = [],
    centerIntervals: number[][] = []

  for (i = 0; i < intervals.length; ++i) {
    const s = intervals[i]
    if (s[1] < mid) leftIntervals.push(s)
    else if (mid < s[0]) rightIntervals.push(s)
    else centerIntervals.push(s)
  }

  //Split center intervals
  const leftPoints = centerIntervals
  const rightPoints = centerIntervals.slice(0)
  leftPoints.sort(compareBegin)
  rightPoints.sort(compareEnd)

  return IntervalTreeNode(
    mid,
    createIntervalTree(leftIntervals),
    createIntervalTree(rightIntervals),
    leftPoints,
    rightPoints
  )
}

//User friendly wrapper that makes it possible to support empty trees
interface IIntervalTree {
  insert: (interval: number[]) => void
  remove: (interval: number[]) => boolean
  queryInterval: (
    lo: number,
    hi: number,
    cb: (r: number[]) => void
  ) => number[] | void
}

const IntervalTree = (): IIntervalTree => {
  let root: IIntervalTreeNode | null = null
  return {
    insert(interval): void {
      if (root !== null) {
        root.insert(interval)
      } else {
        root = IntervalTreeNode(interval[0], null, null, [interval], [interval])
      }
    },
    remove(interval): boolean {
      if (root !== null) {
        const r = root.remove(interval)

        if (r === EMPTY) {
          root = null
        }

        return r !== NOT_FOUND
      }

      return false
    },
    queryInterval(lo, hi, cb): number[] | void {
      if (lo <= hi && root !== null) {
        return root.queryInterval(lo, hi, cb)
      }
    },
  }
}

export default IntervalTree
