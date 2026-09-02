// Topic expansion map for broadening keyword candidate matching
export const TOPIC_EXPANSION_MAP = {
  "Marketing": [
    "branding", "advertising", "campaign", "consumer behavior", "customer acquisition",
    "digital marketing", "FMCG", "brand strategy", "CMO", "marketing strategy", "adtech", "growth marketing"
  ],
  "Consulting": [
    "strategy", "merger", "acquisition", "industry", "regulation", "market",
    "restructuring", "transformation", "supply chain", "private equity", "management consulting", "advisory"
  ],
  "Product Management": [
    "product launch", "product strategy", "platform", "user experience", "monetization",
    "feature", "SaaS", "AI product", "technology product", "roadmap", "UX", "product design"
  ],
  "AI": [
    "artificial intelligence", "LLM", "generative AI", "agents", "machine learning",
    "OpenAI", "Anthropic", "Gemini", "DeepMind", "neural network", "ChatGPT", "foundation models"
  ],
  "Technology": [
    "tech", "software", "cloud", "cybersecurity", "enterprise", "hardware",
    "digital", "innovation", "cloud computing", "big tech", "IT sector"
  ],
  "Startups": [
    "venture capital", "seed round", "startup", "founder", "valuation",
    "pitch", "Y Combinator", "funding", "Series A", "unicorn", "angel investor"
  ],
  "Finance": [
    "banking", "investment", "Wall Street", "stocks", "federal reserve",
    "inflation", "capital", "equity", "debt", "fintech", "interest rates", "hedge fund"
  ],
  "Consumer": [
    "retail", "e-commerce", "consumer goods", "DTC", "brand",
    "shopping", "customer experience", "FMCG", "retail tech", "consumer trends"
  ],
  "Automotive": [
    "EV", "electric vehicle", "Tesla", "automaker", "automotive",
    "autonomous driving", "OEMs", "car", "battery", "self-driving", "mobility"
  ],
  "Semiconductors": [
    "chips", "semiconductor", "foundry", "TSMC", "Nvidia",
    "Qualcomm", "NXP", "Intel", "AMD", "microchips", "silicon", "ASML"
  ],
  "Healthcare": [
    "pharma", "biotech", "medical", "clinical trials", "FDA",
    "health tech", "therapeutics", "healthcare", "pharmaceuticals", "drug discovery"
  ],
  "Strategy": [
    "competitive advantage", "market entry", "corporate strategy", "M&A",
    "business model", "growth", "strategic planning", "market expansion", "diversification"
  ],
  "Economy": [
    "GDP", "interest rates", "inflation", "macroeconomics", "trade",
    "central bank", "recession", "labor market", "Federal Reserve", "economic growth"
  ]
};

/**
 * Expands a list of user selected topics & custom free-text interests into a list of keywords for search & scoring
 */
export function getExpandedKeywords(explicitTopics = [], freeTextInterests = []) {
  const keywords = new Set();
  
  // Add explicit topics & their expansions
  explicitTopics.forEach(topic => {
    keywords.add(topic.toLowerCase());
    const expanded = TOPIC_EXPANSION_MAP[topic];
    if (expanded) {
      expanded.forEach(kw => keywords.add(kw.toLowerCase()));
    }
  });

  // Add free text interests directly
  freeTextInterests.forEach(custom => {
    if (custom && custom.trim()) {
      const cleanCustom = custom.trim().toLowerCase();
      keywords.add(cleanCustom);
      // Split multi-word custom interests to also include individual words if >3 chars
      const parts = cleanCustom.split(/\s+/).filter(w => w.length > 3);
      parts.forEach(p => keywords.add(p));
    }
  });

  return Array.from(keywords);
}
