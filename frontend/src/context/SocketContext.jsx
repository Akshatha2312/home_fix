import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";
import { SocketContext } from "./socket";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const ENV_SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
const ENV_ENABLE_SOCKET = import.meta.env.VITE_ENABLE_SOCKET;

const parseBooleanEnv = (value) => {
  if (typeof value !== "string") return Boolean(value);
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
};

const deriveSocketUrl = () => {
  if (ENV_SOCKET_URL) {
    return ENV_SOCKET_URL;
  }

  const normalizedApi = API_URL.endsWith("/api")
    ? API_URL.slice(0, -4)
    : API_URL;

  return normalizedApi;
};

const isVercelDomain = (url) => {
  try {
    return new URL(url).hostname.endsWith("vercel.app");
  } catch {
    return false;
  }
};

const shouldEnableSocket = (socketUrl) => {
  if (typeof ENV_ENABLE_SOCKET !== "undefined") {
    return parseBooleanEnv(ENV_ENABLE_SOCKET);
  }

  return !isVercelDomain(socketUrl);
};

export const SocketProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, isAuthenticated, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const socketUrl = useMemo(() => deriveSocketUrl(), []);
  const socketEnabled = useMemo(
    () => shouldEnableSocket(socketUrl),
    [socketUrl],
  );
  const socketDisableLoggedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) {
        clearInterval(logoutTimerRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      setOnlineUsers([]);
      return;
    }

    if (!socketEnabled) {
      if (!socketDisableLoggedRef.current) {
        console.info(
          "Socket connection disabled for this deployment. Set VITE_ENABLE_SOCKET=true to force-enable.",
        );
        socketDisableLoggedRef.current = true;
      }

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setOnlineUsers([]);
      return;
    }

    socketDisableLoggedRef.current = false;

    const newSocket = io(socketUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
      timeout: 10000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      newSocket.emit("join", user._id);
      if (user.userType === "admin") {
        newSocket.emit("join-admin");
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    newSocket.on("online-users", (users) => {
      setOnlineUsers(users || []);
    });

    newSocket.on("force_logout", (data) => {
      setLogoutMessage(data.message || "Logged in from another device.");
      setShowLogoutModal(true);
      let timer = 5;
      setCountdown(timer);

      if (logoutTimerRef.current) {
        clearInterval(logoutTimerRef.current);
      }

      logoutTimerRef.current = setInterval(() => {
        timer -= 1;
        setCountdown(timer);
        if (timer <= 0) {
          clearInterval(logoutTimerRef.current);
          logoutTimerRef.current = null;
          setShowLogoutModal(false);
          if (logout) logout();
          window.location.href = "/login";
        }
      }, 1000);
    });

    return () => {
      if (logoutTimerRef.current) {
        clearInterval(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
      newSocket.disconnect();
      if (socketRef.current === newSocket) {
        socketRef.current = null;
      }
      setSocket(null);
    };
  }, [
    isAuthenticated,
    user?._id,
    user?.userType,
    logout,
    socketUrl,
    socketEnabled,
  ]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
      {showLogoutModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                color: "#e53e3e",
                marginBottom: "1rem",
                fontSize: "1.5rem",
                fontWeight: "bold",
              }}
            >
              Session Terminated
            </h3>
            <p style={{ marginBottom: "1rem", color: "#4a5568" }}>
              {logoutMessage}
            </p>
            <p style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
              Logging out in {countdown}...
            </p>
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
};
