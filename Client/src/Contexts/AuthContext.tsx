import { createContext, useContext, useState } from "react";
import { isAuthenticated } from "../Apis/authApi";
import { User } from "../types";

interface AuthContextValue {
  isAuth: boolean | null;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuth: (isAuth: boolean | null) => void;
  checkAuthentication: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const checkAuthentication = async () => {
    try {
      const res = await isAuthenticated();
      if (res.success && res.data) {
        setUser(res.data);
        setIsAuth(true);
      } else {
        setUser(null);
        setIsAuth(false);
      }
    } catch (error) {
      console.log("Error while checking Authentication: ", error);
      setUser(null);
      setIsAuth(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuth, user, setUser, setIsAuth, checkAuthentication }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
