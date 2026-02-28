import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Mail, Lock, Eye, EyeOff, User, Phone, Building2, Clock } from 'lucide-react';
import { useAuth } from '../context/authContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerEstudio } = useAuth();

  const [form, setForm] = useState({
    nombreEstudio: '',
    nombreAdmin: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [pendiente, setPendiente] = useState(false);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombreEstudio || !form.nombreAdmin) {
      setError('Completá todos los campos');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const result = await registerEstudio({
        nombreEstudio: form.nombreEstudio,
        nombreAdmin: form.nombreAdmin,
        email: form.email,
        password: form.password,
        telefono: form.telefono,
      });

      if ((result as any)?.pendienteAprobacion) {
        setPendiente(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrar el estudio');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px 12px 42px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    color: '#1f2937',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
  };

  // Pantalla de espera
  if (pendiente) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '480px', background: 'white', borderRadius: '20px', padding: '48px 36px', boxShadow: '0 4px 24px rgba(0,0,0,0.2)', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', background: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Clock size={36} color="#d97706" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', margin: '0 0 12px' }}>
            ¡Registro exitoso!
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 24px' }}>
            Tu estudio <strong>{form.nombreEstudio}</strong> fue registrado correctamente. Estamos revisando los datos y te notificaremos a <strong>{form.email}</strong> cuando esté aprobado.
          </p>
          <div style={{ background: '#fef9ee', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px', marginBottom: '28px' }}>
            <p style={{ color: '#92400e', fontSize: '0.875rem', margin: 0 }}>
              ⏱ El proceso de aprobación suele tardar menos de 24 horas hábiles.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 28px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
          >
            Ir al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #1f2937, #374151)', border: '2px solid #d97706', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Scale size={28} color="#d97706" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>
            Turno<span style={{ color: '#d97706' }}>Lex</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '4px', fontSize: '0.95rem' }}>
            Registrá tu estudio jurídico
          </p>
        </div>

        {/* Pasos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          {[1, 2].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: step >= s ? '#d97706' : 'rgba(255,255,255,0.2)',
                color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700
              }}>
                {s}
              </div>
              {s < 2 && <div style={{ width: '40px', height: '2px', background: step > s ? '#d97706' : 'rgba(255,255,255,0.2)' }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '36px', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: '4px' }}>
            {step === 1 ? '📋 Datos del estudio' : '🔐 Datos de acceso'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '24px' }}>
            {step === 1 ? 'Paso 1 de 2 — Información del estudio' : 'Paso 2 de 2 — Tu cuenta de administrador'}
          </p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#dc2626', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {/* PASO 1 */}
          {step === 1 && (
            <form onSubmit={handleNext}>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Nombre del estudio</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} color="#9ca3af" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={form.nombreEstudio}
                    onChange={(e) => setForm({ ...form, nombreEstudio: e.target.value })}
                    placeholder="Ej: Estudio García & Asociados"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Tu nombre completo</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#9ca3af" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={form.nombreAdmin}
                    onChange={(e) => setForm({ ...form, nombreAdmin: e.target.value })}
                    placeholder="Ej: Dr. Juan García"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Teléfono <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span></label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="#9ca3af" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="+54 381 000-0000"
                    style={inputStyle}
                  />
                </div>
              </div>

              <button type="submit"
                style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #1f2937, #374151)', color: 'white', fontWeight: 700, fontSize: '1rem', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
                Siguiente →
              </button>
            </form>
          )}

          {/* PASO 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#9ca3af" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="tu@email.com"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#9ca3af" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    required
                    style={{ ...inputStyle, paddingRight: '42px' }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Confirmar contraseña</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#9ca3af" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Repetí tu contraseña"
                    required
                    style={{ ...inputStyle, paddingRight: '42px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setStep(1)}
                  style={{ flex: 1, padding: '13px', background: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: '0.95rem', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
                  ← Atrás
                </button>
                <button type="submit" disabled={loading}
                  style={{ flex: 2, padding: '13px', background: loading ? '#9ca3af' : '#d97706', color: 'white', fontWeight: 700, fontSize: '0.95rem', borderRadius: '10px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Registrando...' : 'Crear estudio'}
                </button>
              </div>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.875rem', color: '#6b7280' }}>
            ¿Ya tenés cuenta?{' '}
            <button onClick={() => navigate('/login')}
              style={{ color: '#d97706', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
              Iniciá sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}