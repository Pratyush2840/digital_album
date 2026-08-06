import React, { useState } from 'react'

const PostImages = ({ post, onImageClick }) => {
  const images = post.images?.length > 0 ? post.images : (post.image ? [post.image] : [])
  const [index, setIndex] = useState(0)

  if (images.length === 0) return null

  const safeIndex = Math.min(index, images.length - 1)

  const goPrev = (e) => {
    e.stopPropagation()
    setIndex((i) => (i - 1 + images.length) % images.length)
  }

  const goNext = (e) => {
    e.stopPropagation()
    setIndex((i) => (i + 1) % images.length)
  }

  return (
    <div className='post-carousel'>
      <img
        src={images[safeIndex]}
        alt='Post'
        onClick={onImageClick}
        style={onImageClick ? { cursor: 'pointer' } : undefined}
      />
      {images.length > 1 && (
        <>
          <button className='post-carousel-arrow left' onClick={goPrev}>‹</button>
          <button className='post-carousel-arrow right' onClick={goNext}>›</button>
          <div className='post-carousel-dots'>
            {images.map((_, i) => (
              <span key={i} className={i === safeIndex ? 'post-carousel-dot active' : 'post-carousel-dot'} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default PostImages
