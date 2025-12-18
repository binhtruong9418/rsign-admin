import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import AdminLayout from '@/components/layout/AdminLayout';
import Dashboard from '@/pages/admin/Dashboard';
import DocumentList from '@/pages/admin/DocumentList';
import DocumentCreate from '@/pages/admin/DocumentCreate';
import DocumentDetail from '@/pages/admin/DocumentDetail';
import DocumentBatches from '@/pages/admin/DocumentBatches';
import SignerGroups from '@/pages/admin/SignerGroups';
import UserManagement from '@/pages/admin/UserManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="documents" element={<DocumentList />} />
                    <Route path="documents/create" element={<DocumentCreate />} />
                    <Route path="documents/:id" element={<DocumentDetail />} />
                    <Route path="documents/batch/:batchId" element={<DocumentList />} />
                    <Route path="document-batches" element={<DocumentBatches />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="signer-groups" element={<SignerGroups />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
