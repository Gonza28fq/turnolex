import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Plus, X, Calendar, Clock, User, FileText } from 'lucide-react';
import api from '../../services/api';
import type { Turno } from '../../types/Index';

const estadoColors: Record<string, string> = {
  pendiente: '#f59e0b',
  confirmado: '#3b82f6',
  completado: '#16a34a',
  cancelado: '#ef4444',
};

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);
  const [loading, setLoading] = useState(false);
  const [abogados, setAbogados] = useState<any[]>([]);
  const [form, setForm] = useState({
    abogadoId: '',
    fecha: '',
    hora: '',
    duracion: 60,
    motivo: '',
    notas: '',
    numeroCaso: '',
  });

  useEffect(() => {
    fetchTurnos();
    fetchAbogados();
  }, []);

  const fetchTurnos = async () => {
    try {
      const res = await api.get('/turnos');
      setTurnos(res.data.data.turnos);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAbogados = async () => {
    try {
      const res = await api.get('/users?rol=abogado');
      setAbogados(res.data.data.usuarios);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fechaCompleta = `${form.fecha}T${form.hora}:00`;
      await api.post('/turnos', {
        abogadoId: form.abogadoId,
        fecha: fechaCompleta,
        duracion: form.duracion,
        motivo: form.motivo,
        notas: form.notas,
        numeroCaso: form.numeroCaso,
      });
      await fetchTurnos();
      setShowModal(false);
      setForm({ abogadoId: '', fecha: '', hora: '', duracion: 60, motivo: '', notas: '', numeroCaso: '' });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear turno');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (info: any) => {
    const turno = turnos.find(t => t._id === info.event.id);
    if (turno) setSelectedTurno(turno);
  };

  const handleDateClick = (info: any) => {
    const fecha = info.dateStr.split('T')[0];
    const hora = info.dateStr.includes('T') ? info.dateStr.split('T')[1].slice(0, 5) : '09:00';
    setForm(prev => ({ ...prev, fecha, hora }));
    setShowModal(true);
  };

  const calendarEvents = turnos.map(t => ({
    id: t._id,
    title: `${t.cliente?.nombre || 'Cliente'} — ${t.motivo}`,
    start: t.fecha,
    end: new Date(new Date(t.fecha).getTime() + t.duracion * 60000).toISOString(),
    backgroundColor: estadoColors[t.estado],
    borderColor: estadoColors[t.estado],
  }));

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #d1d5db', fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box' as const, color: '#1f2937',
  };

  const labelStyle = {
    display: 'block', fontSize: '0.8rem', fontWeight: 600,
    color: '#374151', marginBottom: '6px',
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1f2937' }}>Turnos</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Gestioná los turnos del estudio</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#d97706', color: 'white', border: 'none', padding: '11px 20px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
        >
          <Plus size={18} /> Nuevo turno
        </button>
      </div>

      {/* Leyenda estados */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {Object.entries(estadoColors).map(([estado, color]) => (
          <div key={estado} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#6b7280' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
            {estado.charAt(0).toUpperCase() + estado.slice(1)}
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={esLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          allDaySlot={false}
          height="auto"
        />
      </div>

      {/* Modal nuevo turno */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1f2937' }}>Nuevo turno</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}><User size={12} style={{ display: 'inline', marginRight: '4px' }} />Abogado</label>
                <select value={form.abogadoId} onChange={e => setForm({ ...form, abogadoId: e.target.value })} required style={inputStyle}>
                  <option value="">Seleccioná un abogado</option>
                  {abogados.map(a => <option key={a._id} value={a._id}>{a.nombre}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}><Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />Fecha</label>
                  <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />Hora</label>
                  <input type="time" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} required style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Duración (minutos)</label>
                <select value={form.duracion} onChange={e => setForm({ ...form, duracion: Number(e.target.value) })} style={inputStyle}>
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1 hora 30 min</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}><FileText size={12} style={{ display: 'inline', marginRight: '4px' }} />Motivo de consulta</label>
                <input type="text" value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} placeholder="Ej: Consulta laboral" required style={inputStyle} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Número de caso <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span></label>
                <input type="text" value={form.numeroCaso} onChange={e => setForm({ ...form, numeroCaso: e.target.value })} placeholder="Ej: EXP-2026-001" style={inputStyle} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Notas <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span></label>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Información adicional..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '11px', background: '#f3f4f6', color: '#374151', fontWeight: 600, borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  style={{ flex: 2, padding: '11px', background: loading ? '#9ca3af' : '#d97706', color: 'white', fontWeight: 700, borderRadius: '10px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Guardando...' : 'Crear turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal detalle turno */}
      {selectedTurno && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1f2937' }}>Detalle del turno</h2>
              <button onClick={() => setSelectedTurno(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: estadoColors[selectedTurno.estado] + '20', color: estadoColors[selectedTurno.estado], padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, width: 'fit-content' }}>
                {selectedTurno.estado.charAt(0).toUpperCase() + selectedTurno.estado.slice(1)}
              </div>

              {[
                { label: 'Cliente', value: selectedTurno.cliente?.nombre },
                { label: 'Abogado', value: selectedTurno.abogado?.nombre },
                { label: 'Fecha', value: new Date(selectedTurno.fecha).toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                { label: 'Hora', value: new Date(selectedTurno.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) },
                { label: 'Duración', value: `${selectedTurno.duracion} minutos` },
                { label: 'Motivo', value: selectedTurno.motivo },
                selectedTurno.numeroCaso ? { label: 'Nº Caso', value: selectedTurno.numeroCaso } : null,
                selectedTurno.notas ? { label: 'Notas', value: selectedTurno.notas } : null,
              ].filter(Boolean).map((item: any) => (
                <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>{item.label}</span>
                  <span style={{ color: '#1f2937', fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setSelectedTurno(null)}
              style={{ width: '100%', marginTop: '24px', padding: '11px', background: '#1f2937', color: 'white', fontWeight: 600, borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}