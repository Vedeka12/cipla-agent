export interface Article {
  id: string;
  title: string;
  description: string;
  source: {
    name: string;
  };
  publishedAt: string;
  url: string;
  imageUrl: string | null;
  topic: string;
  matchedTopics: string[];
  relevanceExplanation: string;
  isPaywalled?: boolean;
  rawScore: number;
  scoreBreakdown?: {
    interestRelevance: number;
    learnedPreference: number;
    recency: number;
    importance: number;
    sourceQuality: number;
    finalScore: number;
  };
}

export interface UserPreferences {
  explicitTopics: string[];
  freeTextInterests: string[];
  topicWeights: Record<string, number>;
  marketRegion: 'global' | 'india';
  feedbackHistory: FeedbackItem[];
}

export interface FeedbackItem {
  articleUrl: string;
  matchedTopics: string[];
  rating: 'up' | 'down';
  timestamp: number;
}

export interface NewsApiResponse {
  success: boolean;
  articles: Article[];
  cached: boolean;
  cachedAt: string;
  candidateCount: number;
  unratedCandidateCount: number;
  returnedCount: number;
  userInterests: string[];
  error?: string;
  code?: string;
}
