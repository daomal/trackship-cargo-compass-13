
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, LogOut, Settings, FileText, Download, MessageSquare, MapPin, BarChart3, Users, TrendingUp } from "lucide-react";
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

  const handleForumChat = () => {
    console.log('Opening admin forum chat');
    navigate('/admin/forum');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header with Glass Effect */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="container mx-auto py-4 px-6">
          <div className="flex flex-row justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-slate-500 font-medium">
                  Pantau lokasi pengiriman secara real-time
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleDataManagement}
                className="bg-white/60 backdrop-blur-sm border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-sm"
              >
                <Database className="h-4 w-4 mr-2" />
                Manajemen Data
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="bg-white/60 backdrop-blur-sm border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 transition-all duration-300 shadow-sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-6 space-y-8">
        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Pengiriman</p>
                  <p className="text-3xl font-bold">128</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Driver Aktif</p>
                  <p className="text-3xl font-bold">24</p>
                </div>
                <Users className="h-8 w-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 border-0 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Dalam Perjalanan</p>
                  <p className="text-3xl font-bold">15</p>
                </div>
                <MapPin className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-violet-600 border-0 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Berhasil Hari Ini</p>
                  <p className="text-3xl font-bold">89</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Menu */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Settings className="h-6 w-6 text-blue-600" />
              Menu Navigasi Cepat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={handleDataManagement}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-20 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl"
              >
                <Database className="h-6 w-6" />
                <span className="text-sm font-medium">Kelola Data Pengiriman</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleDataManagement}
                className="bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 text-orange-700 border-orange-200 hover:border-orange-300 h-20 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl"
              >
                <FileText className="h-6 w-6" />
                <span className="text-sm font-medium">Laporan Data</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleDataManagement}
                className="bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 text-emerald-700 border-emerald-200 hover:border-emerald-300 h-20 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl"
              >
                <Download className="h-6 w-6" />
                <span className="text-sm font-medium">Export Data</span>
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleForumChat}
                className="bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 text-purple-700 border-purple-200 hover:border-purple-300 h-20 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl"
              >
                <MessageSquare className="h-6 w-6" />
                <span className="text-sm font-medium">Forum Chat</span>
              </Button>
            </div>
            
            {/* Modern Info Card */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">💡 Tips Penggunaan</p>
                  <p className="text-sm text-blue-700">
                    Forum Chat sekarang memiliki halaman terpisah untuk mengelola laporan kendala dari driver secara real-time.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modern Tracking Map */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
            <CardTitle className="text-2xl flex items-center gap-3">
              <MapPin className="h-7 w-7 text-blue-600" />
              Peta Pelacakan Real-time
            </CardTitle>
            <p className="text-slate-600 font-medium">
              Data GPS driver terintegrasi secara real-time - Hanya driver hari ini
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[500px] relative">
              <TrackingMap />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
