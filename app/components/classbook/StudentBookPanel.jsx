'use client';

import React, { useState, useEffect } from 'react';

export default function StudentBookPanel({ studentId }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBooks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/students/${studentId}/books`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de chargement');
      setBooks(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) loadBooks();
  }, [studentId]);

  if (loading) return <div className="sb-loading">Chargement de vos albums souvenirs...</div>;
  if (error) return <div className="sb-error">⚠️ Erreur: {error}</div>;

  return (
    <div className="student-book-panel">
      {books.length === 0 ? (
        <div className="sb-empty-state">
          <div className="sb-empty-icon">📖</div>
          <h3>Aucun album photo souvenir disponible</h3>
          <p>
            Les albums de classe personnalisés (yearbooks) ne sont pas encore publiés pour cette année. 
            Dès que votre enseignant aura terminé la mise en page et validé les publications, 
            votre livre souvenir apparaîtra ici !
          </p>
        </div>
      ) : (
        <div className="sb-grid">
          {books.map((book) => {
            const cb = book.classBookId || {};
            const classe = cb.classId || {};
            const coverUrl = cb.coverImage || '/school/classe.webp';
            
            return (
              <div key={book._id} className="sb-card">
                <div className="sb-card-img-wrapper">
                  <img 
                    src={coverUrl} 
                    alt={cb.title || 'Livre souvenir'} 
                    onError={(e) => { e.target.src = '/school/classe.webp' }}
                  />
                  <div className="sb-card-year-badge">
                    {cb.schoolYear}
                  </div>
                </div>

                <div className="sb-card-content">
                  <h4 className="sb-card-title">{cb.title || 'Livre souvenir'}</h4>
                  <p className="sb-card-class">
                    🏫 Classe : <strong>{classe.niveau || ''} {classe.alias || ''}</strong>
                  </p>
                  
                  <div className="sb-card-actions">
                    <a 
                      href={book.personalizedPdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="sb-btn sb-btn-primary"
                    >
                      👁️ Ouvrir le PDF
                    </a>
                    <a 
                      href={book.personalizedPdfUrl} 
                      download 
                      className="sb-btn sb-btn-secondary"
                    >
                      📥 Télécharger
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Styles Premium Scopés */}
      <style jsx>{`
        .student-book-panel {
          font-family: 'Outfit', 'Inter', sans-serif;
          color: #334155;
          margin-top: 1rem;
        }
        .sb-loading {
          padding: 2rem;
          text-align: center;
          color: #64748b;
          font-weight: 500;
        }
        .sb-error {
          padding: 1rem;
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 8px;
          border: 1px solid #fee2e2;
          font-weight: 500;
        }
        .sb-empty-state {
          text-align: center;
          padding: 3rem 1.5rem;
          background: #f8fafc;
          border-radius: 16px;
          border: 2px dashed #cbd5e1;
          max-width: 500px;
          margin: 1rem auto;
        }
        .sb-empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .sb-empty-state h3 {
          margin: 0 0 0.5rem 0;
          color: #1e293b;
          font-size: 1.15rem;
          font-weight: 700;
        }
        .sb-empty-state p {
          margin: 0;
          font-size: 0.875rem;
          color: #64748b;
          line-height: 1.5;
        }
        
        .sb-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .sb-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
          border: 1px solid #e2e8f0;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .sb-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.1);
        }
        .sb-card-img-wrapper {
          position: relative;
          width: 100%;
          height: 160px;
          background: #f1f5f9;
        }
        .sb-card-img-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .sb-card-year-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: #1e3a8a;
          color: white;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .sb-card-content {
          padding: 1.25rem;
        }
        .sb-card-title {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
        }
        .sb-card-class {
          margin: 0 0 1.25rem 0;
          font-size: 0.85rem;
          color: #64748b;
        }
        .sb-card-actions {
          display: flex;
          gap: 0.75rem;
        }
        .sb-btn {
          flex: 1;
          padding: 0.55rem 0.75rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.8rem;
          text-align: center;
          cursor: pointer;
          text-decoration: none;
          transition: background-color 0.2s;
        }
        .sb-btn-primary {
          background-color: #1e3a8a;
          color: white;
          border: none;
        }
        .sb-btn-primary:hover {
          background-color: #172554;
        }
        .sb-btn-secondary {
          background-color: #f1f5f9;
          color: #334155;
          border: 1px solid #e2e8f0;
        }
        .sb-btn-secondary:hover {
          background-color: #e2e8f0;
        }
      `}</style>
    </div>
  );
}
