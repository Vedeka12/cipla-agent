import { useState, useEffect } from 'react';
import { UserPreferences, FeedbackItem } from '../types/news';

const STORAGE_KEY = 'my5_user_preferences_v1';

const DEFAULT_PREFERENCES: UserPreferences = {
  explicitTopics: [],
  freeTextInterests: [],
  topicWeights: {},
  feedbackHistory: [],
};

export function usePersonalization() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load preferences from localStorage:', e);
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.error('Failed to save preferences to localStorage:', e);
    }
  }, [preferences]);

  // Saves explicit topics & free text interests
  const saveInterests = (explicitTopics: string[], freeTextInterests: string[]) => {
    setPreferences(prev => {
      // Ensure all selected topics have an initial weight of 1.0 if not already present
      const newWeights = { ...prev.topicWeights };
      [...explicitTopics, ...freeTextInterests].forEach(topic => {
        if (newWeights[topic] === undefined) {
          newWeights[topic] = 1.0;
        }
      });

      return {
        ...prev,
        explicitTopics,
        freeTextInterests,
        topicWeights: newWeights,
      };
    });
  };

  // Handles 👍 and 👎 feedback on an article
  const recordFeedback = (articleUrl: string, matchedTopics: string[], rating: 'up' | 'down') => {
    setPreferences(prev => {
      const delta = rating === 'up' ? 0.12 : -0.12;
      const updatedWeights = { ...prev.topicWeights };

      // Update matched topic weights
      matchedTopics.forEach(topic => {
        const currentWeight = updatedWeights[topic] ?? 1.0;
        const newWeight = Math.max(0.25, Math.min(2.0, currentWeight + delta));
        updatedWeights[topic] = Number(newWeight.toFixed(2));
      });

      const newFeedbackItem: FeedbackItem = {
        articleUrl,
        matchedTopics,
        rating,
        timestamp: Date.now(),
      };

      // Exclude duplicate feedback entries for same articleUrl
      const filteredHistory = prev.feedbackHistory.filter(f => f.articleUrl !== articleUrl);

      return {
        ...prev,
        topicWeights: updatedWeights,
        feedbackHistory: [newFeedbackItem, ...filteredHistory],
      };
    });
  };

  // Resets personalization weights & feedback history
  const resetPersonalization = () => {
    setPreferences(prev => {
      // Reset all topic weights back to 1.0
      const resetWeights: Record<string, number> = {};
      [...prev.explicitTopics, ...prev.freeTextInterests].forEach(t => {
        resetWeights[t] = 1.0;
      });

      return {
        ...prev,
        topicWeights: resetWeights,
        feedbackHistory: [],
      };
    });
  };

  // Complete reset to onboarding
  const resetAll = () => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem(STORAGE_KEY);
  };

  const ratedUrls = preferences.feedbackHistory.map(f => f.articleUrl);

  return {
    preferences,
    hasOnboarded: preferences.explicitTopics.length > 0 || preferences.freeTextInterests.length > 0,
    saveInterests,
    recordFeedback,
    resetPersonalization,
    resetAll,
    ratedUrls,
  };
}
