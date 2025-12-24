// frontend/src/components/layout/Header.tsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import logo from '../../assets/logo.svg';


const Header = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const contextId = params.get('context_id') || 'Your Course';
  const userRole = params.get('user_role') || localStorage.getItem('user_role') || 'student';

  const isStudent = userRole === 'student';

  return (
    <header style={{
      backgroundColor: '#2563eb',
      color: 'white',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <img src={logo} alt="OpenStax Mini" height="32" />
        <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>{contextId}</span>
      </div>
      <div style={{ fontSize: '0.9rem' }}>
        {isStudent ? 'Student View' : 'Instructor View'}
      </div>
    </header>
  );
};

export default Header;