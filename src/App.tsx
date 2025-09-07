import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LazyRouteWrapper, LazyHomePage, LazyEditorPage } from './components/LazyLoading/LazyLoading';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
        <Routes>
          <Route 
            path="/" 
            element={
              <LazyRouteWrapper>
                <LazyHomePage />
              </LazyRouteWrapper>
            } 
          />
          <Route 
            path="/editor/:id?" 
            element={
              <LazyRouteWrapper>
                <LazyEditorPage />
              </LazyRouteWrapper>
            } 
          />
          <Route 
            path="/editor" 
            element={
              <LazyRouteWrapper>
                <LazyEditorPage />
              </LazyRouteWrapper>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
