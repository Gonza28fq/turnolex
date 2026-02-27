import { useAuth } from '../../context/authContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Calendar, Users, Clock, CheckCircle } from 'lucide-react';

const stats = [
  { icon: Calendar, label: 'Turnos hoy', value: '0', color: '#d97706', bg: '#fef3c7' },
  { icon: Clock, label: 'Pendientes', value: '0', color: '#3b82f6', bg: '#eff6ff' },
  { icon: CheckCircle, label: 'Completados', value: '0', color: '#16a34a', bg: '#f0fdf4' },
  { icon: Users, label: 'Clientes', value: '0', color: '#8b5cf6', bg: '#f5f3ff' },
];

export default function AdminDashboard() {
  const { user, estudio } = useAuth();

  return (
    <DashboardLayout>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1f2937', marginBottom: '4px' }}>
          Buen día, {user?.nombre?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
          {estudio?.nombre} — {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {stats.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>{label}</span>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1f2937' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Próximos turnos placeholder */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: '16px' }}>
          📅 Próximos turnos
        </h2>
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
          <Calendar size={48} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
          <p>No hay turnos programados por ahora</p>
          <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Los turnos aparecerán aquí cuando se creen</p>
        </div>
      </div>
    </DashboardLayout>
  );
}