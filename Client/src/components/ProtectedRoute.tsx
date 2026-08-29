import { Navigate } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";
import Layout from "./Layout";
import AuthLoader from "./AuthLoader";
import React, { useEffect } from "react";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuth, checkAuthentication } = useAuth();

  useEffect(() => {
    checkAuthentication();
  }, []);

  if (isAuth === null) {
    return <AuthLoader />;
  }

  if (isAuth === false) {
    return <Navigate to={"/login"} />;
  }

  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;
