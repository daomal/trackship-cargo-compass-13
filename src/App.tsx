
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicData from "@/pages/PublicData";
import InstallApp from "@/components/InstallApp";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  // Handle mobile platform specific adjustments
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Add class to body when running as a native app
      document.body.classList.add('capacitor-app');
      
      // Additional mobile-specific setup can go here
      console.log(`Running on ${Capacitor.getPlatform()} platform`);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="theme-preference">
        <Router>
          <AuthProvider>
            <div className="min-h-screen bg-gray-100 text-black transition-all duration-300 ease-in-out overflow-x-hidden">
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
                <Route path="*" element={<NotFound />} />
              </Routes>
              <InstallApp />
              <Toaster position="top-right" richColors closeButton />
            </div>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
