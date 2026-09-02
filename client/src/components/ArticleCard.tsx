import React from 'react';
import { Article } from '../types/news';
import { ExternalLink, ThumbsUp, ThumbsDown, Lock, Unlock } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  index: number;
  ratingState?: 'up' | 'down' | null;
  onRate: (articleUrl: string, matchedTopics: string[], rating: 'up' | 'down') => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  index,
  ratingState,
  onRate,
}) => {
  const formattedIndex = String(index + 1).padStart(2, '0');
  
  const pubDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <article className="article-card">
      <div className="card-top-row">
        <span className="article-number">{formattedIndex}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {article.isPaywalled ? (
            <span className="topic-badge" style={{ borderColor: 'rgba(244, 63, 94, 0.4)', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.08)' }}>
              <Lock size={10} style={{ display: 'inline', marginRight: '3px' }} /> Subscription
            </span>
          ) : (
            <span className="topic-badge" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981', background: 'rgba(16, 185, 129, 0.08)' }}>
              <Unlock size={10} style={{ display: 'inline', marginRight: '3px' }} /> Open Access
            </span>
          )}
          <span className="topic-badge">{article.topic}</span>
        </div>
      </div>

      <h2 className="article-headline">{article.title}</h2>

      <div className="article-meta">
        <span className="meta-source">{article.source?.name}</span>
        {pubDate && <span className="meta-dot">•</span>}
        {pubDate && <span>{pubDate}</span>}
      </div>

      <p className="article-description">{article.description}</p>

      <div className="relevance-box">
        <strong>Why this is relevant to you: </strong>
        {article.relevanceExplanation}
      </div>

      <div className="card-footer">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="read-link"
        >
          Read full article <ExternalLink size={14} />
        </a>

        <div className="feedback-buttons">
          <button
            type="button"
            className={`feedback-btn ${ratingState === 'up' ? 'rated-up' : ''}`}
            onClick={() => onRate(article.url, article.matchedTopics, 'up')}
            title="Mark as relevant (+0.12 weight for matched topics)"
          >
            <ThumbsUp size={14} /> 👍 Relevant
          </button>
          
          <button
            type="button"
            className={`feedback-btn ${ratingState === 'down' ? 'rated-down' : ''}`}
            onClick={() => onRate(article.url, article.matchedTopics, 'down')}
            title="Mark as not for me (-0.12 weight for matched topics)"
          >
            <ThumbsDown size={14} /> 👎 Not for me
          </button>
        </div>
      </div>
    </article>
  );
};
