/**
 * Binary Search Bounds
 * https://github.com/mikolalysenko/binary-search-bounds
 * Mikola Lysenko
 **/

const _GEA = (a, l, h, y) => {
  let i = h + 1
  while (l <= h) {
    let m = (l + h) >>> 1,
      x = a[m]
    if (x >= y) {
      i = m
      h = m - 1
    }
    else {
      l = m + 1
    }
  }
  return i
}

const _GEP = (a, l, h, y, c) => {
  let i = h + 1
  while (l <= h) {
    let m = (l + h) >>> 1,
      x = a[m]
    if (c(x, y) >= 0) {
      i = m
      h = m - 1
    }
    else {
      l = m + 1
    }
  }
  return i
}

const dispatchBsearchGE = (a, y, c, l, h) =>
  typeof c === 'function'
    ? _GEP(a, l === void 0 ? 0 : l | 0, h === void 0 ? a.length - 1 : h | 0, y, c)
    : _GEA(a, c === void 0 ? 0 : c | 0, l === void 0 ? a.length - 1 : l | 0, y)

const _GTA = (a, l, h, y) => {
  let i = h + 1
  while (l <= h) {
    let m = (l + h) >>> 1,
      x = a[m]
    if (x > y) {
      i = m
      h = m - 1
    }
    else {
      l = m + 1
    }
  }
  return i
}

const _GTP = (a, l, h, y, c) => {
  let i = h + 1

  while (l <= h) {
    let m = (l + h) >>> 1,
      x = a[m]
    if (c(x, y) > 0) {
      i = m
      h = m - 1
    }
    else {
      l = m + 1
    }
  }

  return i
}

const dispatchBsearchGT = (a, y, c, l, h) =>
  typeof c === 'function'
    ? _GTP(a, l === void 0 ? 0 : l | 0, h === void 0 ? a.length - 1 : h | 0, y, c)
    : _GTA(a, c === void 0 ? 0 : c | 0, l === void 0 ? a.length - 1 : l | 0, y)

const _LTA = (a, l, h, y) => {
  let i = l - 1
  while (l <= h) {
    let m = (l + h) >>> 1,
      x = a[m]
    if (x < y) {
      i = m
      l = m + 1
    }
    else {
      h = m - 1
    }
  }
  return i
}

const _LTP = (a, l, h, y, c) => {
  let i = l - 1
  while (l <= h) {
    let m = (
        l + h
      ) >>> 1,
      x = a[m]
    if (c(x, y) < 0) {
      i = m
      l = m + 1
    }
    else {
      h = m - 1
    }
  }
  return i
}

const dispatchBsearchLT = (a, y, c, l, h) =>
  typeof c === 'function'
    ? _LTP(a, l === void 0 ? 0 : l | 0, h === void 0 ? a.length - 1 : h | 0, y, c)
    : _LTA(a, c === void 0 ? 0 : c | 0, l === void 0 ? a.length - 1 : l | 0, y)

const _LEA = (a, l, h, y) => {
  let i = l - 1
  while (l <= h) {
    let m = (
        l + h
      ) >>> 1,
      x = a[m]
    if (x <= y) {
      i = m
      l = m + 1
    }
    else {
      h = m - 1
    }
  }
  return i
}

const _LEP = (a, l, h, y, c) => {
  let i = l - 1
  while (l <= h) {
    let m = (
        l + h
      ) >>> 1,
      x = a[m]
    if (c(x, y) <= 0) {
      i = m
      l = m + 1
    }
    else {
      h = m - 1
    }
  }
  return i
}

const dispatchBsearchLE = (a, y, c, l, h) =>
  typeof c === 'function'
    ? _LEP(a, l === void 0 ? 0 : l | 0, h === void 0 ? a.length - 1 : h | 0, y, c)
    : _LEA(a, c === void 0 ? 0 : c | 0, l === void 0 ? a.length - 1 : l | 0, y)

const _EQA = (a, l, h, y) => {
  while (l <= h) {
    let m = (l + h) >>> 1,
      x = a[m]
    if (x === y) {
      return m
    }
    else if (x <= y) {
      l = m + 1
    }
    else {
      h = m - 1
    }
  }
  return -1
}
const _EQP = (a, l, h, y, c) => {
  while (l <= h) {
    let m = (l + h) >>> 1,
      x = a[m]
    let p = c(x, y)
    if (p === 0) {
      return m
    }
    else if (p <= 0) {
      l = m + 1
    }
    else {
      h = m - 1
    }
  }
  return -1
}

const dispatchBsearchEQ = (a, y, c, l, h) =>
  typeof c === 'function'
    ? _EQP(a, l === void 0 ? 0 : l | 0, h === void 0 ? a.length - 1 : h | 0, y, c)
    : _EQA(a, c === void 0 ? 0 : c | 0, l === void 0 ? a.length - 1 : l | 0, y)

export default {
  ge: dispatchBsearchGE,
  gt: dispatchBsearchGT,
  lt: dispatchBsearchLT,
  le: dispatchBsearchLE,
  eq: dispatchBsearchEQ,
}