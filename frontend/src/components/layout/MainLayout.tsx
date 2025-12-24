// frontend/src/components/layout/MainLayout.tsx
import React from 'react';
import Header from './Header';
import './Layout.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
