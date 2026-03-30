import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  toggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, toggleSidebar }) => {
  return (
    <header className="top-header">
      <div className="header-left">
        <button 
          className="mobile-menu-btn" 
          onClick={toggleSidebar}
          style={{ 
            display: 'none', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            padding: '8px',
            marginRight: '8px',
            color: 'var(--gray-700)'
          }}
        >
          <Menu size={24} />
        </button>
        <div style={{ backgroundColor: '#1e4060', color: 'white', padding: '6px 10px', borderRadius: '8px', fontWeight: 'bold' }}>APS</div>
        <div className="logo-container">
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#102a43' }}>TESTE FINAL</span>
          <h1 className="logo-title">{title}</h1>
          <p className="logo-subtitle">{subtitle}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
