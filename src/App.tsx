import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/DashboardLayout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Overview from "./pages/Overview";
import Profile from "./pages/Profile";
import FeedbackDetails from "./pages/FeedbackDetails";
import Admin from "./pages/Admin";
import AuditLog from "./pages/AuditLog";
import MyPosts from "./pages/MyPosts";
import Management from "./pages/Management";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard/feedback/:id" element={<FeedbackDetails />} />
                  <Route path="/dashboard/overview" element={<Overview />} />
                  <Route path="/dashboard/profile" element={<Profile />} />
                  <Route path="/dashboard/my-posts" element={<MyPosts />} />
                  <Route path="/dashboard/management" element={<Management />} />
                  <Route path="/dashboard/admin" element={<Admin />} />
                  <Route path="/dashboard/admin/audit" element={<AuditLog />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
