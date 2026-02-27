import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Plus, X, Search, User, Mail, Phone, Calendar } from 'lucide-react';
import api from '../../services/api';

interface Cliente {
  _id: string;
  nombre: string;
  email: string;
  telefono?: string;
  activo: boolean;
  createdAt: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtered, setFiltered] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', telefono: '' });
  const [error, setError] = useState('');

  useEffect(() => { fetchClientes(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(clientes.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.telefono?.toLowerCase().includes(q)
    ));
  }, [search, clientes]);

  const fetchClientes = async () => {
    try {
      const res = await api.get('/users?rol=cliente');
      setClientes(res.data.data.usuarios);
      setFiltered(res.data.data.usuarios);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Registrar cliente usando el slug del estudio
      const estudio = JSON.parse(localStorage.getItem('estudio') || '{}');
      await api.post('/users/register-cliente', {
        ...form,
        estudioSlug: estudio.slug,
      });
      await fetchClientes();
      setShowModal(false);
      setForm({ nombre: '', email: '', password: '', telefono: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (id: string, activo: boolean) => {
    try {
      await api.put(`/users/${id}`, { activo: !activo });
      fetchClientes();
    } catch (err) {
      console.error(err);
    }
  };

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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1f2937' }}>Clientes</h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Gestioná los clientes del estudio</p>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#d97706', color: 'white', border: 'none', padding: '11px 20px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
          <Plus size={18} /> Nuevo cliente
        </button>
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: '24px', maxWidth: '400px' }}>
        <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, paddingLeft: '42px', background: 'white' }}
        />
      </div>

      {/* Stats rápidas */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total clientes', value: clientes.length, color: '#1f2937' },
          { label: 'Activos', value: clientes.filter(c => c.activo).length, color: '#16a34a' },
          { label: 'Inactivos', value: clientes.filter(c => !c.activo).length, color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: '12px', padding: '16px 24px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
            <User size={48} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
            <p>{search ? 'No se encontraron clientes' : 'No hay clientes registrados'}</p>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              {!search && 'Agregá el primer cliente con el botón "Nuevo cliente"'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Cliente', 'Email', 'Teléfono', 'Registro', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((cliente, i) => (
                <tr key={cliente._id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: '#d97706', fontWeight: 700, fontSize: '0.9rem' }}>
                          {cliente.nombre.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.9rem' }}>{cliente.nombre}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} color="#9ca3af" />
                      {cliente.email}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} color="#9ca3af" />
                      {cliente.telefono || '—'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#9ca3af" />
                      {new Date(cliente.createdAt).toLocaleDateString('es-AR')}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                      background: cliente.activo ? '#f0fdf4' : '#fef2f2',
                      color: cliente.activo ? '#16a34a' : '#ef4444',
                    }}>
                      {cliente.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setSelectedCliente(cliente)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}>
                        Ver
                      </button>
                      <button onClick={() => handleToggleActivo(cliente._id, cliente.activo)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: cliente.activo ? '#fef2f2' : '#f0fdf4', color: cliente.activo ? '#ef4444' : '#16a34a', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}>
                        {cliente.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nuevo cliente */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1f2937' }}>Nuevo cliente</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#dc2626', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {[
                { label: 'Nombre completo', key: 'nombre', type: 'text', placeholder: 'Ej: Juan García' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'juan@email.com' },
                { label: 'Contraseña temporal', key: 'password', type: 'password', placeholder: 'Mínimo 6 caracteres' },
                { label: 'Teléfono (opcional)', key: 'telefono', type: 'tel', placeholder: '+54 381 000-0000' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>{label}</label>
                  <input
                    type={type}
                    value={(form as any)[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    required={key !== 'telefono'}
                    style={inputStyle}
                  />
                </div>
              ))}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '11px', background: '#f3f4f6', color: '#374151', fontWeight: 600, borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  style={{ flex: 2, padding: '11px', background: loading ? '#9ca3af' : '#d97706', color: 'white', fontWeight: 700, borderRadius: '10px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Guardando...' : 'Crear cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal detalle cliente */}
      {selectedCliente && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1f2937' }}>Detalle del cliente</h2>
              <button onClick={() => setSelectedCliente(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <span style={{ color: '#d97706', fontWeight: 800, fontSize: '1.5rem' }}>
                  {selectedCliente.nombre.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 style={{ fontWeight: 700, color: '#1f2937', fontSize: '1.1rem' }}>{selectedCliente.nombre}</h3>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: selectedCliente.activo ? '#f0fdf4' : '#fef2f2', color: selectedCliente.activo ? '#16a34a' : '#ef4444', marginTop: '6px' }}>
                {selectedCliente.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {[
              { icon: Mail, label: 'Email', value: selectedCliente.email },
              { icon: Phone, label: 'Teléfono', value: selectedCliente.telefono || '—' },
              { icon: Calendar, label: 'Registro', value: new Date(selectedCliente.createdAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color="#6b7280" />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{label}</div>
                  <div style={{ fontSize: '0.9rem', color: '#1f2937', fontWeight: 500 }}>{value}</div>
                </div>
              </div>
            ))}

            <button onClick={() => setSelectedCliente(null)}
              style={{ width: '100%', marginTop: '24px', padding: '11px', background: '#1f2937', color: 'white', fontWeight: 600, borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}