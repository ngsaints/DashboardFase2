import React from 'react';
import { Search, Filter, Settings, X } from 'lucide-react';

interface SidebarProps {
  onSearch: (q: string) => void;
  searchTerm: string;
  isOpen?: boolean;
  onClose?: () => void;
  filters: {
    municipio: string;
    sigla: string;
    estabelecimento: string;
    equipe: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    municipio: string;
    sigla: string;
    estabelecimento: string;
    equipe: string;
  }>>;
  options: {
    municipios: string[];
    siglas: string[];
    estabelecimentos: string[];
    equipes: string[];
  };
  onClearFilters: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSearch, searchTerm, isOpen, onClose, filters, setFilters, options, onClearFilters }) => {
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters = filters.municipio !== 'Todos' || 
                          filters.sigla !== 'Todos' || 
                          filters.estabelecimento !== 'Todos' || 
                          filters.equipe !== 'Todos';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} />
          Filtros Ativos
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {hasActiveFilters && (
            <button 
              onClick={onClearFilters}
              title="Limpar filtros"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--performance-regular)',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
            >
              <X size={16} />
            </button>
          )}
          <button 
            onClick={onClose}
            className="mobile-close-btn"
            style={{ 
              display: 'none', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--gray-500)'
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="search-container">
        <Search className="search-icon" size={16} />
        <input 
          type="text" 
          placeholder="Pesquisar Unidade..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label className="filter-label">Município</label>
        <select 
          className="filter-select" 
          value={filters.municipio} 
          onChange={(e) => handleFilterChange('municipio', e.target.value)}
        >
          <option value="Todos">Todos</option>
          {options.municipios.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Sigla da Equipe</label>
        <select 
          className="filter-select" 
          value={filters.sigla} 
          onChange={(e) => handleFilterChange('sigla', e.target.value)}
        >
          <option value="Todos">Todos</option>
          {options.siglas.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Estabelecimento</label>
        <select 
          className="filter-select" 
          value={filters.estabelecimento} 
          onChange={(e) => handleFilterChange('estabelecimento', e.target.value)}
        >
          <option value="Todos">Todos</option>
          {options.estabelecimentos.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          Unidade / Equipe
          <Settings size={14} style={{ color: '#ccc' }} />
        </label>
        <select 
          className="filter-select" 
          value={filters.equipe} 
          onChange={(e) => handleFilterChange('equipe', e.target.value)}
        >
          <option value="Todos">Todos</option>
          {options.equipes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      {hasActiveFilters && (
        <button 
          onClick={onClearFilters}
          style={{
            marginTop: 'auto',
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            fontWeight: '800',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
        >
          <X size={18} /> LIMPAR TUDO
        </button>
      )}
    </aside>
  );
};

export default Sidebar;
