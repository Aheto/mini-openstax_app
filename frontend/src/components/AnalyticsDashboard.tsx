// src/components/AnalyticsDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AnalyticsData,
  LOMastery,
} from '../types/api';
import { AnalyticsService } from '../services/api';

const AnalyticsDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await AnalyticsService.getAssignmentAnalytics(id);
        setAnalytics(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [id]);

  if (loading) {
    return <div className="container"><p>Loading analytics dashboard...</p></div>;
  }

  if (error) {
    return <div className="container"><p className="error">Error: {error}</p></div>;
  }

  if (!analytics) {
    return <div className="container"><p>No analytics data available.</p></div>;
  }

  return (
    <div className="container">
      <header>
        <h1>{analytics.assignment_title}</h1>
        <p>{analytics.total_students} students enrolled</p>
      </header>

      {/* Key Metrics Grid */}
      <div className="analytics-grid">
        <div className="metric-card">
          <div className="metric-value">
            {Math.round(analytics.completion_rate * 100)}%
          </div>
          <div className="metric-label">Completion Rate</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {Math.round(analytics.avg_score * 100)}%
          </div>
          <div className="metric-label">Average Score</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {analytics.students_needing_review}
          </div>
          <div className="metric-label">Needs Review</div>
        </div>
      </div>

      {/* LO Mastery Section */}
      <section>
        <h2>Learning Objective Mastery</h2>
        {analytics.lo_mastery.length === 0 ? (
          <p>No learning objectives tracked for this assignment.</p>
        ) : (
          <div>
            {analytics.lo_mastery.map((lo: LOMastery) => (
              <div key={lo.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong className="lo-tag">{lo.tag}</strong>
                  <span>
                    {lo.mastery >= 0.8 ? (
                      <span style={{ color: '#10b981' }}>✅ Mastered</span>
                    ) : (
                      <span>{Math.round(lo.mastery * 100)}% mastered</span>
                    )}
                  </span>
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    marginTop: '0.5rem',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, lo.mastery * 100)}%`,
                      backgroundColor: lo.mastery >= 0.8 ? '#10b981' : '#f59e0b',
                      borderRadius: '4px',
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AnalyticsDashboard;