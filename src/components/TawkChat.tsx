import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE_URL, getStoredToken } from "../utils/api";
import { apiFetch } from "utils/apiFetch";
import { toast } from "react-toastify";

type VisitorIdentity = {
  name?: string;
  email?: string;
  userId?: string;
};

type TawkAPI = {
  showWidget?: () => void;
  hideWidget?: () => void;
  setAttributes?: (attributes: Record<string, unknown>, callback?: (error?: unknown) => void) => void;
  addEvent?: (name: string, metadata?: Record<string, unknown>, callback?: (error?: unknown) => void) => void;
  onLoad?: () => void;
  [key: string]: unknown;
};

declare global {
  interface Window {
    Tawk_API?: TawkAPI;
    Tawk_LoadStart?: Date;
  }
}

const SECURITY_NOTICE = "TrustPay will never ask for OTP, PIN, or passwords in chat";
const SENSITIVE_PATHS = ["/login", "/signup", "/verify-otp", "/reset-password", "/registration"];

const TawkChat = () => {
  const location = useLocation();
  const [visitor, setVisitor] = useState<VisitorIdentity | null>(null);
  const noticeAppliedRef = useRef(false);

  const isSensitiveRoute = useMemo(
    () => SENSITIVE_PATHS.some((path) => location.pathname.startsWith(path)),
    [location.pathname]
  );

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setVisitor(null);
      return;
    }
    if (visitor) return;

    const controller = new AbortController();

    const fetchVisitor = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/me`, {
          signal: controller.signal
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok || !payload) return;

        const user = payload.user || payload.data || payload;
        if (!user?.email) return;

        setVisitor({
          name: (user.fullName || user.name || user.email || "").trim() || undefined,
          email: user.email,
          userId: user.id || user.userId || user._id
        });
      } catch {
        // Ignore profile fetch failures to avoid blocking chat load
        toast.error("Failed to load chat profile");
      }
    };

    fetchVisitor();

    return () => controller.abort();
  }, [location.pathname, visitor]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const applyVisibility = (api: TawkAPI) => {
      if (isSensitiveRoute) {
        api.hideWidget?.();
      } else {
        api.showWidget?.();
      }
    };

    const applySecurityNotice = (api: TawkAPI) => {
      if (noticeAppliedRef.current) return;
      api.addEvent?.("security_notice", { message: SECURITY_NOTICE });
      api.setAttributes?.({ securityNotice: SECURITY_NOTICE });
      noticeAppliedRef.current = true;
    };

    const applyIdentity = (api: TawkAPI) => {
      if (!visitor) return;
      const identityPayload: Record<string, string> = {};
      if (visitor.name) identityPayload.name = visitor.name;
      if (visitor.email) identityPayload.email = visitor.email;
      if (visitor.userId) identityPayload.userId = visitor.userId;
      if (Object.keys(identityPayload).length === 0) return;

      api.setAttributes?.(identityPayload);
    };

    const bindOnLoad = (api: TawkAPI) => {
      if ((api as { __trustpayBound?: boolean }).__trustpayBound) return;
      (api as { __trustpayBound?: boolean }).__trustpayBound = true;

      const existingOnLoad = api.onLoad;
      api.onLoad = () => {
        existingOnLoad?.();
        applySecurityNotice(api);
        applyVisibility(api);
        applyIdentity(api);
      };
    };

    const attemptApply = () => {
      if (cancelled) return;
      const api = window.Tawk_API;
      if (api && typeof api.hideWidget === "function") {
        bindOnLoad(api);
        applySecurityNotice(api);
        applyVisibility(api);
        applyIdentity(api);
        return;
      }
      if (attempts < 40) {
        attempts += 1;
        window.setTimeout(attemptApply, 250);
      }
    };

    attemptApply();

    return () => {
      cancelled = true;
    };
  }, [isSensitiveRoute, visitor]);

  return null;
};

export default TawkChat;
