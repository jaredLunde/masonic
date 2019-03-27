import {useState, useEffect, useCallback, useRef} from 'react'
import emptyArr from 'empty/array'
import emptyObj from 'empty/object'
import {requestTimeout, clearRequestTimeout} from '@render-props/utils'
import useWindowScroll from '@react-hook/window-scroll'
import useWindowSize from '@react-hook/window-size'


const defaultSizeOpt = {wait: 120, leading: false}
const defaultScrollFps = 8

export default (opt = emptyObj) => {
  const scrollY = useWindowScroll(opt.scroll?.fps || defaultScrollFps)
  const [windowWidth, windowHeight] = useWindowSize(
    opt?.size?.initialWidth || 360,
    opt?.size?.initialHeight || 720,
    opt.size || defaultSizeOpt
  )
  const [isScrolling, setIsScrolling] = useState(false)
  const isScrollingTimeout = useRef(null)
  const unsetIsScrolling  = useCallback(
    () => {
      setIsScrolling(false)
      isScrollingTimeout.current = null
    },
    emptyArr
  )

  useEffect(
    () => {
      if (isScrolling === false && scrollY > 0) {
        setIsScrolling(true)
      }

      if (isScrollingTimeout.current !== null) {
        clearRequestTimeout(isScrollingTimeout.current)
        isScrollingTimeout.current = null
      }

      isScrollingTimeout.current = requestTimeout(unsetIsScrolling, 160)
      return () =>
        isScrollingTimeout.current !== null && clearRequestTimeout(isScrollingTimeout.current)
    },
    [scrollY]
  )

  return {windowWidth, windowHeight, scrollY, isScrolling}
}
