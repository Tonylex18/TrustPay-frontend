import React, { ReactElement, useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { clearStoredToken, getStoredToken } from "../utils/api";
import { authEvents } from "../utils/authEvents";

type RequireAuthProps = {
  children: ReactElement;
};

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const location = useLocation();
  const [hasToken, setHasToken] = useState<boolean>(() => Boolean(getStoredToken()));
  const redirectingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = authEvents.onUnauthorized(() => {
      clearStoredToken();
      setHasToken(false);
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "authToken") {
        setHasToken(Boolean(getStoredToken()));
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  if (!hasToken) {
    if (redirectingRef.current) return null;
    redirectingRef.current = true;
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  redirectingRef.current = false;
  return children;
};

export default RequireAuth;
