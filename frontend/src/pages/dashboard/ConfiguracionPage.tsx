import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Save, Upload, Building2, Mail, Phone, MapPin, Scale } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/authContext';

export default function ConfiguracionPage() {
  const { estudio, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Password
  const [passForm, setPassForm] = useState({ passwordActual: '', passwordNueva: '', confirmar: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  useEffect(() => {
    if (estudio) {
      setForm({
        nombre: estudio.nombre || '',
        email: estudio.email || '',
        telefono: estudio.telefono || '',
        direccion: estudio.direccion || '',
      });
      if (estudio.logo) setLogoPreview(estudio.logo);
    }
  }, [estudio]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar 2MB');
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('nombre', form.nombre);
      formData.append('email', form.email);
      formData.append('telefono', form.telefono);
      formData.append('direccion', form.direccion);
      if (logoFile) formData.append('logo', logoFile);

      await api.put(`/estudios/${estudio?._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Datos del estudio actualizados correctamente');
      setLogoFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    if (passForm.passwordNueva !== passForm.confirmar) {
      setPassError('Las contraseñas no coinciden');
      return;
    }
    if (passForm.passwordNueva.length < 6) {
      setPassError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setPassLoading(true);
    try {
      await api.put(`/users/${user?._id}/password`, {
        passwordActual: passForm.passwordActual,
        passwordNueva: passForm.passwordNueva,
      });
      setPassSuccess('Contraseña actualizada correctamente');
      setPassForm({ passwordActual: '', passwordNueva: '', confirmar: '' });
    } catch (err: any) {
      setPassError(err.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setPassLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px 10px 42px', borderRadius: '8px',
    border: '1px solid #d1d5db', fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box' as const, color: '#1f2937',
  };

  const labelStyle = {
    display: 'block', fontSize: '0.8rem', fontWeight: 600,
    color: '#374151', marginBottom: '6px',
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1f2937' }}>Configuración</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Gestioná los datos del estudio y tu cuenta</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

        {/* Card datos del estudio */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} color="#d97706" /> Datos del estudio
          </h2>

          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#16a34a', fontSize: '0.85rem' }}>
              ✓ {success}
            </div>
          )}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#dc2626', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Logo upload */}
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px dashed #d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', cursor: 'pointer', overflow: 'hidden', background: '#fef9ee' }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <Scale size={28} color="#d97706" />
                  <div style={{ fontSize: '0.7rem', color: '#d97706', marginTop: '4px' }}>Logo</div>
                </div>
              )}
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', border: '1px solid #d97706', background: 'white', color: '#d97706', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}>
              <Upload size={14} /> Subir logo
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '6px' }}>PNG, JPG hasta 2MB</p>
          </div>

          <form onSubmit={handleSubmit}>
            {[
              { label: 'Nombre del estudio', key: 'nombre', icon: Building2, placeholder: 'Estudio García & Asociados', type: 'text' },
              { label: 'Email', key: 'email', icon: Mail, placeholder: 'contacto@estudio.com', type: 'email' },
              { label: 'Teléfono', key: 'telefono', icon: Phone, placeholder: '+54 381 000-0000', type: 'tel' },
              { label: 'Dirección', key: 'direccion', icon: MapPin, placeholder: 'San Miguel de Tucumán, Argentina', type: 'text' },
            ].map(({ label, key, icon: Icon, placeholder, type }) => (
              <div key={key} style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <Icon size={16} color="#9ca3af" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={type}
                    value={(form as any)[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    style={inputStyle}
                  />
                </div>
              </div>
            ))}

            <button type="submit" disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: loading ? '#9ca3af' : '#d97706', color: 'white', fontWeight: 700, borderRadius: '10px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px' }}>
              <Save size={16} /> {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>

        {/* Card cambiar contraseña */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: '24px' }}>
            🔐 Cambiar contraseña
          </h2>

          {passSuccess && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#16a34a', fontSize: '0.85rem' }}>
              ✓ {passSuccess}
            </div>
          )}
          {passError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#dc2626', fontSize: '0.85rem' }}>
              {passError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            {[
              { label: 'Contraseña actual', key: 'passwordActual', placeholder: 'Tu contraseña actual' },
              { label: 'Nueva contraseña', key: 'passwordNueva', placeholder: 'Mínimo 6 caracteres' },
              { label: 'Confirmar nueva contraseña', key: 'confirmar', placeholder: 'Repetí la nueva contraseña' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>{label}</label>
                <input
                  type="password"
                  value={(passForm as any)[key]}
                  onChange={e => setPassForm({ ...passForm, [key]: e.target.value })}
                  placeholder={placeholder}
                  required
                  style={{ ...inputStyle, paddingLeft: '14px' }}
                />
              </div>
            ))}

            <button type="submit" disabled={passLoading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: passLoading ? '#9ca3af' : '#1f2937', color: 'white', fontWeight: 700, borderRadius: '10px', border: 'none', cursor: passLoading ? 'not-allowed' : 'pointer', marginTop: '8px' }}>
              <Save size={16} /> {passLoading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>

          {/* Info de cuenta */}
          <div style={{ marginTop: '32px', padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
              👤 Información de cuenta
            </h3>
            {[
              { label: 'Nombre', value: user?.nombre },
              { label: 'Email', value: user?.email },
              { label: 'Rol', value: user?.rol === 'admin' ? 'Administrador' : user?.rol },
              { label: 'Estudio', value: estudio?.nombre },
              { label: 'Plan', value: estudio?.plan === 'free' ? '🆓 Gratuito' : '⭐ Pro' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: '0.85rem' }}>
                <span style={{ color: '#6b7280' }}>{label}</span>
                <span style={{ color: '#1f2937', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}