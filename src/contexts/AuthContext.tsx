import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'super_admin' | 'center_admin' | 'student' | 'coordinator';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  centerId?: string;
  centerName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy users for development
const DUMMY_USERS: Record<string, { password: string; user: User }> = {
  'admin123': {
    password: 'admin@123',
    user: {
      id: 'super-admin-001',
      email: 'admin@pbs-edu.com',
      name: 'Super Administrator',
      role: 'super_admin',
    },
  },
  'centre123': {
    password: 'centre@123',
    user: {
      id: 'center-admin-001',
      email: 'center@pbs-edu.com',
      name: 'Delhi Learning Center',
      role: 'center_admin',
      centerId: 'center-001',
      centerName: 'PBS Delhi Center',
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('pbs_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('pbs_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const userEntry = DUMMY_USERS[email];
    
    if (!userEntry) {
      setIsLoading(false);
      return { success: false, error: 'Invalid credentials. Please check your username and password.' };
    }
    
    if (userEntry.password !== password) {
      setIsLoading(false);
      return { success: false, error: 'Invalid credentials. Please check your username and password.' };
    }
    
    setUser(userEntry.user);
    localStorage.setItem('pbs_user', JSON.stringify(userEntry.user));
    setIsLoading(false);
    
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pbs_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
