import { useNavigate, useLocation } from 'react-router-dom';
import { Scale, Calendar, Users, FileText, LayoutDashboard, LogOut, Settings, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/authContext';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'Turnos', path: '/dashboard/turnos' },
  { icon: Users, label: 'Clientes', path: '/dashboard/clientes' },
  { icon: UserCircle, label: 'Abogados', path: '/dashboard/abogados' },
  { icon: FileText, label: 'Reportes', path: '/dashboard/reportes' },
  { icon: Settings, label: 'Configuración', path: '/dashboard/configuracion' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, estudio, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside style={{
      width: '260px', minHeight: '100vh', background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
      display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 40,
      fontFamily: 'Segoe UI, system-ui, sans-serif'
    }}>

      {/* Logo */}
      <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scale size={20} color="#d97706" />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
              Turno<span style={{ color: '#d97706' }}>Lex</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '-2px' }}>
              {estudio?.nombre || 'Panel de gestión'}
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {menuItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '11px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                marginBottom: '4px', textAlign: 'left',
                background: isActive ? 'rgba(217,119,6,0.15)' : 'transparent',
                color: isActive ? '#d97706' : 'rgba(255,255,255,0.6)',
                fontWeight: isActive ? 600 : 400, fontSize: '0.9rem',
                borderLeft: isActive ? '3px solid #d97706' : '3px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', marginBottom: '8px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(217,119,6,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#d97706', fontWeight: 700, fontSize: '0.9rem' }}>
              {user?.nombre?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.nombre}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
              {user?.rol === 'admin' ? 'Administrador' : user?.rol === 'abogado' ? 'Abogado' : 'Cliente'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '0.875rem', fontWeight: 500 }}>
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}