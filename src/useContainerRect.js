import {useEffect, useState, useRef} from 'react'
import {memoizeOne} from './utils'


const defaultRect = {top: 0, width: 0}
const get = memoizeOne(
  (element, width, top) => ([element, width, top]),
  (args, pargs) => args[1] === pargs[1] && args[2] === pargs[2] && args[0] === pargs[0]
)

export default (windowWidth, windowHeight) => {
  const element = useRef(null)
  const [containerRect, setContainerRect] = useState(defaultRect)

  useEffect(
    () => {
      if (element.current !== null) {
        setContainerRect({
          top: element.current.offsetTop,
          width: element.current.offsetWidth,
        })
      }
    },
    [windowWidth, windowHeight, element.current]
  )

  return get(element, containerRect.width || windowWidth, containerRect.top)
}
