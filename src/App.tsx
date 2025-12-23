import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCenters from "./pages/admin/Centers";
import AdminCourses from "./pages/admin/Courses";
import AdminStudents from "./pages/admin/Students";

// Center Pages
import CenterDashboard from "./pages/center/Dashboard";
import CenterEnquiries from "./pages/center/Enquiries";
import CenterStudents from "./pages/center/Students";
import CenterStock from "./pages/center/Stock";
import CenterOrders from "./pages/center/Orders";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            {/* Super Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/centers" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminCenters />
              </ProtectedRoute>
            } />
            <Route path="/admin/courses" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminCourses />
              </ProtectedRoute>
            } />
            <Route path="/admin/students" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminStudents />
              </ProtectedRoute>
            } />
            
            {/* Center Admin Routes */}
            <Route path="/center" element={
              <ProtectedRoute allowedRoles={['center_admin']}>
                <CenterDashboard />
              </ProtectedRoute>
            } />
            <Route path="/center/enquiries" element={
              <ProtectedRoute allowedRoles={['center_admin']}>
                <CenterEnquiries />
              </ProtectedRoute>
            } />
            <Route path="/center/students" element={
              <ProtectedRoute allowedRoles={['center_admin']}>
                <CenterStudents />
              </ProtectedRoute>
            } />
            <Route path="/center/stock" element={
              <ProtectedRoute allowedRoles={['center_admin']}>
                <CenterStock />
              </ProtectedRoute>
            } />
            <Route path="/center/orders" element={
              <ProtectedRoute allowedRoles={['center_admin']}>
                <CenterOrders />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
