import React from 'react'
import PropTypes from 'prop-types'
import Masonry from './Masonry'


const List = props => <Masonry
  role='list'
  {...props}
  columnGutter={props.rowGutter}
  columnCount={1}
  columnWidth={1}
/>

if (__DEV__) {
  List.propTypes = {
    rowGutter: PropTypes.number
  }
}

export default List