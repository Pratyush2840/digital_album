import React from 'react'

const Spinner = ({ label = 'Loading...' }) => (
  <div className='spinner-wrap'>
    <span className='spinner' />
    <p>{label}</p>
  </div>
)

export default Spinner
