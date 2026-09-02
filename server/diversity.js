/**
 * Applies a topic cap to prevent a single dominant topic from taking all top 5 slots
 */
export function applyDiversityFilter(rankedArticles = [], maxPerTopic = 2, targetCount = 5) {
  if (rankedArticles.length <= targetCount) {
    return rankedArticles;
  }

  const selected = [];
  const topicCounts = {};
  const overflow = [];

  for (const article of rankedArticles) {
    const topic = article.topic || "General";
    const currentCount = topicCounts[topic] || 0;

    if (currentCount < maxPerTopic && selected.length < targetCount) {
      selected.push(article);
      topicCounts[topic] = currentCount + 1;
    } else {
      overflow.push(article);
    }

    if (selected.length === targetCount) {
      break;
    }
  }

  // If we couldn't reach 5 articles due to strict topic cap, backfill from overflow candidates
  while (selected.length < targetCount && overflow.length > 0) {
    selected.push(overflow.shift());
  }

  return selected;
}
