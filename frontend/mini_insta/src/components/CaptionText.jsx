import React from 'react'
import { Link } from 'react-router-dom'

const TOKEN_REGEX = /(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g

const CaptionText = ({ text }) => {
  if (!text) return null

  const parts = text.split(TOKEN_REGEX)

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          return <Link key={i} to={`/hashtag/${part.slice(1)}`} className='caption-hashtag'>{part}</Link>
        }
        if (part.startsWith('@')) {
          return <Link key={i} to={`/people?q=${part.slice(1)}`} className='caption-mention'>{part}</Link>
        }
        return <React.Fragment key={i}>{part}</React.Fragment>
      })}
    </>
  )
}

export default CaptionText
