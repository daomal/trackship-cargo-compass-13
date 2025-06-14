
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, LogOut, Settings, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TrackingMap from "@/components/TrackingMap";

const Admin = () => {
  const { isAdmin, user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // 1. Show loading state while auth is being checked
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // 2. Handle auth checks after loading is complete
  useEffect(() => {
    console.log('Admin page - checking auth:', { isLoading, user: !!user, isAdmin });
    
    if (!isLoading) {
      if (!user) {
        console.log('No user, redirecting to auth');
        navigate('/auth');
      } else if (!isAdmin) {
        console.log('User is not admin, redirecting to home');
        toast({
          title: "Akses Ditolak",
          description: "Anda tidak memiliki hak akses admin.",
          variant: "destructive",
        });
        navigate('/');
      } else {
        console.log('User is admin, staying on admin page');
      }
    }
  }, [isLoading, user, isAdmin, navigate, toast]);

  const handleDataManagement = () => {
    console.log('Navigating to admin data management');
    navigate('/admin/data');
  };

  const handleReportsView = () => {
    console.log('Viewing reports');
    toast({
      title: "Laporan Kendala",
      description: "Navigasi ke halaman laporan kendala",
    });
    navigate('/admin/data');
  };

  const handleExportData = () => {
    console.log('Exporting data');
    toast({
      title: "Export Data",
      description: "Fitur export akan segera tersedia",
    });
  };

  const handleForumChat = () => {
    console.log('Opening forum chat');
    toast({
      title: "Forum Chat",
      description: "Navigasi ke forum komunikasi",
    });
    navigate('/admin/data');
  };

  const handleLogout = () => {
    console.log('Admin logging out');
    signOut();
  };

  // Don't render anything if we're still checking auth or user is not admin
  if (!user || !isAdmin) {
    return null;
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
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Manajemen Data
              </Button>
              <Button variant="outline" onClick={handleLogout}>
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
                Menu Cepat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={handleDataManagement}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Kelola Data Pengiriman
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleReportsView}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Lihat Laporan Kendala
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleExportData}
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleForumChat}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Forum Chat
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Map */}
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Peta Pelacakan Real-time</CardTitle>
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
