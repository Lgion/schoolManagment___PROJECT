import Head from 'next/head'
import BlogPost from './BlogPost'
import { useEffect, useState, useCallback, useMemo } from 'react';

const BLOG_NAME = "BOLOBI"

export default function BlogCategory({categoryPosts, headings, className="", onEdit, onDelete, isAdmin}) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    const storedPosts = localStorage.getItem('blogPosts');
    
    console.log("Stored posts from localStorage:", storedPosts);

    if (storedPosts) {
      try {
        const parsedPosts = JSON.parse(storedPosts);
        if (Array.isArray(parsedPosts) && parsedPosts.length > 0) {
          console.log("Using posts from localStorage");
          setPosts(parsedPosts);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Erreur lors de la lecture du localStorage:', error);
      }
    }

    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      console.log("Fetched posts from API:", data);
      
      if (Array.isArray(data)) {
        setPosts(data);
        localStorage.setItem('blogPosts', JSON.stringify(data));
      } else {
        console.error('Les données reçues ne sont pas un tableau:', data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (categoryPosts && Array.isArray(categoryPosts)) {
      setPosts(categoryPosts);
      setIsLoading(false);
    } else {
      fetchPosts();
    }
  }, [categoryPosts, fetchPosts]);

  return (
    <>
      <div className="blog_category_header">
        <h3>{headings.h3}</h3>
        <p>{headings.subtitle}</p>
      </div>
      <div className="blog_category_posts blog-grid">
        {isLoading ? (
          <div>Chargement...</div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.slug} className="blog-post-container">
              <BlogPost
                title={post.title}
                coverImage={post.coverImage}
                date={post.date}
                author={post.author}
                slug={post.slug}
                excerpt={post.excerpt}
                category={post.category}
              />
              {isAdmin && <div className="blog-post-actions">
                <button
                  onClick={() => onEdit(post)}
                  className="edit-btn"
                >
                  Modifier
                </button>
                <button
                  onClick={() => onDelete(post.slug)}
                  className="delete-btn"
                >
                  Supprimer
                </button>
              </div>}
            </div>
          ))
        ) : (
          <div>Aucun article disponible</div>
        )}
      </div>
    </>
  )
}
