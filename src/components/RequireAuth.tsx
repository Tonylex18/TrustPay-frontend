import React, { ReactElement, useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { clearStoredToken, getStoredToken } from "../utils/api";
import { authEvents } from "../utils/authEvents";

type RequireAuthProps = {
  children: ReactElement;
  redirectTo?: string;
};

const RequireAuth: React.FC<RequireAuthProps> = ({ children, redirectTo = "/login" }) => {
  const location = useLocation();
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const redirectingRef = useRef(false);

  useEffect(() => {
    const syncToken = () => setHasToken(Boolean(getStoredToken()));
    syncToken();

    const unsubscribe = authEvents.onUnauthorized(() => {
      clearStoredToken();
      syncToken();
    });

    window.addEventListener("storage", syncToken);
    window.addEventListener("focus", syncToken);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", syncToken);
      window.removeEventListener("focus", syncToken);
    };
  }, []);

  if (hasToken === null) {
    return null;
  }

  if (!hasToken) {
    if (redirectingRef.current) return null;
    redirectingRef.current = true;
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  redirectingRef.current = false;
  return children;
};

export default RequireAuth;
