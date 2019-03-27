# Masonic
A React virtualized masonry component for the window based upon Brian Vaughn's
[react-virtualized](https://github.com/bvaughn/react-virtualized) 
and further inspired by [react-window](https://github.com/bvaughn/react-window).

## Installation
### [Find Masonic on NPM](https://www.npmjs.com/package/masonic)
`yarn add masonic` or `npm i masonic`

## Requirements
`React >16.8` is a minimum requirement because
this package relies on and provides React hooks. 

## Motivation
The only use case I have ever had for a masonry component is relative
to the browser window. Brian's Masonry component is great for its
performance and versatility, but I wanted something more suited to my 
needs and something with an API that more closely matched `react-window`'s 
awesome API.

## API Documentation
### `Masonry`
An autosizing virtualized masonry component which only renders items 
currently visible in the window.
```jsx harmony
const items = []
for (let i = 0; i < 1000; i++) {
  items.push({id: i})
}

const MyMasonryComponent = props => (
  <Masonry
    items={items}
    columnWidth={240}
    columnGutter={16}
    estimatedItemHeight={160}
    getItemKey={data => data.id}
    render={
      ({index, data, width}) => (
        <div>
          <div>
            Index: {index}
          </div>
          <pre>
            {JSON.stringify(data)}
          </pre>
          <div>
            Column width: {width}
          </div>
        </div>
      )
    }
  />
)
```

#### Prop types

### `List`
A virtualized list component which only renders items currently
visible in the window. This is just a single column `Masonry` component.

#### Prop types

### `useInfiniteScroller`
A React hook for easily creating an infinite scrolling `Masonry` or `List` 
component.

#### Options

### `memoizeOne`

## Differences from `react-virtualized/Masonry`
There are actually quite a few differences between these components and
the originals, despite the overall design being highly inspired by them.

1. The original component requires a `<CellMeasurer>`,
`cellPositioner`, and `cellMeasurerCache`. In `Masonic` this 
functionality=is built in and uses [`resize-observer-polyfill`](https://github.com/que-etc/resize-observer-polyfill) 
for tracking cell size changes.

2. The implementation for updating cell positions and sizes is also much more
efficient in this component because only specific cells and columns are 
updated when cell sizes change, whereas in the original a complete reflow
is triggered.

3. This component only renders relative to its parent container's width 
and the browser window's height. The original component is tuned for 
rendering inside a parent container and not the window.

4. The API is a complete rewrite and because of much of what is mentioned
above, is much easier to use in my opinion.

## Credits
- Everyone who worked on [`react-virtualized`](https://github.com/bvaughn/react-virtualized/graphs/contributors)
- Mikola Lysenko for his [`binary-search-bounds`]( * https://github.com/mikolalysenko/binary-search-bounds)
and [`interval-tree-1d`](https://github.com/mikolalysenko/interval-tree-1d)