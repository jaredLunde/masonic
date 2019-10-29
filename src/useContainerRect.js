import {useState, useRef} from 'react'
import memoizeOne from '@essentials/memoize-one'
import useLayoutEffect from '@react-hook/passive-layout-effect'

const defaultRect = {top: 0, width: 0}
const get = memoizeOne(
  (element, width, top) => [{width, top}, element],
  (args, pargs) =>
    args[1] === pargs[1] && args[2] === pargs[2] && args[0] === pargs[0]
)

export default (windowWidth, windowHeight) => {
  const [element, setElement] = useState(null),
    queryInterval = useRef(null)
  const [containerRect, setContainerRect] = useState(defaultRect)

  useLayoutEffect(() => {
    if (element !== null) {
      const setRect = () => {
        const rect = element.getBoundingClientRect()
        if (
          rect.top !== containerRect.top ||
          rect.width !== containerRect.width
        ) {
          setContainerRect({top: rect.top, width: rect.width})
        }
      }
      setRect()
      // Got a better way to track changes to `top`?
      // Resize/MutationObserver() won't cover it I don't think (top)
      // Submit a PR/issue
      let qi = (queryInterval.current = setInterval(setRect, 360))
      return () => clearInterval(qi)
    }
  }, [windowWidth, windowHeight, containerRect, element])

  return get(setElement, containerRect.width || windowWidth, containerRect.top)
}
