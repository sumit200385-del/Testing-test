import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FirmwareList from './pages/FirmwareList';
import FirmwareDetail from './pages/FirmwareDetail';
import StageTesting from './pages/StageTesting';
import TestingSession from './pages/TestingSession';
import ChangeLog from './pages/ChangeLog';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <Layout>
                  <Routes>
                    <Route path="/"              element={<Dashboard />} />
                    <Route path="/firmware"      element={<FirmwareList />} />
                    <Route path="/firmware/:id"  element={<FirmwareDetail />} />
                    <Route path="/stage1"        element={<StageTesting stage={1} />} />
                    <Route path="/stage2"        element={<StageTesting stage={2} />} />
                    <Route path="/stage3"        element={<StageTesting stage={3} />} />
                    <Route path="/testing/:id"   element={<TestingSession />} />
                    <Route path="/changelog"     element={<ChangeLog />} />
                    <Route path="*"              element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
