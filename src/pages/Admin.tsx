
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
    if (!isLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        toast({
          title: "Akses Ditolak",
          description: "Anda tidak memiliki hak akses admin.",
          variant: "destructive",
        });
        navigate('/');
      }
    }
  }, [isLoading, user, isAdmin, navigate]);

  if (isLoading) {
    return <div className="p-4">Memuat data...</div>;
  }

  return (
    <div className="relative h-screen w-screen">
      <div className="absolute top-4 right-4 z-[1000] space-x-2">
        <Button onClick={() => navigate('/admin/data')}>
          Manajemen Data
        </Button>
        <Button onClick={() => navigate('/admin/data')}>
          Laporan Kendala
        </Button>
      </div>
      <TrackingMap />
    </div>
  );
};

export default Admin;
