import { useState, useEffect } from 'react';
import { httpClient } from '@/shared/lib/http';
import type { StaffRecommendationInsight } from '@x10think/types';

export function StaffRecommendationInsightsPage() {
  const [insights, setInsights] = useState<StaffRecommendationInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchStaffInsights();
  }, []);

  async function fetchStaffInsights() {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get<{ data: StaffRecommendationInsight[] }>(
        '/recommendations/insights',
      );
      setInsights(response.data.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch staff recommendation insights',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-700 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>AI Recommendation Insights</span>
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
              Modular Provider
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Managerial cross-sell opportunities, high-performing item pairs, and operational demand
            recommendations.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">
          Computing AI recommendation insights...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center space-x-2">
            <span>ℹ️</span>
            <span>
              <strong>Separation of Concerns:</strong> Analytics facts are strictly calculated from
              database orders. AI interpretation provides speculative cross-sell strategies.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">{insight.metricCategory}</span>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
                    Score: {Math.round(insight.confidenceScore * 100)}%
                  </span>
                </div>

                {/* Calculated Fact Section */}
                <div className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-lg text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    📊 Calculated Analytics Fact
                  </span>
                  <p className="text-slate-200">{insight.factualSummary}</p>
                </div>

                {/* AI Interpretation Section */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                    🤖 AI Engine Interpretation
                  </span>
                  <p className="text-amber-200">{insight.aiInterpretation}</p>
                </div>

                <div className="pt-2">
                  <button className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors">
                    {insight.suggestedAction}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
