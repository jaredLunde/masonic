import {useState, useEffect, useRef} from 'react'
import emptyArr from 'empty/array'
import emptyObj from 'empty/object'
import useLayoutEffect from '@react-hook/passive-layout-effect'
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

  useLayoutEffect(() => {
    if (isScrollingTimeout.current !== null) {
      clearTimeout(isScrollingTimeout.current)
      isScrollingTimeout.current = null
    }

    setIsScrolling(true)
    isScrollingTimeout.current = setTimeout(() => {
      // This is here to prevent premature bail outs while maintaining high resolution
      // unsets. Without it there will always bee a lot of unnecessary DOM writes to style.
      setIsScrolling(false)
      isScrollingTimeout.current = null
    }, 1000 / 6)
  }, [scrollY])
  // cleans up isScrollingTimeout on unmount
  useEffect(
    () => () =>
      isScrollingTimeout.current !== null &&
      clearTimeout(isScrollingTimeout.current),
    emptyArr
  )

  return {width, height, scrollY, isScrolling}
}
