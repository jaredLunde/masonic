const NOT_FOUND = 0,
  SUCCESS = 1,
  EMPTY = 2

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

class IntervalTreeNode {
  mid: number
  left: IntervalTreeNode | null
  right: IntervalTreeNode | null
  leftPoints: number[][]
  rightPoints: number[][]
  count: number

  constructor(mid, left, right, leftPoints, rightPoints) {
    this.mid = mid
    this.left = left
    this.right = right
    this.leftPoints = leftPoints
    this.rightPoints = rightPoints
    this.count =
      (left ? left.count : 0) + (right ? right.count : 0) + leftPoints.length
  }

  intervals(result: number[][]): number[][] {
    result.push.apply(result, this.leftPoints)

    if (this.left !== null) {
      this.left.intervals(result)
    }

    if (this.right !== null) {
      this.right.intervals(result)
    }

    return result
  }

  insert(interval: number[]): void {
    const weight = this.count - this.leftPoints.length
    this.count += 1

    if (interval[1] < this.mid) {
      if (this.left !== null) {
        if (4 * (this.left.count + 1) > 3 * (weight + 1)) {
          rebuildWithInterval(this, interval)
        } else {
          this.left.insert(interval)
        }
      } else {
        this.left = createIntervalTree([interval])
      }
    } else if (interval[0] > this.mid) {
      if (this.right !== null) {
        if (4 * (this.right.count + 1) > 3 * (weight + 1)) {
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
  }

  remove(interval: number[]): void | number {
    const weight = this.count - this.leftPoints.length

    if (interval[1] < this.mid) {
      if (this.left === null) {
        return NOT_FOUND
      }

      const rw = this.right === null ? 0 : this.right.count

      if (4 * rw > 3 * (weight - 1)) {
        return rebuildWithoutInterval(this, interval)
      }

      const r = this.left.remove(interval)

      if (r === EMPTY) {
        this.left = null
        this.count -= 1
        return SUCCESS
      } else if (r === SUCCESS) {
        this.count -= 1
      }

      return r
    } else if (interval[0] > this.mid) {
      if (this.right === null) {
        return NOT_FOUND
      }

      const lw = this.left === null ? 0 : this.left.count

      if (4 * lw > 3 * (weight - 1)) {
        return rebuildWithoutInterval(this, interval)
      }

      const r = this.right.remove(interval)

      if (r === EMPTY) {
        this.right = null
        this.count -= 1
        return SUCCESS
      } else if (r === SUCCESS) {
        this.count -= 1
      }

      return r
    } else {
      if (this.count === 1) {
        return this.leftPoints[0] === interval ? EMPTY : NOT_FOUND
      }

      if (this.leftPoints.length === 1 && this.leftPoints[0] === interval) {
        if (this.left !== null && this.right !== null) {
          let p: IntervalTreeNode = this
          let n = this.left

          while (n.right) {
            p = n
            n = n.right
          }

          if (p === this) {
            n.right = this.right
          } else {
            const l = this.left
            const r = this.right
            p.count -= n.count
            p.right = n.left
            n.left = l
            n.right = r
          }

          copy(this, n)

          this.count =
            (this.left === null ? 0 : this.left.count) +
            (this.right === null ? 0 : this.right.count) +
            this.leftPoints.length
        } else if (this.left !== null) {
          copy(this, this.left)
        } else if (this.right !== null) {
          copy(this, this.right)
        }

        return SUCCESS
      }
      for (
        let l = binarySearchGe(this.leftPoints, interval, compareBegin);
        l < this.leftPoints.length;
        ++l
      ) {
        if (this.leftPoints[l][0] !== interval[0]) {
          break
        }

        if (this.leftPoints[l] === interval) {
          this.count -= 1
          this.leftPoints.splice(l, 1)

          for (
            let r = binarySearchGe(this.rightPoints, interval, compareEnd);
            r < this.rightPoints.length;
            ++r
          ) {
            if (this.rightPoints[r][1] !== interval[1]) {
              break
            } else if (this.rightPoints[r] === interval) {
              this.rightPoints.splice(r, 1)
              return SUCCESS
            }
          }
        }
      }

      return NOT_FOUND
    }
  }

  queryInterval(
    lo: number,
    hi: number,
    cb: (r: number[]) => void
  ): number[] | void {
    if (lo < this.mid && this.left !== null) {
      const r = this.left.queryInterval(lo, hi, cb)
      if (r !== void 0) return r
    }
    if (hi > this.mid && this.right !== null) {
      const r = this.right.queryInterval(lo, hi, cb)
      if (r !== void 0) return r
    }

    if (hi < this.mid) {
      return reportLeftRange(this.leftPoints, hi, cb)
    } else if (lo > this.mid) {
      return reportRightRange(this.rightPoints, lo, cb)
    } else {
      return reportRange(this.leftPoints, cb)
    }
  }
}

const copy = (a: IntervalTreeNode, b: IntervalTreeNode): void => {
  a.mid = b.mid
  a.left = b.left
  a.right = b.right
  a.leftPoints = b.leftPoints
  a.rightPoints = b.rightPoints
  a.count = b.count
}

const rebuild = (node: IntervalTreeNode, intervals: number[][]): void => {
  const ntree = createIntervalTree(intervals)
  if (!ntree) return
  node.mid = ntree.mid
  node.left = ntree.left
  node.right = ntree.right
  node.leftPoints = ntree.leftPoints
  node.rightPoints = ntree.rightPoints
  node.count = ntree.count
}

const rebuildWithInterval = (
  node: IntervalTreeNode,
  interval: number[]
): void => {
  const intervals = node.intervals([])
  intervals.push(interval)
  rebuild(node, intervals)
}

const rebuildWithoutInterval = (
  node: IntervalTreeNode,
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
  cb: (r: number[]) => void
): number[] | void => {
  for (let i = 0; i < arr.length && arr[i][0] <= hi; ++i) {
    const r = cb(arr[i])
    if (r !== void 0) return r
  }
}

const reportRightRange = (
  arr: number[][],
  lo: number,
  cb: (r: number[]) => void
): number[] | void => {
  for (let i = arr.length - 1; i >= 0 && arr[i][1] >= lo; --i) {
    const r = cb(arr[i])
    if (r !== void 0) return r
  }
}

const reportRange = (
  arr: number[][],
  cb: (r: number[]) => void
): number[] | void => {
  for (let i = 0; i < arr.length; ++i) {
    const r = cb(arr[i])
    if (r !== void 0) return r
  }
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

  if (length === 0) {
    array.push(value)
  } else if (value > array[end]) {
    array.splice(end + 1, 0, value)
  } else if (value < array[start]) {
    array.splice(start, 0, value)
  } else if (value === array[m]) {
    array.splice(m, 0, value)
  } else if (start >= end) {
    return
  } else if (value < array[m]) {
    bInsert(array, value, start, m - 1)
  } else if (value > array[m]) {
    bInsert(array, value, m + 1, end)
  }
}

const createIntervalTree = (intervals: number[][]): IntervalTreeNode | null => {
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

    if (s[1] < mid) {
      leftIntervals.push(s)
    } else if (mid < s[0]) {
      rightIntervals.push(s)
    } else {
      centerIntervals.push(s)
    }
  }

  //Split center intervals
  const leftPoints = centerIntervals
  const rightPoints = centerIntervals.slice(0)
  leftPoints.sort(compareBegin)
  rightPoints.sort(compareEnd)

  return new IntervalTreeNode(
    mid,
    createIntervalTree(leftIntervals),
    createIntervalTree(rightIntervals),
    leftPoints,
    rightPoints
  )
}

//User friendly wrapper that makes it possible to support empty trees
class IntervalTree {
  root: IntervalTreeNode | null

  constructor(intervals?: number[][]) {
    if (intervals !== void 0 && intervals.length > 0) {
      this.root = createIntervalTree(intervals)
    } else {
      this.root = null
    }
  }

  insert(interval: number[]): void {
    if (this.root !== null) {
      this.root.insert(interval)
    } else {
      this.root = new IntervalTreeNode(
        interval[0],
        null,
        null,
        [interval],
        [interval]
      )
    }
  }

  remove(interval: number[]): boolean {
    if (this.root !== null) {
      const r = this.root.remove(interval)

      if (r === EMPTY) {
        this.root = null
      }

      return r !== NOT_FOUND
    }

    return false
  }

  queryInterval(
    lo: number,
    hi: number,
    cb: (r: number[]) => void
  ): number[] | void {
    if (lo <= hi && this.root !== null) {
      return this.root.queryInterval(lo, hi, cb)
    }
  }

  get count(): number {
    return this.root !== null ? this.root.count : 0
  }
}

export default IntervalTree
