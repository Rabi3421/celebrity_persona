'use client';

import DashboardInteractive from './components/DashboardInteractive';
import { useRequireAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user, loading } = useRequireAuth(['user']);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <DashboardInteractive />
    </main>
  );
}