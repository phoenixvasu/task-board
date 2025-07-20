import React from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import Header from "./components/layout/Header";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import BoardList from "./pages/BoardList";
import BoardDetail from "./pages/BoardDetail";
import Profile from "./pages/Profile";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { subscribeToSocketStatus } from "./api/socket";
import { useCollaborationStore } from "./store/useCollaborationStore";
import { useEffect } from "react";
import { useRealtimeRejoinAndResync } from "./store/useBoardStore";
import { useRegisterCollaborationSocketListeners } from "./store/useCollaborationStore";

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    subscribeToSocketStatus();
  }, []);
  useRegisterCollaborationSocketListeners();
  useRealtimeRejoinAndResync();
  const connectionStatus = useCollaborationStore(
    (state) => state.connectionStatus
  );
  return (
    <>
      {connectionStatus === "reconnecting" && (
        <div
          style={{
            background: "#fbbf24",
            color: "#111",
            padding: "8px",
            textAlign: "center",
            fontWeight: "bold",
            zIndex: 1000,
          }}
        >
          Reconnecting to real-time server...
        </div>
      )}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<BoardList />} />
          <Route path="/board/:boardId" element={<BoardDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
