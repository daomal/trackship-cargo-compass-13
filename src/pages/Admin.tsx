
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, LogOut, Settings } from "lucide-react";
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
    // Only run checks if loading is finished
    if (!isLoading) {
      if (!user) {
        // If no user at all, redirect to auth
        navigate('/auth');
      } else if (!isAdmin) {
        // If user exists but not admin, redirect to home
        toast({
          title: "Akses Ditolak",
          description: "Anda tidak memiliki hak akses admin.",
          variant: "destructive",
        });
        navigate('/');
      }
      // If user exists and is admin, do nothing (let page render)
    }
  }, [isLoading, user, isAdmin, navigate, toast]);

  const handleDataManagement = () => {
    navigate('/admin/data');
  };

  const handleReportsView = () => {
    navigate('/admin/data');
  };

  const handleLogout = () => {
    signOut();
  };

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
                >
                  Lihat Laporan Kendala
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleDataManagement}
                >
                  Export Data
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
