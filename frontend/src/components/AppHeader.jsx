import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

/**
 * Displays the top navigation bar with quick actions.
 */
export function AppHeader() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  return (
    <header style={{ background: '#0d47a1', color: 'white' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>CRM Corretor</strong>
          <div style={{ fontSize: '0.85rem' }}>{user?.email}</div>
        </div>
        <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
          <Link to="/contatos" style={{ color: 'white', textDecoration: 'none' }}>Contatos</Link>
          <Link to="/kanban" style={{ color: 'white', textDecoration: 'none' }}>Kanban</Link>
          {isAdmin && (
            <Link to="/kanban/config" style={{ color: 'white', textDecoration: 'none' }}>Configurar Kanban</Link>
          )}
          <button onClick={handleLogout} className="secondary-button" style={{ background: '#1976d2', color: 'white' }}>
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}
