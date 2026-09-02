import dotenv from "dotenv";
import { getExpandedKeywords } from "./topicExpansion.js";

dotenv.config();

/**
 * Fetches real news candidate articles from NewsAPI.org
 */
export async function fetchNewsFromApi(explicitTopics = [], freeTextInterests = [], marketRegion = "global") {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_key_here") {
    const error = new Error("Add your NewsAPI key to server/.env as NEWS_API_KEY=...");
    error.statusCode = 500;
    error.code = "MISSING_API_KEY";
    throw error;
  }

  // Construct search query from explicit topics & free text interests
  const expandedKeywords = getExpandedKeywords(explicitTopics, freeTextInterests);
  if (marketRegion === "india") {
    expandedKeywords.unshift("India");
  }
  
  let searchQuery = "";
  if (expandedKeywords.length > 0) {
    // Pick top keywords or combine with OR
    const topTerms = expandedKeywords.slice(0, 8).map(term => `"${term}"`);
    searchQuery = topTerms.join(" OR ");
  } else {
    searchQuery = marketRegion === "india" ? "India business OR India market" : "business OR technology OR market OR strategy";
  }


  // Calculate past 7 days date
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fromDate = sevenDaysAgo.toISOString().split("T")[0];

  const params = new URLSearchParams({
    q: searchQuery,
    from: fromDate,
    language: "en",
    sortBy: "relevance",
    pageSize: "60",
    apiKey: apiKey.trim()
  });

  const url = `https://newsapi.org/v2/everything?${params.toString()}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.status === "error") {
      const errorMsg = data.message || `NewsAPI HTTP ${response.status}`;
      const error = new Error(`NewsAPI Error: ${errorMsg}`);
      error.statusCode = response.status || 500;
      error.code = data.code || "NEWS_API_FAILURE";
      throw error;
    }

    if (!data.articles || !Array.isArray(data.articles)) {
      return [];
    }

    // Normalize raw articles, filtering out removed articles or blank titles
    const normalized = data.articles
      .filter(a => a.title && a.title !== "[Removed]" && a.url)
      .map(a => ({
        id: bufferId(a.url),
        title: a.title,
        description: a.description || "No article description provided by publisher.",
        source: {
          name: a.source?.name || "News Outlet"
        },
        publishedAt: a.publishedAt || new Date().toISOString(),
        url: a.url,
        imageUrl: a.urlToImage || null
      }));

    return normalized;
  } catch (err) {
    if (err.code === "MISSING_API_KEY" || err.code === "NEWS_API_FAILURE") {
      throw err;
    }
    const networkErr = new Error(`Failed to reach NewsAPI: ${err.message}`);
    networkErr.statusCode = 503;
    networkErr.code = "NETWORK_FAILURE";
    throw networkErr;
  }
}

function bufferId(urlStr) {
  let hash = 0;
  for (let i = 0; i < urlStr.length; i++) {
    hash = ((hash << 5) - hash) + urlStr.charCodeAt(i);
    hash |= 0;
  }
  return `art_${Math.abs(hash)}`;
}
