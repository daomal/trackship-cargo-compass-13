
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DriverDashboard from "./pages/DriverDashboard";
import Admin from "./pages/Admin";
import AdminData from "./pages/AdminData";
import AdminForum from "./pages/AdminForum";
import PublicData from "./pages/PublicData";
import ForumKendala from "./pages/ForumKendala";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/public-data" element={<PublicData />} />
              <Route
                path="/dashboard-supir"
                element={
                  <ProtectedRoute>
                    <DriverDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/data"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminData />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/forum"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminForum />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forum-kendala/:shipmentId"
                element={
                  <ProtectedRoute>
                    <ForumKendala />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
