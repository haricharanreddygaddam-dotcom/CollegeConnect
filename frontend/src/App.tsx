import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { RoleDemoBanner } from './components/RoleDemoBanner';
import { Dashboard } from './pages/Dashboard';
import { AttendancePage } from './pages/Attendance';
import { MarksPage } from './pages/Marks';
import { TimetablePage } from './pages/Timetable';
import { AssignmentsPage } from './pages/Assignments';
import { NoticesPage } from './pages/Notices';
import { EventsPage } from './pages/Events';
import { LeavesPage } from './pages/Leaves';
import { CertificatesPage } from './pages/Certificates';
import { VerifyCertificatePage } from './pages/VerifyCertificate';
import { FeedbackPage } from './pages/FeedbackPage';
import { DirectoriesPage } from './pages/Directories';
import { AdminManagementPage } from './pages/AdminManagement';
import { LoginPage } from './pages/Login';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <RoleDemoBanner />
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Verification Route */}
          <Route path="/verify/:hash" element={<VerifyCertificatePage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/attendance" element={<ProtectedLayout><AttendancePage /></ProtectedLayout>} />
          <Route path="/marks" element={<ProtectedLayout><MarksPage /></ProtectedLayout>} />
          <Route path="/timetable" element={<ProtectedLayout><TimetablePage /></ProtectedLayout>} />
          <Route path="/assignments" element={<ProtectedLayout><AssignmentsPage /></ProtectedLayout>} />
          <Route path="/notices" element={<ProtectedLayout><NoticesPage /></ProtectedLayout>} />
          <Route path="/events" element={<ProtectedLayout><EventsPage /></ProtectedLayout>} />
          <Route path="/leaves" element={<ProtectedLayout><LeavesPage /></ProtectedLayout>} />
          <Route path="/certificates" element={<ProtectedLayout><CertificatesPage /></ProtectedLayout>} />
          <Route path="/feedback" element={<ProtectedLayout><FeedbackPage /></ProtectedLayout>} />
          <Route path="/directory/:type" element={<ProtectedLayout><DirectoriesPage /></ProtectedLayout>} />
          <Route path="/admin/management" element={<ProtectedLayout><AdminManagementPage /></ProtectedLayout>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
