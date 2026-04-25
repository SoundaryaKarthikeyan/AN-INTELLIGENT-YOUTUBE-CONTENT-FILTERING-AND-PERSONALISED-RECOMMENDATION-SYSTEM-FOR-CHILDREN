export const getSafeRecommendations = (allVideos: any[], watchHistory: any[], ageGroup: string) => {
  const interests: Record<string, number> = {};
  
  // 1. Map interests from the enriched history
  watchHistory.forEach(h => {
    const t = String(h.topic || "general").toLowerCase().trim();
    interests[t] = (interests[t] || 0) + 1;
  });

  return allVideos
    .filter(v => String(v.age_group) === String(ageGroup))
    .map(v => {
      const topic = String(v.topic || "general").toLowerCase().trim();
      
      // Calculate Score Features
      const affinity = (interests[topic] || 0) * 15; // The "Learning" boost
      const quality = (1 - (v.risk_score || 0)) * 2; // Safety bias
      const base = 2.0;                              // Novelty base
      const jitter = (v.docId.charCodeAt(0) % 10) / 10; 

      const total = affinity + quality + base + jitter;

      return {
        ...v,
        recommendationScore: parseFloat(total.toFixed(2)),
        logicTrace: `Aff:${affinity} Qual:${quality}`
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
};