import BlogPost from '../../components/_/Blog/BlogPost'

export default 
function BlogEnAvant({post}){


  return <>
    <div id="blog_container" className="container mx-auto px-5">
      <h2>ARTICLE DU BLOG DE BOLOBI</h2>
      {/* <h3>{headings?.h3 || ".....VALEUR PAR DÉFAUT....."}</h3> */}
      <BlogPost
        title={post.title}
        coverImage={post.coverImage}
        date={post.date}
        author={post.author}
        slug={post.slug}
        excerpt={post.excerpt}
      />
    </div>
  </>
}
