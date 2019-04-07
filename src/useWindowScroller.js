import {useState, useEffect, useCallback, useRef} from 'react'
import emptyArr from 'empty/array'
import emptyObj from 'empty/object'
import {requestTimeout, clearRequestTimeout} from '@essentials/request-timeout'
import useWindowScroll from '@react-hook/window-scroll'
import useWindowSize from '@react-hook/window-size'


const defaultSizeOpt = {wait: 120}
const defaultScrollFps = 8

export default (initialWidth, initialHeight, opt = emptyObj) => {
  const fps = opt.scroll?.fps || defaultScrollFps
  const scrollY = useWindowScroll(fps)
  const [width, height] = useWindowSize(
    initialWidth,
    initialHeight,
    opt.size || defaultSizeOpt
  )
  const [isScrolling, setIsScrolling] = useState(false)
  const isScrollingTimeout = useRef(null)

  useEffect(
    () => {
      if (isScrollingTimeout.current !== null) {
        clearRequestTimeout(isScrollingTimeout.current)
        isScrollingTimeout.current = null
      }

      if (isScrolling === false) {
        setIsScrolling(true)
      }

      const unsetIsScrolling = () => {
        // This is here to prevent premature bail outs while maintaining high resolution
        // unsets. Without it there will always bee a lot of unnecessary DOM writes to style.
        const currentScrollY = window.scrollY !== void 0 ? window.scrollY : window.pageYOffset

        if (currentScrollY === scrollY) {
          setIsScrolling(false)
        }

        isScrollingTimeout.current = null
      }

      isScrollingTimeout.current = requestTimeout(unsetIsScrolling, 1000 / 60)
    },
    [scrollY]
  )
  // cleans up isScrollingTimeout on unmount
  useEffect(
    () => () =>
      isScrollingTimeout.current !== null && clearRequestTimeout(isScrollingTimeout.current),
    emptyArr
  )

  return {width, height, scrollY, isScrolling}
}
