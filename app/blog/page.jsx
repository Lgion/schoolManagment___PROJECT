"use client"

import BlogPortal from '../components/blog/BlogPortal'

export default function BlogPage() {
  return (
    <div className="blog-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>📰 Le journal de l'école</h1>
        <p style={{ color: '#7f8c8d', fontSize: '1.05rem' }}>
          Articles rédigés par les élèves, parents, professeurs et l'administration.
          Les contributions des familles sont relues avant publication.
        </p>
      </div>
      <BlogPortal />
    </div>
  )
}
