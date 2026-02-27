import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/authContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #1f2937, #374151)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Scale size={28} color="#d97706" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1f2937' }}>
            Turno<span style={{ color: '#d97706' }}>Lex</span>
          </h1>
          <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '0.95rem' }}>
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