"use client";

import Link from 'next/link';
import { roleBadge, statusMeta, formatDate } from './blogApi';
import { excerpt } from './markdown';

/**
 * Carte d'article pour la grille du portail.
 * Props : { article, showStatus }
 */
export default function ArticleCard({ article, showStatus = false }) {
  const badge = roleBadge(article.authorRole);
  const sm = statusMeta(article.status);
  return (
    <Link href={`/blog/${article._id}`} className="articleCard">
      <div className="articleCard__cover">
        {article.coverImage ? (
          <img src={article.coverImage} alt="" loading="lazy" />
        ) : (
          <span className="articleCard__cover-placeholder">📰</span>
        )}
        {showStatus && (
          <span className="articleCard__status" style={{ '--status-color': sm.color }}>{sm.icon} {sm.label}</span>
        )}
      </div>
      <div className="articleCard__body">
        <h3 className="articleCard__title">{article.title}</h3>
        <p className="articleCard__excerpt">{excerpt(article.content, 120)}</p>
        {article.tags?.length > 0 && (
          <div className="articleCard__tags">
            {article.tags.slice(0, 3).map((t) => <span key={t} className="articleCard__tag">{t}</span>)}
          </div>
        )}
        <div className="articleCard__footer">
          <span className="articleCard__author">{badge.icon} {article.authorName || 'Anonyme'}</span>
          {article.publishedAt && <span className="articleCard__date">{formatDate(article.publishedAt)}</span>}
        </div>
      </div>
    </Link>
  );
}
