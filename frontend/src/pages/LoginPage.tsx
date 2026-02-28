import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Mail, Lock, Eye, EyeOff, Clock } from 'lucide-react';
import { useAuth } from '../context/authContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendiente, setPendiente] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPendiente(false);
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.pendienteAprobacion) {
        setPendiente(true);
      } else {
        setError(err.response?.data?.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de espera si el estudio está pendiente
  if (pendiente) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '480px', background: 'white', borderRadius: '20px', padding: '48px 36px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', background: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Clock size={36} color="#d97706" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', margin: '0 0 12px' }}>
            Estudio pendiente de aprobación
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 24px' }}>
            Tu solicitud fue recibida correctamente. Estamos revisando los datos de tu estudio y te notificaremos por email cuando esté aprobado.
          </p>
          <div style={{ background: '#fef9ee', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px', marginBottom: '28px' }}>
            <p style={{ color: '#92400e', fontSize: '0.875rem', margin: 0 }}>
              ⏱ El proceso de aprobación suele tardar menos de 24 horas hábiles.
            </p>
          </div>
          <button
            onClick={() => setPendiente(false)}
            style={{ color: '#d97706', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            ← Volver al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #1f2937, #374151)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Scale size={28} color="#d97706" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>
            Turno<span style={{ color: '#d97706' }}>Lex</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '4px', fontSize: '0.95rem' }}>
            Iniciá sesión en tu estudio
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '36px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#dc2626', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#9ca3af" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="tu@email.com"
                  required
                  style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', color: '#1f2937' }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#9ca3af" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Tu contraseña"
                  required
                  style={{ width: '100%', padding: '12px 42px 12px 42px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', color: '#1f2937' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '13px', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #1f2937, #374151)', color: 'white', fontWeight: 700, fontSize: '1rem', borderRadius: '10px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Links */}
          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: '#6b7280' }}>
            ¿No tenés cuenta?{' '}
            <button
              onClick={() => navigate('/register')}
              style={{ color: '#d97706', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Registrá tu estudio
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button
              onClick={() => navigate('/')}
              style={{ color: '#9ca3af', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}