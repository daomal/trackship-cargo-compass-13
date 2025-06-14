
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, LogOut, Settings, FileText, Download, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TrackingMap from "@/components/TrackingMap";

const Admin = () => {
  const { isAdmin, user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle auth checks after loading is complete
  useEffect(() => {
    if (isLoading) return; // Don't do anything while loading
    
    console.log('Admin page - auth state:', { user: !!user, isAdmin, isLoading });
    
    if (!user) {
      console.log('No user found, redirecting to auth');
      navigate('/auth');
      return;
    }
    
    if (!isAdmin) {
      console.log('User is not admin, showing access denied');
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki hak akses admin.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }
  }, [isLoading, user, isAdmin, navigate, toast]);

  const handleDataManagement = () => {
    console.log('Navigating to admin data management');
    navigate('/admin/data');
  };

  const handleReportsView = () => {
    console.log('Viewing reports');
    navigate('/admin/data');
  };

  const handleExportData = () => {
    console.log('Exporting data');
    navigate('/admin/data');
  };

  const handleForumChat = () => {
    console.log('Opening forum chat');
    navigate('/admin/data');
  };

  const handleLogout = async () => {
    console.log('Admin logging out');
    try {
      await signOut();
      toast({
        title: "Logout Berhasil",
        description: "Anda telah keluar dari sistem",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error Logout",
        description: "Terjadi kesalahan saat logout",
        variant: "destructive",
      });
    }
  };

  // Show loading while auth is being determined
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p>Memvalidasi akses admin...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authenticated
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Tidak ada akses</h2>
          <p className="mb-4">Silakan login terlebih dahulu</p>
          <Button onClick={() => navigate('/auth')}>Login</Button>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Akses Ditolak</h2>
          <p className="mb-4">Anda tidak memiliki hak akses admin</p>
          <Button onClick={() => navigate('/')}>Kembali ke Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-row justify-between items-center">
            <div className="flex flex-col space-y-2">
              <h1 className="text-4xl font-bold text-navy-500">Dashboard Admin</h1>
              <p className="text-muted-foreground text-lg">
                Pantau lokasi pengiriman secara real-time
              </p>
            </div>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={handleDataManagement}
                className="flex items-center gap-2 hover:bg-blue-50"
              >
                <Database className="h-4 w-4" />
                Manajemen Data
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Quick Access Card */}
          <Card className="bg-white shadow-lg border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Menu Navigasi Cepat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  onClick={handleDataManagement}
                  className="bg-blue-600 hover:bg-blue-700 h-16 flex flex-col items-center justify-center gap-2"
                >
                  <Database className="h-6 w-6" />
                  <span className="text-sm font-medium">Kelola Data Pengiriman</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleReportsView}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300 h-16 flex flex-col items-center justify-center gap-2"
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-sm font-medium">Laporan Kendala</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleExportData}
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300 h-16 flex flex-col items-center justify-center gap-2"
                >
                  <Download className="h-6 w-6" />
                  <span className="text-sm font-medium">Export Data</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleForumChat}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300 h-16 flex flex-col items-center justify-center gap-2"
                >
                  <MessageSquare className="h-6 w-6" />
                  <span className="text-sm font-medium">Forum Chat</span>
                </Button>
              </div>
              
              {/* Tambahan Info */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 <strong>Tip:</strong> Semua menu akan mengarahkan ke halaman manajemen data dimana Anda dapat mengakses semua fitur admin.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Map */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Peta Pelacakan Real-time</CardTitle>
              <p className="text-gray-600">Data GPS driver terintegrasi secara real-time</p>
            </CardHeader>
            <CardContent>
              <TrackingMap />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
