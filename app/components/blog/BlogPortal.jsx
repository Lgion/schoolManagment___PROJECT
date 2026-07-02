"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ArticleCard from './ArticleCard';
import { fetchArticles, AUTHOR_ROLE_BADGE } from './blogApi';
import { useUserRole } from '../../../stores/useUserRole';

const WRITER_ROLES = ['admin', 'prof', 'eleve', 'parent'];

export default function BlogPortal() {
  const { userRole } = useUserRole();
  const isStaff = userRole === 'admin' || userRole === 'prof';
  const canWrite = WRITER_ROLES.includes(userRole);

  const [tab, setTab] = useState('published');
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchArticles({
        view: tab,
        q: tab === 'published' ? q : undefined,
        role: tab === 'published' ? roleFilter : undefined,
      });
      setArticles(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [tab, q, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const tabs = [
    { key: 'published', label: '📰 Articles' },
    ...(canWrite ? [{ key: 'mine', label: '✍️ Mes publications' }] : []),
    ...(isStaff ? [{ key: 'pending', label: '🛡️ Modération' }] : []),
  ];

  return (
    <div className="blog">
      <div className="blog__bar">
        <div className="blog__tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`blog__tab ${tab === t.key ? 'is-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {canWrite && (
          <Link href="/blog/edit/new" className="blog__write">✍️ Rédiger un article</Link>
        )}
      </div>

      {tab === 'published' && (
        <div className="blog__filters">
          <input
            type="search"
            className="blog__search"
            placeholder="Rechercher un titre…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="blog__roleFilter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Tous les auteurs</option>
            {Object.entries(AUTHOR_ROLE_BADGE).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="blog__error">{error}</p>}

      {loading ? (
        <p className="blog__hint">Chargement…</p>
      ) : articles.length === 0 ? (
        <p className="blog__hint">
          {tab === 'pending' ? 'Aucun article à modérer.' : tab === 'mine' ? 'Vous n’avez pas encore d’article.' : 'Aucun article publié pour le moment.'}
        </p>
      ) : (
        <div className="blog__grid">
          {articles.map((a) => (
            <ArticleCard key={a._id} article={a} showStatus={tab !== 'published'} />
          ))}
        </div>
      )}
    </div>
  );
}
