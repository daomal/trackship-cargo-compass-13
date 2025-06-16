
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, LogOut, Settings, FileText, Download, MessageSquare, Users, BarChart3, Shield, Zap } from "lucide-react";
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
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-blue-400 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Memvalidasi akses admin...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authenticated
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-white/20">
            <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-white">Tidak ada akses</h2>
            <p className="mb-4 text-slate-300">Silakan login terlebih dahulu</p>
            <Button onClick={() => navigate('/auth')} className="bg-gradient-to-r from-blue-600 to-indigo-600">
              Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-white/20">
            <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-white">Akses Ditolak</h2>
            <p className="mb-4 text-slate-300">Anda tidak memiliki hak akses admin</p>
            <Button onClick={() => navigate('/')} className="bg-gradient-to-r from-blue-600 to-indigo-600">
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto py-8 px-4 md:px-6 relative z-10">
        <div className="flex flex-col space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-2xl">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
              </div>
              <p className="text-slate-300 text-lg">
                Kontrol penuh sistem pengiriman premium
              </p>
              
              {/* Stats */}
              <div className="flex justify-center md:justify-start gap-4 mt-4">
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-blue-200">
                  <Users className="h-3 w-3" />
                  Multi-user
                </div>
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-indigo-200">
                  <BarChart3 className="h-3 w-3" />
                  Analytics
                </div>
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-purple-200">
                  <Zap className="h-3 w-3" />
                  Real-time
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={handleDataManagement}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Manajemen Data
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="bg-red-500/20 backdrop-blur-sm border-red-500/30 text-red-200 hover:bg-red-500/30 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Quick Access Card */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white text-xl">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                Control Center
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Button 
                  onClick={handleDataManagement}
                  className="bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-20 flex flex-col items-center justify-center gap-2 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105"
                >
                  <Database className="h-8 w-8" />
                  <span className="font-bold">Kelola Data</span>
                </Button>
                
                <Button 
                  onClick={handleDataManagement}
                  className="bg-gradient-to-br from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 h-20 flex flex-col items-center justify-center gap-2 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105"
                >
                  <FileText className="h-8 w-8" />
                  <span className="font-bold">Laporan Data</span>
                </Button>
                
                <Button 
                  onClick={handleDataManagement}
                  className="bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-20 flex flex-col items-center justify-center gap-2 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105"
                >
                  <Download className="h-8 w-8" />
                  <span className="font-bold">Export Data</span>
                </Button>
                
                <Button 
                  onClick={handleForumChat}
                  className="bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-20 flex flex-col items-center justify-center gap-2 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105"
                >
                  <MessageSquare className="h-8 w-8" />
                  <span className="font-bold">Forum Chat</span>
                </Button>
              </div>
              
              {/* Info Panel */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 rounded-2xl border border-blue-500/30">
                <p className="text-blue-200 text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <strong>Pro Tip:</strong> Forum Chat memiliki sistem real-time untuk mengelola laporan kendala dari driver secara langsung.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Map */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-2xl flex items-center gap-3">
                <div className="bg-gradient-to-br from-green-500 to-blue-600 p-2 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                Live Tracking Center
              </CardTitle>
              <p className="text-slate-300">Pantau pergerakan driver secara real-time dengan teknologi GPS premium</p>
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
