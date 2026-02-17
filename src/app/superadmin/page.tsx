'use client';

import SuperAdminDashboardInteractive from './components/SuperAdminDashboardInteractive';
import { useRequireAuth } from '@/hooks/useAuth';

export default function SuperAdminPage() {
  const { user, loading } = useRequireAuth(['superadmin']);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <SuperAdminDashboardInteractive />
    </main>
  );
}