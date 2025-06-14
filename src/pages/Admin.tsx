
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, LogOut, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TrackingMap from "@/components/TrackingMap";

const Admin = () => {
  const { isAdmin, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      toast({
        title: "Akses ditolak",
        description: "Silakan login terlebih dahulu",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    if (!isAdmin) {
      toast({
        title: "Akses ditolak",
        description: "Anda tidak memiliki akses admin",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [isAdmin, user, navigate, toast]);

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
                onClick={() => navigate('/admin/data')}
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Manajemen Data
              </Button>
              <Button variant="outline" onClick={() => signOut()}>
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
                  onClick={() => navigate('/admin/data')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Kelola Data Pengiriman
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/admin/data')}
                >
                  Lihat Laporan Kendala
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/admin/data')}
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
