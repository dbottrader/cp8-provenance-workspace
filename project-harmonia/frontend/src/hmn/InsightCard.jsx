import React from 'react';

export default function InsightCard({ insight }) {
  const i = insight || demoInsight();
  const confidencePercent = Math.round((i.confidence || 0.85) * 100);

  return (
    <div className="hmn-card hmn-insight-card">
      <div className="hmn-insight-header">
        <span className="hmn-insight-title">{i.title}</span>
        <div className="hmn-confidence">
          <div className="hmn-confidence-bar">
            <div className="hmn-confidence-fill" style={{ width: `${confidencePercent}%` }} />
          </div>
          <span>{confidencePercent}%</span>
        </div>
      </div>
      <div className="hmn-insight-body">{i.body}</div>
      <div className="hmn-insight-source">Source: {i.source}</div>
    </div>
  );
}

function demoInsight() {
  return {
    title: 'Resonance Pattern Detected',
    body: 'Analysis of 10,000 molecular entries reveals a recurring 111 Hz harmonic signature across 73% of aromatic compounds. This aligns with the TSH chronal anchor hypothesis.',
    confidence: 0.91,
    source: 'TSH_Archivist / compound_batch_2025_01',
  };
}
