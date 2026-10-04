import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/sonner';
import { AppShell } from './layouts/AppShell';
import { RoleProtectedRoute } from './components/common/RoleProtectedRoute';
import { PageSkeleton } from './components/common/PageSkeleton';

// Code-Split Route Modules
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Discover = lazy(() => import('./pages/Discover').then((m) => ({ default: m.Discover })));
const NGOs = lazy(() => import('./pages/NGOs').then((m) => ({ default: m.NGOs })));
const NGOProfile = lazy(() => import('./pages/NGOProfile').then((m) => ({ default: m.NGOProfile })));
const CampaignDetails = lazy(() => import('./pages/CampaignDetails').then((m) => ({ default: m.CampaignDetails })));
const Wishlist = lazy(() => import('./pages/Wishlist').then((m) => ({ default: m.Wishlist })));
const Volunteer = lazy(() => import('./pages/Volunteer').then((m) => ({ default: m.Volunteer })));
const VolunteerDetails = lazy(() => import('./pages/VolunteerDetails').then((m) => ({ default: m.VolunteerDetails })));
const DonatePage = lazy(() => import('./pages/donation/DonatePage').then((m) => ({ default: m.DonatePage })));
const PaymentPage = lazy(() => import('./pages/donation/PaymentPage').then((m) => ({ default: m.PaymentPage })));
const PaymentStatusPage = lazy(() => import('./pages/donation/PaymentStatusPage').then((m) => ({ default: m.PaymentStatusPage })));
const ReceiptPage = lazy(() => import('./pages/donation/ReceiptPage').then((m) => ({ default: m.ReceiptPage })));
const Unauthorized = lazy(() => import('./pages/Unauthorized').then((m) => ({ default: m.Unauthorized })));
const MyNobleNet = lazy(() => import('./pages/me/MyNobleNet').then((m) => ({ default: m.MyNobleNet })));
const OrganizationWorkspace = lazy(() => import('./pages/organization/OrganizationWorkspace'));
const AdminWorkspace = lazy(() => import('./pages/admin/AdminWorkspace'));
const Impact = lazy(() => import('./pages/Impact'));
const Settings = lazy(() => import('./pages/Settings'));
const HowItWorks = lazy(() => import('./pages/HowItWorks').then((m) => ({ default: m.HowItWorks })));

import { useRealtimeSync } from './hooks/useRealtimeSync';

/**
 * Context-preserving redirect helper that retains search query params and hash
 * while replacing the history entry to prevent back-button loops.
 */
function PreservedRedirect({ to }: { to: string }) {
  const location = useLocation();
  const search = location.search;
  const hash = location.hash;
  const target = to.includes('?') ? `${to}&${search.slice(1)}${hash}` : `${to}${search}${hash}`;
  return <Navigate to={target} replace />;
}

function AppContent() {
  useRealtimeSync();

  return (
    <BrowserRouter>
      <Routes>
        {/* Unified Application Shell for all routes */}
        <Route element={<AppShell />}>
          {/* Public Discovery & Causes */}
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Discover />} />
          <Route path="/campaigns" element={<Discover />} />
          <Route path="/discover" element={<PreservedRedirect to="/explore" />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/campaigns/:id" element={<CampaignDetails />} />
          <Route path="/campaign/:id" element={<CampaignDetails />} />
            
            {/* Direct Donation & Escrow Checkout Flow */}
            <Route path="/campaigns/:id/donate" element={<DonatePage />} />
            <Route path="/campaign/:id/donate" element={<DonatePage />} />
            <Route path="/donations/:donationId/payment" element={<PaymentPage />} />
            <Route path="/donations/:donationId/status" element={<PaymentStatusPage />} />
            <Route path="/donations/:donationId/receipt" element={<ReceiptPage />} />

            {/* Organizations Directory & Profiles */}
            <Route path="/ngos" element={<NGOs />} />
            <Route path="/ngos/:id" element={<NGOProfile />} />
            <Route path="/ngo/:id" element={<NGOProfile />} />

            {/* Volunteers & Wishlist Drives */}
            <Route path="/volunteers" element={<Volunteer />} />
            <Route path="/volunteer" element={<PreservedRedirect to="/volunteers" />} />
            <Route path="/volunteers/:id" element={<VolunteerDetails />} />
            <Route path="/volunteer/:id" element={<VolunteerDetails />} />
            <Route path="/wishlist" element={<Wishlist />} />

            {/* Transparency & Governance */}
            <Route path="/impact" element={<Impact />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Personal Hub (Donor & Volunteer Hub) */}
            <Route
              path="/me"
              element={
                <RoleProtectedRoute
                  allowedRoles={['USER', 'SUPER_ADMIN']}
                  roleRedirects={{ NGO: '/organization' }}
                >
                  <MyNobleNet />
                </RoleProtectedRoute>
              }
            />
            <Route path="/dashboard" element={<PreservedRedirect to="/me" />} />
            <Route path="/account" element={<PreservedRedirect to="/me" />} />

            {/* Organization Management Workspace */}
            <Route
              path="/organization"
              element={
                <RoleProtectedRoute
                  allowedRoles={['NGO']}
                  roleRedirects={{ USER: '/me', SUPER_ADMIN: '/admin' }}
                >
                  <OrganizationWorkspace />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/organization/*"
              element={
                <RoleProtectedRoute
                  allowedRoles={['NGO']}
                  roleRedirects={{ USER: '/me', SUPER_ADMIN: '/admin' }}
                >
                  <OrganizationWorkspace />
                </RoleProtectedRoute>
              }
            />
            <Route path="/ngo" element={<PreservedRedirect to="/organization" />} />
            <Route path="/ngo/*" element={<PreservedRedirect to="/organization" />} />
            <Route path="/ngo-dashboard" element={<PreservedRedirect to="/organization" />} />

            {/* Super Admin Console */}
            <Route
              path="/admin"
              element={
                <RoleProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminWorkspace />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <RoleProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <AdminWorkspace />
                </RoleProtectedRoute>
              }
            />
            <Route path="/AdminDashboard" element={<PreservedRedirect to="/admin" />} />

            {/* User Settings */}
            <Route
              path="/settings"
              element={
                <RoleProtectedRoute allowedRoles={['USER', 'NGO', 'SUPER_ADMIN']}>
                  <Settings />
                </RoleProtectedRoute>
              }
            />

            {/* Fallback Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
