
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import TrackingMap from '@/components/TrackingMap';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Admin = () => {
  const { isAdmin, user, isLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isLoading) return; // Jangan lakukan apa-apa jika masih loading

    if (!user) {
      navigate('/auth');
    } else if (!isAdmin) {
      toast.error("Akses Ditolak", { description: "Anda bukan admin." });
      navigate('/');
    }
  }, [isLoading, user, isAdmin, navigate]);

  if (isLoading || !isAdmin) {
    return <div className="flex h-screen w-full items-center justify-center"><p>Memvalidasi akses...</p></div>;
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <div className="absolute top-4 right-4 z-[1000] flex space-x-2">
        <Button onClick={() => navigate('/admin/data')}>Manajemen Data</Button>
      </div>
      <TrackingMap />
    </div>
  );
};

export default Admin;
