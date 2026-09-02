/**
 * Normalizes title string by lowercasing, removing punctuation, and stripping common noise words
 */
function normalizeTitle(title = "") {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .replace(/\b(the|a|an|and|or|in|on|at|to|for|of|with|by|about|is|are|was|were)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates Jaccard similarity between word token sets of two titles
 */
function titleSimilarity(titleA, titleB) {
  const normA = normalizeTitle(titleA);
  const normB = normalizeTitle(titleB);

  if (normA === normB) return 1.0;

  const setA = new Set(normA.split(" ").filter(w => w.length > 2));
  const setB = new Set(normB.split(" ").filter(w => w.length > 2));

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionCount = 0;
  setA.forEach(token => {
    if (setB.has(token)) intersectionCount++;
  });

  const unionSize = new Set([...setA, ...setB]).size;
  return intersectionCount / unionSize;
}

/**
 * Deduplicates articles by retaining the single highest-scoring representative article per event cluster
 */
export function deduplicateArticles(articles = [], similarityThreshold = 0.45) {
  const uniqueArticles = [];

  for (const article of articles) {
    if (!article.title) continue;

    let isDuplicate = false;
    for (const existing of uniqueArticles) {
      const sim = titleSimilarity(article.title, existing.title);
      if (sim >= similarityThreshold) {
        isDuplicate = true;
        // If the new article scored higher than the existing representative, swap them
        if (article.rawScore > existing.rawScore) {
          const index = uniqueArticles.indexOf(existing);
          uniqueArticles[index] = article;
        }
        break;
      }
    }

    if (!isDuplicate) {
      uniqueArticles.push(article);
    }
  }

  return uniqueArticles;
}
