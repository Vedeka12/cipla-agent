import { TOPIC_EXPANSION_MAP, getExpandedKeywords } from "./topicExpansion.js";

// High-significance business terms for importance heuristic
const HIGH_IMPORTANCE_TERMS = [
  "acquisition", "merger", "earnings", "launch", "regulation", "investment",
  "funding", "ipo", "layoffs", "partnership", "policy", "expansion",
  "restructuring", "tariff", "interest rates", "gdp", "quarterly", "revenue",
  "profit", "valuation", "antitrust", "lawsuit", "sanction", "bipartisan"
];

// Tiered source quality scoring table (MVP heuristic)
const TIER1_SOURCES = [
  "reuters", "bloomberg", "financial times", "the wall street journal", "wsj",
  "techcrunch", "the verge", "forbes", "cnbc", "harvard business review", "hbr",
  "bbc news", "ars technica", "wired", "associated press", "ap news",
  "the new york times", "nyt", "fortune", "economist", "business insider",
  "nikkei asia", "barron's", "marketwatch"
];

function calculateInterestRelevance(text, explicitTopics, freeTextInterests) {
  const lowerText = text.toLowerCase();
  let matchedTopics = new Set();
  let matchedCustom = new Set();

  // Check explicit topics & expanded keywords
  explicitTopics.forEach(topic => {
    const topicLower = topic.toLowerCase();
    if (lowerText.includes(topicLower)) {
      matchedTopics.add(topic);
    } else {
      const expanded = TOPIC_EXPANSION_MAP[topic] || [];
      const hasExpandedMatch = expanded.some(kw => lowerText.includes(kw.toLowerCase()));
      if (hasExpandedMatch) {
        matchedTopics.add(topic);
      }
    }
  });

  // Check free text interests
  freeTextInterests.forEach(custom => {
    if (!custom) return;
    const clean = custom.trim().toLowerCase();
    if (lowerText.includes(clean)) {
      matchedCustom.add(custom.trim());
    } else {
      // Split words >3 chars
      const parts = clean.split(/\s+/).filter(w => w.length > 3);
      if (parts.some(p => lowerText.includes(p))) {
        matchedCustom.add(custom.trim());
      }
    }
  });

  const allSelectedCount = explicitTopics.length + freeTextInterests.length;
  const totalMatchesCount = matchedTopics.size + matchedCustom.size;

  if (allSelectedCount === 0) return { score: 0.5, matchedTopics: [], matchedCustom: [] };

  // Calculate score normalized between 0.0 and 1.0
  const matchRatio = totalMatchesCount / Math.max(1, allSelectedCount);
  // Cap at 1.0
  const score = Math.min(1.0, matchRatio > 0 ? 0.3 + 0.7 * matchRatio : 0.1);

  return {
    score,
    matchedTopics: Array.from(matchedTopics),
    matchedCustom: Array.from(matchedCustom)
  };
}

function calculateLearnedPreference(matchedTopics, matchedCustom, topicWeights = {}) {
  if (matchedTopics.length === 0 && matchedCustom.length === 0) return 0.5;

  let totalWeight = 0;
  let count = 0;

  [...matchedTopics, ...matchedCustom].forEach(topic => {
    const weight = topicWeights[topic] ?? topicWeights[topic.toLowerCase()] ?? 1.0;
    totalWeight += weight;
    count++;
  });

  const avgWeight = totalWeight / count;
  // Weight ranges from 0.25 to 2.0. Map [0.25, 2.0] linearly to score [0.0, 1.0]
  const score = Math.max(0.0, Math.min(1.0, (avgWeight - 0.25) / 1.75));
  return score;
}

function calculateRecency(publishedAt) {
  if (!publishedAt) return 0.5;
  const pubTime = new Date(publishedAt).getTime();
  const now = Date.now();
  const diffHours = (now - pubTime) / (1000 * 3600);
  
  const windowHours = 7 * 24; // 7 days
  const score = Math.max(0.0, 1.0 - (diffHours / windowHours));
  return score;
}

function calculateImportance(text) {
  const lowerText = text.toLowerCase();
  const matchedSignals = HIGH_IMPORTANCE_TERMS.filter(term => lowerText.includes(term));
  
  if (matchedSignals.length === 0) return { score: 0.2, signals: [] };
  if (matchedSignals.length === 1) return { score: 0.6, signals: matchedSignals };
  return { score: 1.0, signals: matchedSignals };
}

function calculateSourceQuality(sourceName = "") {
  const cleanSource = sourceName.toLowerCase().trim();
  if (TIER1_SOURCES.some(t1 => cleanSource.includes(t1))) {
    return 1.0;
  }
  if (cleanSource.length > 0) {
    return 0.7;
  }
  return 0.4;
}

/**
 * Deterministically constructs a user-facing explanation for recommendation relevance
 */
function generateRelevanceExplanation(matchedTopics, matchedCustom, signals) {
  const allMatched = [...matchedTopics, ...matchedCustom];

  if (allMatched.length >= 2) {
    return `Recommended because this story relates to ${allMatched[0]} and ${allMatched[1]}, two of your selected interests.`;
  }
  
  if (allMatched.length === 1) {
    if (signals.length > 0) {
      return `Recommended because this story covers a key ${signals[0]} in ${allMatched[0]}.`;
    }
    return `Recommended because this story directly aligns with your interest in ${allMatched[0]}.`;
  }

  if (signals.length > 0) {
    return `Recommended because it highlights a major industry ${signals[0]} from the past week.`;
  }

  return `Recommended based on weekly industry relevance and source coverage.`;
}

/**
 * Ranks candidates using explainable 5-factor scoring model
 */
export function rankArticles(articles = [], explicitTopics = [], freeTextInterests = [], topicWeights = {}) {
  return articles.map(article => {
    const fullText = `${article.title || ""} ${article.description || ""}`;
    
    // Factor 1: Interest Relevance (40%)
    const { score: interestScore, matchedTopics, matchedCustom } = calculateInterestRelevance(
      fullText,
      explicitTopics,
      freeTextInterests
    );

    // Factor 2: Learned Preference (20%)
    const preferenceScore = calculateLearnedPreference(matchedTopics, matchedCustom, topicWeights);

    // Factor 3: Recency (15%)
    const recencyScore = calculateRecency(article.publishedAt);

    // Factor 4: Importance Heuristic (15%)
    const { score: importanceScore, signals } = calculateImportance(fullText);

    // Factor 5: Source Quality (10%)
    const sourceQualityScore = calculateSourceQuality(article.source?.name);

    // Final weighted score
    const finalScore = 
      (interestScore * 0.40) +
      (preferenceScore * 0.20) +
      (recencyScore * 0.15) +
      (importanceScore * 0.15) +
      (sourceQualityScore * 0.10);

    const primaryTopic = matchedTopics[0] || matchedCustom[0] || "Industry News";
    const relevanceExplanation = generateRelevanceExplanation(matchedTopics, matchedCustom, signals);

    return {
      ...article,
      topic: primaryTopic,
      matchedTopics: [...matchedTopics, ...matchedCustom],
      relevanceExplanation,
      rawScore: finalScore,
      scoreBreakdown: {
        interestRelevance: Math.round(interestScore * 100),
        learnedPreference: Math.round(preferenceScore * 100),
        recency: Math.round(recencyScore * 100),
        importance: Math.round(importanceScore * 100),
        sourceQuality: Math.round(sourceQualityScore * 100),
        finalScore: Math.round(finalScore * 100)
      }
    };
  }).sort((a, b) => b.rawScore - a.rawScore);
}
