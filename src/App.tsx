import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Header from './components/layout/Header';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BoardList from './pages/BoardList';
import BoardDetail from './pages/BoardDetail';
import Profile from './pages/Profile';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>
    <Header />
    <Outlet />
  </>;
};

const App: React.FC = () => {
  return (
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
  );
};

export default App; 