/* jest */
import React from 'react'
import {render} from '@testing-library/react'
import {FreeMasonry} from './index'

const heights = [360, 420, 372, 460, 520, 356, 340, 376, 524]
const avgHeight = heights.reduce((a, b) => a + b) / heights.length
const getHeight = i => heights[i % heights.length]

const getFakeItems = (n = 10): {id: number; height: number}[] => {
  const fakeItems: {id: number; height: number}[] = []
  for (let i = 0; i < n; i++) fakeItems.push({id: i, height: getHeight(i)})
  return fakeItems
}

const FakeCard = ({data: {height}, index}): React.ReactElement => (
  <div style={{width: '100%', height}}>
    <span children={index} />
    Hello
  </div>
)

// Simulate window resize event
const resizeEvent = document.createEvent('Event')
resizeEvent.initEvent('resize', true, true)
const orientationEvent = document.createEvent('Event')
orientationEvent.initEvent('orientationchange', true, true)

const resizeTo = (width, height) => {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: width,
    configurable: true,
  })
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: height,
    configurable: true,
  })
  window.dispatchEvent(resizeEvent)
}

const resetSize = () => {
  resizeTo(1280, 720)
}

beforeEach(() => {
  resetSize()
})

describe('FreeMasonry', () => {
  it('throws', () => {
    // @ts-ignore
    expect(() => render(<FreeMasonry />)).toThrowErrorMatchingSnapshot()
  })

  it('sets a custom role', () => {
    const result = render(
      <FreeMasonry
        render={FakeCard}
        items={getFakeItems(1)}
        width={1280}
        height={720}
        scrollTop={0}
        overscanBy={1}
        itemHeightEstimate={avgHeight}
        role="list"
      />
    )

    expect(result.asFragment()).toMatchSnapshot('list listitem')
  })

  it('sets custom element types', () => {
    const result = render(
      <FreeMasonry
        render={FakeCard}
        items={getFakeItems(1)}
        width={1280}
        height={720}
        scrollTop={0}
        overscanBy={1}
        itemHeightEstimate={avgHeight}
        as="ul"
        itemAs="li"
      />
    )

    expect(result.asFragment()).toMatchSnapshot('ul li')
  })

  it('sets class name', () => {
    const result = render(
      <FreeMasonry
        render={FakeCard}
        items={getFakeItems(1)}
        width={1280}
        height={720}
        scrollTop={0}
        overscanBy={1}
        itemHeightEstimate={avgHeight}
        className="foobar"
      />
    )

    expect(result.asFragment()).toMatchSnapshot('foobar')
  })

  it('sets tabIndex', () => {
    const result = render(
      <FreeMasonry
        render={FakeCard}
        items={getFakeItems(1)}
        width={1280}
        height={720}
        scrollTop={0}
        overscanBy={1}
        itemHeightEstimate={avgHeight}
        tabIndex="3"
      />
    )

    expect(result.asFragment()).toMatchSnapshot('3')
  })

  it('disables pointer events when isScrolling', () => {
    const result = render(
      <FreeMasonry
        render={FakeCard}
        items={getFakeItems(1)}
        width={1280}
        height={720}
        scrollTop={0}
        overscanBy={1}
        itemHeightEstimate={avgHeight}
        isScrolling
      />
    )

    expect(result.asFragment()).toMatchSnapshot('pointer-events: none;')
  })

  it('renders real positions after first pass', () => {
    const items = getFakeItems(3000)
    const result = render(
      <FreeMasonry
        render={FakeCard}
        items={items}
        width={1280}
        height={720}
        scrollTop={0}
        itemHeightEstimate={avgHeight}
      />
    )

    expect(result.asFragment()).toMatchSnapshot('measure')

    result.rerender(
      <FreeMasonry
        render={FakeCard}
        items={items}
        width={1280}
        height={720}
        scrollTop={0}
        itemHeightEstimate={avgHeight}
      />
    )

    expect(result.asFragment()).toMatchSnapshot('render')
  })

  it('re-renders on scroll', () => {
    const items = getFakeItems(3000)
    const result = render(
      <FreeMasonry
        render={FakeCard}
        items={items}
        width={1280}
        height={720}
        scrollTop={0}
        overscanBy={1}
        itemHeightEstimate={avgHeight}
      />
    )

    expect(result.asFragment()).toMatchSnapshot('measure')

    result.rerender(
      <FreeMasonry
        render={FakeCard}
        items={items}
        width={1280}
        height={720}
        scrollTop={1000}
        overscanBy={1}
        itemHeightEstimate={avgHeight}
      />
    )

    expect(result.asFragment()).toMatchSnapshot('scrolled')
  })

  it('fires onRender', () => {
    const items = getFakeItems(3000)
    const onRender = jest.fn()
    const result = render(
      <FreeMasonry
        render={FakeCard}
        items={items}
        width={1280}
        height={720}
        scrollTop={0}
        overscanBy={1}
        itemHeightEstimate={avgHeight}
        onRender={onRender}
      />
    )
    result.rerender(
      <FreeMasonry
        render={FakeCard}
        items={items}
        width={1280}
        height={720}
        scrollTop={0}
        overscanBy={1}
        itemHeightEstimate={avgHeight}
        onRender={onRender}
      />
    )
    expect(onRender).toBeCalledTimes(1)
    expect(onRender).toBeCalledWith(
      0,
      21,
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          height: expect.any(Number),
        }),
      ])
    )
  })
})
