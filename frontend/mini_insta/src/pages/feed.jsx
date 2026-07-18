import React , {useState , useEffect} from 'react'
import axios from 'axios'
const Feed = () => {
    const [posts, setposts] = useState([
        {
            _id:1,
            image: "https://ik.imagekit.io/esnmxeqsl/image_yv_8tASIo.jpg?updatedAt=1784307850779",
            caption: "This is a sample caption for the first post."
        }
    ])

    useEffect(() => {
        axios.get('http://localhost:3000/posts')
        .then((res)=>{
            setposts(res.data.posts)
        })
    } , [])




  return (
    <section className='feed-section'>
      {
        posts.length > 0 ? (
            posts.map((post) => (
                <div key={post._id} className='post-card'>
                    <img src={post.image} alt='Post' />
                    <p>{post.caption}</p>
                </div>
            ))
        ) : (
            <p>No posts available.</p>
        )
      }
      
    </section>
  )
}

export default Feed
