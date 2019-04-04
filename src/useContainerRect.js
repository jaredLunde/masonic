import {useEffect, useState, useRef} from 'react'
import {memoizeOne} from './utils'


const defaultRect = {top: 0, width: 0}
const get = memoizeOne(
  (element, width, top) => ([element, {width, top}]),
  (args, pargs) => args[1] === pargs[1] && args[2] === pargs[2] && args[0] === pargs[0]
)

export default (windowWidth, windowHeight) => {
  const
    element = useRef(null),
    queryInterval = useRef(null)
  const [containerRect, setContainerRect] = useState(defaultRect)

  useEffect(
    () => {
      if (element.current !== null) {
        const setRect = () => {
          const rect = element.current.getBoundingClientRect()
          if (rect.top !== containerRect.top || rect.width !== containerRect.width) {
            setContainerRect({
              top: rect.top,
              width: rect.width,
            })
          }
        }
        setRect()
        // Got a better way to track changes to `top`?
        // Resize/MutationObserver() won't cover it I don't think (top)
        // Submit a PR/issue
        queryInterval.current = setInterval(setRect, 360)
        return () => clearInterval(queryInterval.current)
      }
    },
    [windowWidth, windowHeight, containerRect, element.current]
  )

  return get(element, containerRect.width || windowWidth, containerRect.top)
}
