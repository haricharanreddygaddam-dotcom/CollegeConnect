import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'hod' | 'admin';
  avatar?: string;
  student_id?: number;
  roll_number?: string;
  department_id?: number;
  department_name?: string;
  department_code?: string;
  year?: number;
  semester?: number;
  section?: string;
  phone?: string;
  address?: string;
  parent_name?: string;
  admission_year?: number;
  cgpa?: number;
  faculty_id?: number;
  employee_id?: string;
  designation?: string;
  office_room?: string;
  qualification?: string;
}

export interface DemoUser {
  role: string;
  name: string;
  email: string;
  password: string;
  badge: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: 'student' | 'faculty' | 'hod' | 'admin') => Promise<void>;
  demoUsers: DemoUser[];
  refreshProfile: () => Promise<void>;
}

const DEMO_CREDENTIALS: Record<string, { email: string; pass: string }> = {
  admin: { email: 'admin@campusconnect.edu', pass: 'AdminPassword@123' },
  hod: { email: 'hod.cse@campusconnect.edu', pass: 'HodPassword@123' },
  faculty: { email: 'david.thorne@campusconnect.edu', pass: 'FacultyPassword@123' },
  student: { email: 'haricharan.reddy@campusconnect.edu', pass: 'StudentPassword@123' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('cc_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);

  useEffect(() => {
    // Fetch demo users list
    api.get('/auth/demo-users')
      .then((res) => setDemoUsers(res.data))
      .catch(() => {});

    if (token) {
      refreshProfile().finally(() => setLoading(false));
    } else {
      // Auto login as Student (Haricharan) by default for immediate instant interactive experience!
      switchDemoRole('student').finally(() => setLoading(false));
    }
  }, []);

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      logout();
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const accessToken = res.data.access_token;
      localStorage.setItem('cc_token', accessToken);
      setToken(accessToken);
      const profileRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUser(profileRes.data);
    } finally {
      setLoading(false);
    }
  };

  const switchDemoRole = async (role: 'student' | 'faculty' | 'hod' | 'admin') => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  const logout = () => {
    localStorage.removeItem('cc_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        switchDemoRole,
        demoUsers,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
