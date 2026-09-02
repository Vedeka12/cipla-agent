import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { newsCache } from "./cache.js";
import { fetchNewsFromApi } from "./newsService.js";
import { rankArticles } from "./rankingEngine.js";
import { deduplicateArticles } from "./deduplication.js";
import { applyDiversityFilter } from "./diversity.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Endpoint for My5 News Recommendations
app.post("/api/news", async (req, res) => {
  try {
    const {
      explicitTopics = [],
      freeTextInterests = [],
      topicWeights = {},
      excludeUrls = [],
      marketRegion = "global",
      bypassCache = false
    } = req.body || {};

    const cacheKey = newsCache.generateKey(explicitTopics, freeTextInterests, marketRegion);

    let candidateArticles = null;
    let isFromCache = false;
    let cachedAt = null;

    // Check 20-minute cache if bypassCache is not requested
    if (!bypassCache) {
      const cached = newsCache.get(cacheKey);
      if (cached) {
        candidateArticles = cached.data;
        isFromCache = true;
        cachedAt = cached.cachedAt;
      }
    }

    // If cache miss or refresh requested, fetch live news from NewsAPI
    if (!candidateArticles) {
      candidateArticles = await fetchNewsFromApi(explicitTopics, freeTextInterests, marketRegion);
      newsCache.set(cacheKey, candidateArticles);
      cachedAt = Date.now();
    }

    // Exclude articles already rated by the user
    const excludeSet = new Set((excludeUrls || []).map(u => u.trim()));
    const unratedCandidates = candidateArticles.filter(art => !excludeSet.has(art.url));

    // Rank candidates using 5-factor scoring model
    const rankedCandidates = rankArticles(
      unratedCandidates,
      explicitTopics,
      freeTextInterests,
      topicWeights,
      marketRegion
    );

    // Deduplicate top-scoring articles to avoid covering same event twice
    const deduplicated = deduplicateArticles(rankedCandidates, 0.45);

    // Apply topic diversity rule (max 2 per topic in top 5)
    const top5Articles = applyDiversityFilter(deduplicated, 2, 5);

    return res.json({
      success: true,
      articles: top5Articles,
      cached: isFromCache,
      cachedAt: cachedAt ? new Date(cachedAt).toISOString() : new Date().toISOString(),
      candidateCount: candidateArticles.length,
      unratedCandidateCount: unratedCandidates.length,
      returnedCount: top5Articles.length,
      userInterests: [...explicitTopics, ...freeTextInterests]
    });
  } catch (error) {
    console.error("Error serving /api/news:", error.message);
    
    // Pass clear setup instructions if API key is missing
    if (error.code === "MISSING_API_KEY") {
      return res.status(500).json({
        error: "Add your NewsAPI key to server/.env as NEWS_API_KEY=...",
        code: "MISSING_API_KEY"
      });
    }

    return res.status(error.statusCode || 500).json({
      error: error.message || "An unexpected error occurred while fetching news.",
      code: error.code || "SERVER_ERROR"
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  const hasKey = Boolean(process.env.NEWS_API_KEY && process.env.NEWS_API_KEY !== "your_key_here");
  res.json({
    status: "ok",
    apiKeyConfigured: hasKey,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`My5 Express Backend running on http://localhost:${PORT}`);
});
