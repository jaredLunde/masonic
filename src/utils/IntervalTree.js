import bounds from './binarySearchBounds'


const NOT_FOUND = 0, SUCCESS = 1, EMPTY = 2

class IntervalTreeNode {
  constructor (mid, left, right, leftPoints, rightPoints) {
    this.mid = mid
    this.left = left
    this.right = right
    this.leftPoints = leftPoints
    this.rightPoints = rightPoints
    this.count = (left ? left.count : 0) + (right ? right.count : 0) + leftPoints.length
  }

  intervals (result) {
    result.push.apply(result, this.leftPoints)
    if (this.left !== null) {
      this.left.intervals(result)
    }
    if (this.right !== null) {
      this.right.intervals(result)
    }
    return result
  }

  insert (interval) {
    let weight = this.count - this.leftPoints.length
    this.count += 1

    if (interval[1] < this.mid) {
      if (this.left !== null) {
        if (4 * (this.left.count + 1) > 3 * (weight + 1)) {
          rebuildWithInterval(this, interval)
        }
        else {
          this.left.insert(interval)
        }
      }
      else {
        this.left = createIntervalTree([interval])
      }
    }
    else if (interval[0] > this.mid) {
      if (this.right !== null) {
        if (4 * (
          this.right.count + 1
        ) > 3 * (
          weight + 1
        )) {
          rebuildWithInterval(this, interval)
        }
        else {
          this.right.insert(interval)
        }
      }
      else {
        this.right = createIntervalTree([interval])
      }
    }
    else {
      let l = bounds.ge(this.leftPoints, interval, compareBegin)
      let r = bounds.ge(this.rightPoints, interval, compareEnd)
      this.leftPoints.splice(l, 0, interval)
      this.rightPoints.splice(r, 0, interval)
    }
  }

  remove (interval) {
    let weight = this.count - this.leftPoints

    if (interval[1] < this.mid) {
      if (!this.left) {
        return NOT_FOUND
      }

      let rw = this.right ? this.right.count : 0

      if (4 * rw > 3 * (weight - 1)) {
        return rebuildWithoutInterval(this, interval)
      }

      let r = this.left.remove(interval)

      if (r === EMPTY) {
        this.left = null
        this.count -= 1
        return SUCCESS
      }
      else if (r === SUCCESS) {
        this.count -= 1
      }

      return r
    }
    else if (interval[0] > this.mid) {
      if (!this.right) {
        return NOT_FOUND
      }

      let lw = this.left ? this.left.count : 0

      if (4 * lw > 3 * (weight - 1)) {
        return rebuildWithoutInterval(this, interval)
      }

      let r = this.right.remove(interval)

      if (r === EMPTY) {
        this.right = null
        this.count -= 1
        return SUCCESS
      }
      else if (r === SUCCESS) {
        this.count -= 1
      }

      return r
    }
    else {
      if (this.count === 1) {
        return this.leftPoints[0] === interval ? EMPTY : NOT_FOUND
      }

      if (this.leftPoints.length === 1 && this.leftPoints[0] === interval) {
        if (this.left !== null && this.right !== null) {
          let p = this
          let n = this.left

          while (n.right) {
            p = n
            n = n.right
          }

          if (p === this) {
            n.right = this.right
          }
          else {
            let l = this.left
            let r = this.right
            p.count -= n.count
            p.right = n.left
            n.left = l
            n.right = r
          }

          copy(this, n)

          this.count = (
            this.left ? this.left.count : 0
          ) + (
            this.right ? this.right.count : 0
          ) + this.leftPoints.length
        }
        else if (this.left !== null) {
          copy(this, this.left)
        }
        else {
          copy(this, this.right)
        }

        return SUCCESS
      }
      for (
        let l = bounds.ge(this.leftPoints, interval, compareBegin);
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
            let r = bounds.ge(this.rightPoints, interval, compareEnd);
            r < this.rightPoints.length;
            ++r
          ) {
            if (this.rightPoints[r][1] !== interval[1]) {
              break
            }
            else if (this.rightPoints[r] === interval) {
              this.rightPoints.splice(r, 1)
              return SUCCESS
            }
          }
        }
      }

