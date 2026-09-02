import { useState, useEffect, useCallback } from 'react';
import { usePersonalization } from './hooks/usePersonalization';
import { newsService } from './services/newsService';
import { Article } from './types/news';
import { Onboarding } from './components/Onboarding';
import { BriefingHeader } from './components/BriefingHeader';
import { ArticleCard } from './components/ArticleCard';
import { ErrorScreen } from './components/ErrorScreen';
import { ResetConfirmModal } from './components/ResetConfirmModal';

export function App() {
  const {
    preferences,
    hasOnboarded,
    saveInterests,
    recordFeedback,
    resetPersonalization,
    ratedUrls,
  } = usePersonalization();

  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const fetchRecommendations = useCallback(async (bypassCache: boolean = false) => {
    if (!preferences.explicitTopics.length && !preferences.freeTextInterests.length) {
      return;
    }

    setLoading(true);
    setError(null);
    setErrorCode(undefined);

    try {
      const response = await newsService.getRecentArticles(
        preferences.explicitTopics,
        preferences.freeTextInterests,
        preferences.topicWeights,
        ratedUrls,
        bypassCache
      );

      setArticles(response.articles || []);
      setLastRefreshed(response.cachedAt || new Date().toISOString());
    } catch (err: any) {
      console.error('Error in news fetch:', err);
      setError(err);
      setErrorCode(err.code);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [
    preferences.explicitTopics,
    preferences.freeTextInterests,
    preferences.topicWeights,
    ratedUrls,
  ]);

  // Fetch articles on initial onboard completion or interest update
  useEffect(() => {
    if (hasOnboarded && !isEditingInterests) {
      fetchRecommendations(false);
    }
  }, [hasOnboarded, isEditingInterests]);

  const handleOnboardingComplete = (explicit: string[], freeText: string[]) => {
    saveInterests(explicit, freeText);
    setIsEditingInterests(false);
  };

  const handleRating = (articleUrl: string, matchedTopics: string[], rating: 'up' | 'down') => {
    recordFeedback(articleUrl, matchedTopics, rating);
  };

  const handleConfirmReset = () => {
    resetPersonalization();
    setIsResetModalOpen(false);
    // Refresh recommendations with cleared weights
    setTimeout(() => {
      fetchRecommendations(true);
    }, 50);
  };

  if (!hasOnboarded || isEditingInterests) {
    return (
      <div className="app-container">
        <Onboarding
          initialExplicit={preferences.explicitTopics}
          initialFreeText={preferences.freeTextInterests}
          onComplete={handleOnboardingComplete}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <BriefingHeader
        explicitTopics={preferences.explicitTopics}
        freeTextInterests={preferences.freeTextInterests}
        lastRefreshed={lastRefreshed}
        isRefreshing={loading}
        onRefresh={() => fetchRecommendations(true)}
        onResetPersonalization={() => setIsResetModalOpen(true)}
        onEditPreferences={() => setIsEditingInterests(true)}
      />

      <main>
        {error ? (
          <ErrorScreen
            error={error}
            errorCode={errorCode}
            onRetry={() => fetchRecommendations(true)}
          />
        ) : loading && articles.length === 0 ? (
          <div className="articles-feed">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className="skeleton-card">
                <div className="skeleton-line" style={{ width: '20%', height: '14px' }} />
                <div className="skeleton-line" style={{ width: '85%', height: '28px' }} />
                <div className="skeleton-line" style={{ width: '40%', height: '16px' }} />
                <div className="skeleton-line" style={{ width: '100%', height: '48px' }} />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="error-card" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="error-title">No Relevant Articles Found</h2>
            <p className="error-message">
              No unread news matching your selected topics were found in the past 7 days. Try adding more broad topics or clicking refresh.
            </p>
            <button
              className="btn-primary"
              style={{ width: 'auto', display: 'inline-block' }}
              onClick={() => fetchRecommendations(true)}
            >
              Refresh News Pool
            </button>
          </div>
        ) : (
          <div className="articles-feed">
            {articles.map((article, idx) => {
              const rating = preferences.feedbackHistory.find(
                f => f.articleUrl === article.url
              )?.rating || null;

              return (
                <ArticleCard
                  key={article.id || article.url || idx}
                  article={article}
                  index={idx}
                  ratingState={rating}
                  onRate={handleRating}
                />
              );
            })}
          </div>
        )}
      </main>

      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
}
export default App;
