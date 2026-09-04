import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Home from './pages/Home';
import CheckIn from './pages/CheckIn';
import Profile from './pages/Profile';
import Program from './pages/Program';
import LeaderboardPage from './pages/LeaderboardPage';
import Leagues from './pages/Leagues';
import Media from './pages/Media';
import Food from './pages/Food';
import AdminDashboard from './pages/AdminDashboard';
import Scanner from './pages/Scanner';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTeams from './pages/admin/AdminTeams';
import AdminRooms from './pages/admin/AdminRooms';
import AdminTasks from './pages/admin/AdminTasks';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminMedia from './pages/admin/AdminMedia';
import AdminSettings from './pages/admin/AdminSettings';
import AdminMeetings from './pages/admin/AdminMeetings';
import AdminProgram from './pages/admin/AdminProgram';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import AdminPoints from './pages/admin/AdminPoints';

function StaffRoute({ children }) {
  return (
    <ProtectedRoute roles={['ADMIN', 'SERVANT']}>{children}</ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/check-in" element={<CheckIn />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/program" element={<Program />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/leagues" element={<Leagues />} />
          <Route path="/media" element={<Media />} />
          <Route path="/food" element={<Food />} />

          <Route path="/admin" element={<StaffRoute><AdminDashboard /></StaffRoute>} />
          <Route path="/admin/scanner" element={<StaffRoute><Scanner /></StaffRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/teams" element={<ProtectedRoute roles={['ADMIN']}><AdminTeams /></ProtectedRoute>} />
          <Route path="/admin/rooms" element={<ProtectedRoute roles={['ADMIN']}><AdminRooms /></ProtectedRoute>} />
          <Route path="/admin/tasks" element={<StaffRoute><AdminTasks /></StaffRoute>} />
          <Route path="/admin/announcements" element={<ProtectedRoute roles={['ADMIN']}><AdminAnnouncements /></ProtectedRoute>} />
          <Route path="/admin/media" element={<ProtectedRoute roles={['ADMIN']}><AdminMedia /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute roles={['ADMIN']}><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/meetings" element={<ProtectedRoute roles={['ADMIN']}><AdminMeetings /></ProtectedRoute>} />
          <Route path="/admin/program" element={<ProtectedRoute roles={['ADMIN']}><AdminProgram /></ProtectedRoute>} />
          <Route path="/admin/audit-log" element={<ProtectedRoute roles={['ADMIN']}><AdminAuditLog /></ProtectedRoute>} />
          <Route path="/admin/points" element={<ProtectedRoute roles={['ADMIN']}><AdminPoints /></ProtectedRoute>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
