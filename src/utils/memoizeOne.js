import emptyArr from 'empty/array'

// by default only four arguments are checked as opposed to looping because looping
// is slow and we don't have any memoized functions with >4 arguments
//
// in any case the isEqual function can be overwritten below, this is just a default
const defaultIsEqual = (args, prevArgs) => (
  args[0] === prevArgs[0]
  && args[1] === prevArgs[1]
  && args[2] === prevArgs[2]
  && args[3] === prevArgs[3]
)

export default (fn, isEqual = defaultIsEqual) => {
  let args = emptyArr, value

  return function () {
    if (isEqual(arguments, args) === true) {
      return value
    }

    args = arguments
    value = fn.apply(this, arguments)
    return value
  }
}