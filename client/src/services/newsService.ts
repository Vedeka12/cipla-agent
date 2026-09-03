import { Article, NewsApiResponse } from '../types/news';

export const newsService = {
  /**
   * Fetches top 5 personalized news articles based on user preferences and weights
   */
  async getRecentArticles(
    explicitTopics: string[],
    freeTextInterests: string[],
    topicWeights: Record<string, number>,
    excludeUrls: string[],
    marketRegion: 'global' | 'india' = 'global',
    bypassCache: boolean = false
  ): Promise<NewsApiResponse> {
    const response = await fetch('/api/news', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        explicitTopics,
        freeTextInterests,
        topicWeights,
        excludeUrls,
        marketRegion,
        bypassCache,
      }),
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      const error = new Error(text.includes('Add your NewsAPI key') ? text : `Server Error (${response.status}): Could not parse response.`);
      (error as any).code = text.includes('MISSING_API_KEY') ? 'MISSING_API_KEY' : 'SERVER_ERROR';
      (error as any).status = response.status;
      throw error;
    }

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMsg = data.error || `Server HTTP ${response.status}`;
      const error = new Error(errorMsg);
      (error as any).code = data.code || 'API_ERROR';
      (error as any).status = response.status;
      throw error;
    }

    return data as NewsApiResponse;
  },
};
