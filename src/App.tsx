
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminData = lazy(() => import("./pages/AdminData"));
const PublicData = lazy(() => import("./pages/PublicData"));
const DriverDashboard = lazy(() => import("./pages/DriverDashboard"));
const ForumKendala = lazy(() => import("./pages/ForumKendala"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Suspense
            fallback={
              <div className="flex h-screen w-full items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/public-data" element={<PublicData />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/data"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminData />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard-supir"
                element={
                  <ProtectedRoute>
                    <DriverDashboard />
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
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
