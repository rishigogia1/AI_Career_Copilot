import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  loginProvider?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (e) {
      console.error("Error loading auth data from localStorage:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (newUser: User, newToken: string) => {
    console.log(`\n========================================\n[AUTH] Login Success (Client)\nEmail: ${newUser.email}\nUserId: ${newUser.id}\nWorkspace: appState_${newUser.id}\n========================================\n`);
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("token", newToken);
  };

  const logout = () => {
    console.log("\n========================================\n[AUTH] Workspace preserved.\nAuthentication cleared.\n========================================\n");
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
