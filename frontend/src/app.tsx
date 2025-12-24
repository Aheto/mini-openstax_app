// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import MainLayout from './components/layout/MainLayout';
import ChapterViewer from './components/ChapterViewer';
import AnalyticsDashboard from './components/AnalyticsDashboard';

const App = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  // Loading state while checking auth
  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p>Loading LTI context...</p>
      </div>
    );
  }

  // If no role is found, show instructions
  if (!user) {
    return (
      <div className="container" style={{ marginTop: '2rem' }}>
        <h2>Mini OpenStax MVP</h2>
        <p>Launch via simulated LTI URL:</p>
        <ul>
          <li>
            <a href="/lti/launch?user_role=student&context_id=Algebra%20I">
              Student View
            </a>
          </li>
          <li>
            <a href="/lti/launch?user_role=instructor&context_id=Algebra%20I">
              Instructor View
            </a>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <MainLayout>
      <Routes>
        {/* Student routes */}
        <Route
          path="/student/chapter/:id"
          element={<ChapterViewer />}
        />

        {/* Instructor routes */}
        <Route
          path="/instructor/analytics/:id"
          element={<AnalyticsDashboard />}
        />

        {/* Simulated LTI launch endpoint */}
        <Route
          path="/lti/launch"
          element={
            <Navigate
              to={
                user.role === 'student'
                  ? `/student/chapter/1${location.search}`
                  : `/instructor/analytics/1${location.search}`
              }
              replace
            />
          }
        />

        {/* Default redirect based on role */}
        <Route
          path="/"
          element={
            <Navigate
              to={
                user.role === 'student'
                  ? `/student/chapter/1${location.search}`
                  : `/instructor/analytics/1${location.search}`
              }
              replace
            />
          }
        />

        {/* Catch-all: redirect to role-appropriate home */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                user.role === 'student'
                  ? `/student/chapter/1${location.search}`
                  : `/instructor/analytics/1${location.search}`
              }
              replace
            />
          }
        />
      </Routes>
    </MainLayout>
  );
};

export default App;