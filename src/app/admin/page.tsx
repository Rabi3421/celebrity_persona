'use client';

import AdminDashboardInteractive from './components/AdminDashboardInteractive';
import { useRequireAuth } from '@/hooks/useAuth';

export default function AdminPage() {
  const { user, loading } = useRequireAuth(['admin', 'superadmin']);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <AdminDashboardInteractive />
    </main>
  );
}