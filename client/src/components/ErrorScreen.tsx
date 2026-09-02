import React from 'react';
import { AlertCircle, RefreshCw, Key } from 'lucide-react';

interface ErrorScreenProps {
  error: Error | null;
  errorCode?: string;
  onRetry: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ error, errorCode, onRetry }) => {
  const isMissingKey = errorCode === 'MISSING_API_KEY' || error?.message.includes('server/.env');

  return (
    <div className="error-card">
      <div className="error-icon">
        {isMissingKey ? <Key size={40} color="#f43f5e" /> : <AlertCircle size={40} color="#f43f5e" />}
      </div>

      <h2 className="error-title">
        {isMissingKey ? 'NewsAPI Key Required' : 'Unable to Retrieve Live News'}
      </h2>

      <p className="error-message">
        {isMissingKey ? (
          <>
            My5 fetches real live news directly via NewsAPI.org. To activate recommendations, please add your NewsAPI developer key to the backend environment file.
          </>
        ) : (
          error?.message || 'An error occurred while fetching news candidates from the server.'
        )}
      </p>

      {isMissingKey && (
        <div className="error-code-box">
          <code>Add your NewsAPI key to server/.env as NEWS_API_KEY=your_key_here</code>
        </div>
      )}

      <button className="btn-primary" style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }} onClick={onRetry}>
        <RefreshCw size={16} /> Retry News Retrieval
      </button>
    </div>
  );
};
