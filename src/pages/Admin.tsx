
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, LogOut, Settings, FileText, Download, MessageSquare, Users, BarChart3, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TrackingMap from "@/components/TrackingMap";

const Admin = () => {
  const { isAdmin, user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!isAdmin) {
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
    navigate('/admin/data');
  };

  const handleForumChat = () => {
    navigate('/admin/forum');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout Berhasil",
        description: "Anda telah keluar dari sistem",
      });
    } catch (error) {
      toast({
        title: "Error Logout",
        description: "Terjadi kesalahan saat logout",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Memvalidasi akses admin...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-white p-8 rounded-lg shadow-sm border max-w-md">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              {!user ? "Tidak ada akses" : "Akses Ditolak"}
            </h2>
            <p className="mb-6 text-gray-600">
              {!user ? "Silakan login terlebih dahulu" : "Anda tidak memiliki hak akses admin"}
            </p>
            <Button 
              onClick={() => navigate(!user ? '/auth' : '/')} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              {!user ? "Login" : "Kembali ke Dashboard"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex flex-col space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-600 p-3 rounded-lg shadow-sm">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
              </div>
              <p className="text-gray-600">
                Kelola sistem pengiriman dengan kontrol penuh
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleDataManagement}
                className="border-gray-200 hover:bg-gray-50"
              >
                <Database className="h-4 w-4 mr-2" />
                Manajemen Data
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Control Center */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Settings className="h-5 w-5 text-blue-600" />
                </div>
                Control Center
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  onClick={handleDataManagement}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Database className="h-6 w-6 text-blue-600" />
                  <span className="font-medium text-gray-900">Kelola Data</span>
                </Button>
                
                <Button 
                  onClick={handleDataManagement}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                >
                  <FileText className="h-6 w-6 text-orange-600" />
                  <span className="font-medium text-gray-900">Laporan Data</span>
                </Button>
                
                <Button 
                  onClick={handleDataManagement}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 border-green-200 hover:bg-green-50 hover:border-green-300"
                >
                  <Download className="h-6 w-6 text-green-600" />
                  <span className="font-medium text-gray-900">Export Data</span>
                </Button>
                
                <Button 
                  onClick={handleForumChat}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                >
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                  <span className="font-medium text-gray-900">Forum Chat</span>
                </Button>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <strong>Info:</strong> Forum Chat memiliki sistem real-time untuk mengelola laporan kendala dari driver secara langsung.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Live Tracking */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                Live Tracking Center
              </CardTitle>
              <p className="text-gray-600">Pantau pergerakan driver secara real-time</p>
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
