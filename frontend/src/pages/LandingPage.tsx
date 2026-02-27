import { useNavigate } from 'react-router-dom';
import { Scale, Calendar, FileText, CreditCard, Users, Shield } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      
      {/* Navbar */}
      <nav style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50, padding: '0 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #1f2937, #374151)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scale size={18} color="#d97706" />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>
              Turno<span style={{ color: '#d97706' }}>Lex</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => navigate('/login')}
              style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px' }}>
              Iniciar sesión
            </button>
            <button onClick={() => navigate('/register')}
              style={{ fontSize: '0.875rem', fontWeight: 600, background: 'linear-gradient(135deg, #1f2937, #374151)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' }}>
              Registrar estudio
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)', color: 'white', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(217,119,6,0.25)', border: '1px solid rgba(217,119,6,0.4)', borderRadius: '999px', padding: '6px 16px', fontSize: '0.875rem', fontWeight: 500, marginBottom: '24px', color: '#fcd34d' }}>
            <span>⚖️</span>
            <span>Sistema de gestión para estudios jurídicos</span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '24px' }}>
            Gestioná los turnos de tu estudio{' '}
            <span style={{ color: '#d97706' }}>de forma profesional</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.75)', maxWidth: '600px', margin: '0 auto 40px' }}>
            Calendarios inteligentes, confirmaciones automáticas, gestión de clientes y pagos online. Todo en un solo lugar.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/register')}
              style={{ background: '#d97706', color: 'white', fontWeight: 700, padding: '14px 32px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
              Empezar gratis
            </button>
            <button onClick={() => navigate('/login')}
              style={{ background: 'transparent', color: 'white', fontWeight: 500, padding: '14px 32px', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '1rem' }}>
              Ya tengo cuenta
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px', backgroundColor: '#f9fafb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', color: '#1f2937', marginBottom: '12px' }}>
            Todo lo que necesita tu estudio
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '56px' }}>
            Diseñado específicamente para estudios jurídicos argentinos
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {[
              { icon: Calendar, title: 'Calendario Inteligente', desc: 'Vista semanal y mensual por abogado. Evitá conflictos de horario automáticamente.', bg: '#fef3c7', color: '#d97706' },
              { icon: Users, title: 'Gestión de Clientes', desc: 'Registrá clientes, historial de turnos y documentos adjuntos en un solo lugar.', bg: '#f3f4f6', color: '#1f2937' },
              { icon: FileText, title: 'PDF Automático', desc: 'Generá comprobantes de turno en PDF al instante con los datos del estudio.', bg: '#f0fdf4', color: '#16a34a' },
              { icon: CreditCard, title: 'Cobro de Seña', desc: 'Integrá MercadoPago para cobrar señas al reservar el turno online.', bg: '#fef9ee', color: '#d97706' },
              { icon: Shield, title: 'Multi-tenant', desc: 'Cada estudio tiene su propio espacio aislado y seguro. Datos 100% privados.', bg: '#f3f4f6', color: '#374151' },
              { icon: Scale, title: 'Roles y Permisos', desc: 'Admin, abogados y clientes con accesos diferenciados y seguros.', bg: '#fef3c7', color: '#d97706' },
            ].map(({ icon: Icon, title, desc, bg, color }) => (
              <div key={title} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb', transition: 'box-shadow 0.2s' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Icon size={24} color={color} />
                </div>
                <h3 style={{ fontWeight: 700, color: '#1f2937', marginBottom: '8px' }}>{title}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)', color: 'white', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '16px' }}>
          ¿Listo para modernizar tu estudio?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: '32px', fontSize: '1.1rem' }}>
          Registrá tu estudio en menos de 2 minutos. Sin tarjeta de crédito.
        </p>
        <button onClick={() => navigate('/register')}
          style={{ background: '#d97706', color: 'white', fontWeight: 700, padding: '16px 40px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
          Empezar gratis ahora
        </button>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#111827', color: '#9ca3af', textAlign: 'center', padding: '32px', fontSize: '0.875rem' }}>
        <p>© 2025 TurnoLex — Sistema de gestión para estudios jurídicos</p>
        <p style={{ marginTop: '4px' }}>Desarrollado por <span style={{ color: '#d97706', fontWeight: 600 }}>Gonzalo Pedraza</span></p>
      </footer>
    </div>
  );
}