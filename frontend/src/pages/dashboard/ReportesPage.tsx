import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { TrendingUp, Calendar, Users, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import type { Turno } from '../../types/Index';

const COLORS = ['#f59e0b', '#3b82f6', '#16a34a', '#ef4444'];

export default function ReportesPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/turnos');
      setTurnos(res.data.data.turnos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Turnos por estado
  const turnosPorEstado = [
    { name: 'Pendiente', value: turnos.filter(t => t.estado === 'pendiente').length },
    { name: 'Confirmado', value: turnos.filter(t => t.estado === 'confirmado').length },
    { name: 'Completado', value: turnos.filter(t => t.estado === 'completado').length },
    { name: 'Cancelado', value: turnos.filter(t => t.estado === 'cancelado').length },
  ].filter(t => t.value > 0);

  // Turnos por mes (últimos 6 meses)
  const turnosPorMes = () => {
    const meses: Record<string, number> = {};
    const ahora = new Date();
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const key = fecha.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
      meses[key] = 0;
    }
    turnos.forEach(t => {
      const fecha = new Date(t.fecha);
      const key = fecha.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
      if (meses[key] !== undefined) meses[key]++;
    });
    return Object.entries(meses).map(([mes, cantidad]) => ({ mes, cantidad }));
  };

  // Turnos por día de la semana
  const turnosPorDia = () => {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const conteo = Array(7).fill(0);
    turnos.forEach(t => { conteo[new Date(t.fecha).getDay()]++; });
    return dias.map((dia, i) => ({ dia, cantidad: conteo[i] }));
  };

  const stats = [
    { icon: Calendar, label: 'Total turnos', value: turnos.length, color: '#d97706', bg: '#fef3c7' },
    { icon: CheckCircle, label: 'Completados', value: turnos.filter(t => t.estado === 'completado').length, color: '#16a34a', bg: '#f0fdf4' },
    { icon: TrendingUp, label: 'Este mes', value: turnos.filter(t => new Date(t.fecha).getMonth() === new Date().getMonth()).length, color: '#3b82f6', bg: '#eff6ff' },
    { icon: Users, label: 'Tasa completados', value: turnos.length > 0 ? Math.round((turnos.filter(t => t.estado === 'completado').length / turnos.length) * 100) + '%' : '0%', color: '#8b5cf6', bg: '#f5f3ff' },
  ];

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#6b7280' }}>
        Cargando reportes...
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1f2937' }}>Reportes</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Estadísticas y métricas del estudio</p>
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

      {turnos.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center', border: '1px solid #e5e7eb', color: '#9ca3af' }}>
          <TrendingUp size={48} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
          <p>No hay datos suficientes para mostrar reportes</p>
          <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Los gráficos aparecerán cuando haya turnos registrados</p>
        </div>
      ) : (
        <>
          {/* Gráficos fila 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

            {/* Turnos por mes */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontWeight: 700, color: '#1f2937', marginBottom: '20px', fontSize: '1rem' }}>
                📈 Turnos por mes
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={turnosPorMes()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.85rem' }} />
                  <Line type="monotone" dataKey="cantidad" stroke="#d97706" strokeWidth={2.5} dot={{ fill: '#d97706', r: 4 }} name="Turnos" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Turnos por estado */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontWeight: 700, color: '#1f2937', marginBottom: '20px', fontSize: '1rem' }}>
                🥧 Turnos por estado
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={turnosPorEstado} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {turnosPorEstado.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.85rem' }} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico fila 2 */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontWeight: 700, color: '#1f2937', marginBottom: '20px', fontSize: '1rem' }}>
              📊 Turnos por día de la semana
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={turnosPorDia()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.85rem' }} />
                <Bar dataKey="cantidad" fill="#d97706" radius={[6, 6, 0, 0]} name="Turnos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}