      return NOT_FOUND
    }
  }

  queryPoint (x, cb) {
    if (x < this.mid) {
      if (this.left !== null) {
        let r = this.left.queryPoint(x, cb)

        if (r !== void 0) {
          return r
        }
      }
      return reportLeftRange(this.leftPoints, x, cb)
    }
    else if (x > this.mid) {
      if (this.right !== null) {
        let r = this.right.queryPoint(x, cb)
        if (r !== void 0) {
          return r
        }
      }

      return reportRightRange(this.rightPoints, x, cb)
    }
    else {
      return reportRange(this.leftPoints, cb)
    }
  }

  queryInterval (lo, hi, cb) {
    if (lo < this.mid && this.left !== null) {
      let r = this.left.queryInterval(lo, hi, cb)

      if (r !== void 0) {
        return r
      }
    }
    if (hi > this.mid && this.right !== null) {
      let r = this.right.queryInterval(lo, hi, cb)

      if (r !== void 0) {
        return r
      }
    }

    if (hi < this.mid) {
      return reportLeftRange(this.leftPoints, hi, cb)
    }
    else if (lo > this.mid) {
      return reportRightRange(this.rightPoints, lo, cb)
    }
    else {
      return reportRange(this.leftPoints, cb)
    }
  }

}

const copy = (a, b) => {
  a.mid = b.mid
  a.left = b.left
  a.right = b.right
  a.leftPoints = b.leftPoints
  a.rightPoints = b.rightPoints
  a.count = b.count
}

const rebuild = (node, intervals) => {
  let ntree = createIntervalTree(intervals)
  node.mid = ntree.mid
  node.left = ntree.left
  node.right = ntree.right
  node.leftPoints = ntree.leftPoints
  node.rightPoints = ntree.rightPoints
  node.count = ntree.count
}

const rebuildWithInterval = (node, interval) => {
  let intervals = node.intervals([])
  intervals.push(interval)
  rebuild(node, intervals)
}

const rebuildWithoutInterval = (node, interval) => {
  let intervals = node.intervals([])
  let idx = intervals.indexOf(interval)
  if (idx === -1) return NOT_FOUND
  intervals.splice(idx, 1)
  rebuild(node, intervals)
  return SUCCESS
}


const reportLeftRange = (arr, hi, cb) => {
  for (let i = 0; i < arr.length && arr[i][0] <= hi; ++i) {
    let r = cb(arr[i])
    if (r !== void 0) return r
  }
}

const reportRightRange = (arr, lo, cb) => {
  for (let i = arr.length - 1; i >= 0 && arr[i][1] >= lo; --i) {
    let r = cb(arr[i])
    if (r !== void 0) return r
  }
}

const reportRange = (arr, cb) => {
  for (let i = 0; i < arr.length; ++i) {
    let r = cb(arr[i])
    if (r !== void 0) return r
  }
}

const compareNumbers = (a, b) => a - b

const compareBegin = (a, b) => {
  let d = a[0] - b[0]
  return d ? d : a[1] - b[1]
}

const compareEnd = (a, b) => {
  let d = a[1] - b[1]
  return d ? d : a[0] - b[0]
}

const createIntervalTree = (intervals) => {
  if (intervals.length === 0) {
    return null
  }

  let pts = []

  for (let i = 0; i < intervals.length; ++i)
    pts.push(intervals[i][0], intervals[i][1])

  pts.sort(compareNumbers)

  let mid = pts[pts.length >> 1],
      leftIntervals = [],
      rightIntervals = [],
      centerIntervals = []

  for (let i = 0; i < intervals.length; ++i) {
    let s = intervals[i]

    if (s[1] < mid) {
      leftIntervals.push(s)
    }
    else if (mid < s[0]) {
      rightIntervals.push(s)
    }
    else {
      centerIntervals.push(s)
    }
  }

  //Split center intervals
  let leftPoints = centerIntervals
  let rightPoints = centerIntervals.slice(0)
  leftPoints.sort(compareBegin)
  rightPoints.sort(compareEnd)

  return new IntervalTreeNode(
    mid,
    createIntervalTree(leftIntervals),
    createIntervalTree(rightIntervals),
    leftPoints,
    rightPoints,
  )
}

//User friendly wrapper that makes it possible to support empty trees
class IntervalTree {
  constructor (intervals) {
    if (intervals !== null && intervals !== void 0 && intervals.length > 0) {
      this.root = createIntervalTree(intervals)
    }
    else {
      this.root = null
    }
  }

  insert (interval) {
    if (this.root !== null) {
      this.root.insert(interval)
    }
    else {
      this.root = new IntervalTreeNode(interval[0], null, null, [interval], [interval])
    }
  }

  remove (interval) {
    if (this.root !== null) {
      let r = this.root.remove(interval)

      if (r === EMPTY) {
        this.root = null
      }

      return r !== NOT_FOUND
    }

    return false
  }

  queryPoint (p, cb) {
    if (this.root !== null) {
      return this.root.queryPoint(p, cb)
    }
  }

  queryInterval (lo, hi, cb) {
    if (lo <= hi && this.root !== null) {
      return this.root.queryInterval(lo, hi, cb)
    }
  }

  get count () {
    return this.root !== null ? this.root.count : 0
  }

  get intervals () {
    return this.root !== null ? this.root.intervals([]) : []
  }
}

export default IntervalTree