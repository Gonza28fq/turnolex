import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, Estudio } from '../types/Index';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  estudio: Estudio | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  registerEstudio: (data: {
    nombreEstudio: string;
    nombreAdmin: string;
    email: string;
    password: string;
    telefono?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [estudio, setEstudio] = useState<Estudio | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedEstudio = localStorage.getItem('estudio');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      if (savedEstudio) setEstudio(JSON.parse(savedEstudio));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    if (response.success && response.data) {
      const { token, user, estudio } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (estudio) localStorage.setItem('estudio', JSON.stringify(estudio));
      setToken(token);
      setUser(user);
      if (estudio) setEstudio(estudio);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('estudio');
    setToken(null);
    setUser(null);
    setEstudio(null);
  };

  const registerEstudio = async (data: {
    nombreEstudio: string;
    nombreAdmin: string;
    email: string;
    password: string;
    telefono?: string;
  }) => {
    const response = await authService.registerEstudio(data);
    if (response.success && response.data) {
      const { token, user, estudio } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('estudio', JSON.stringify(estudio));
      setToken(token);
      setUser(user);
      setEstudio(estudio);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      estudio,
      token,
      isAuthenticated: !!token,
      loading,
      login,
      logout,
      registerEstudio,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};