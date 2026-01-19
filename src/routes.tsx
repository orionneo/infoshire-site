import type { ReactNode } from 'react';

import About from './pages/About';

// Admin pages
import AdminClients from './pages/admin/AdminClients';
import AdminClientProfile from './pages/admin/ClientProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEmailMarketing from './pages/admin/AdminEmailMarketing';
import AdminEmailSettings from './pages/admin/AdminEmailSettings';
import AdminFinancial from './pages/admin/AdminFinancial';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminOrders from './pages/admin/AdminOrders';
import AdminPopup from './pages/admin/AdminPopup';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSiteSettings from './pages/admin/AdminSiteSettings';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AIKnowledgeAdmin from './pages/admin/AIKnowledgeAdmin';
import WarrantySearch from './pages/admin/WarrantySearch';
import WarrantyList from './pages/admin/WarrantyList';

import BudgetApproval from './pages/BudgetApproval';
import ChangePassword from './pages/ChangePassword';
import Contact from './pages/Contact';

// Client pages
import ClientDashboard from './pages/client/ClientDashboard';
import ClientOrderDetail from './pages/client/ClientOrderDetail';
import ClientProfile from './pages/client/ClientProfile';

import ForgotPassword from './pages/ForgotPassword';

// Public pages
import Home from './pages/Home';
import InitializeAdmin from './pages/InitializeAdmin';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Services from './pages/Services';
import TrackOrder from './pages/TrackOrder';
import AuthCallback from './pages/AuthCallback';
import CompleteProfile from './pages/CompleteProfile';

import AdminGuard from '@/components/auth/AdminGuard';
import { PublicLayout } from '@/components/layouts/PublicLayout';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

// Helper: protege qualquer página de admin
const withAdminGuard = (node: ReactNode) => (
  <AdminGuard>
    {node}
  </AdminGuard>
);

const routes: RouteConfig[] = [
  // Public routes
  {
    name: 'Home',
    path: '/',
    element: <Home />,
  },
  {
    name: 'Services',
    path: '/services',
    element: <Services />,
  },
  {
    name: 'About',
    path: '/about',
    element: <About />,
  },
  {
    name: 'Contact',
    path: '/contact',
    element: <Contact />,
  },
  {
    name: 'Track Order',
    path: '/rastrear-os',
    element: <TrackOrder />,
  },

  // Auth routes com header/voltar ao site
  {
    name: 'Login',
    path: '/login',
    element: (
      <PublicLayout>
        <Login />
      </PublicLayout>
    ),
  },
  {
    name: 'Register',
    path: '/register',
    element: (
      <PublicLayout>
        <Register />
      </PublicLayout>
    ),
  },
  {
    name: 'Forgot Password',
    path: '/forgot-password',
    element: (
      <PublicLayout>
        <ForgotPassword />
      </PublicLayout>
    ),
  },
  {
    name: 'Reset Password',
    path: '/reset-password/:token',
    element: (
      <PublicLayout>
        <ResetPassword />
      </PublicLayout>
    ),
  },
  {
    name: 'Change Password',
    path: '/change-password',
    element: (
      <PublicLayout>
        <ChangePassword />
      </PublicLayout>
    ),
  },
  {
    name: 'Complete Profile',
    path: '/complete-profile',
    element: (
      <PublicLayout>
        <CompleteProfile />
      </PublicLayout>
    ),
  },

  // OAuth callback (não precisa layout)
  {
    name: 'Auth Callback',
    path: '/auth/callback',
    element: <AuthCallback />,
  },

  // Init admin / approve (público - via token)
  {
    name: 'Initialize Admin',
    path: '/init-admin',
    element: <InitializeAdmin />,
  },
  {
    name: 'Budget Approval',
    path: '/approve/:token',
    element: <BudgetApproval />,
  },

  // Client routes
  {
    name: 'Client Dashboard',
    path: '/client',
    element: <ClientDashboard />,
  },
  {
    name: 'Client Order Detail',
    path: '/client/orders/:id',
    element: <ClientOrderDetail />,
  },
  {
    name: 'Client Profile',
    path: '/client/profile',
    element: <ClientProfile />,
  },

  // Admin routes (PROTEGIDAS)
  {
    name: 'Admin Dashboard',
    path: '/admin',
    element: withAdminGuard(<AdminDashboard />),
  },
  {
    name: 'Admin Orders',
    path: '/admin/orders',
    element: withAdminGuard(<AdminOrders />),
  },
  {
    name: 'Admin Order Detail',
    path: '/admin/orders/:id',
    element: withAdminGuard(<AdminOrderDetail />),
  },
  {
    name: 'Admin Clients',
    path: '/admin/clients',
    element: withAdminGuard(<AdminClients />),
  },
  {
    name: 'Admin Client Profile',
    path: '/admin/clients/:id',
    element: withAdminGuard(<AdminClientProfile />),
  },
  {
    name: 'Admin User Management',
    path: '/admin/users',
    element: withAdminGuard(<AdminUserManagement />),
  },
  {
    name: 'Admin Site Settings',
    path: '/admin/settings',
    element: withAdminGuard(<AdminSiteSettings />),
  },
  {
    name: 'Admin WhatsApp Settings',
    path: '/admin/whatsapp-settings',
    element: withAdminGuard(<AdminSettings />),
  },
  {
    name: 'Admin Analytics',
    path: '/admin/analytics',
    element: withAdminGuard(<AdminAnalytics />),
  },
  {
    name: 'AI Knowledge Engine',
    path: '/admin/ai-knowledge',
    element: withAdminGuard(<AIKnowledgeAdmin />),
  },
  {
    name: 'Admin Popup',
    path: '/admin/popup',
    element: withAdminGuard(<AdminPopup />),
  },
  {
    name: 'Admin Email Marketing',
    path: '/admin/email-marketing',
    element: withAdminGuard(<AdminEmailMarketing />),
  },
  {
    name: 'Admin Email Settings',
    path: '/admin/email-settings',
    element: withAdminGuard(<AdminEmailSettings />),
  },
  {
    name: 'Admin Financial',
    path: '/admin/financial',
    element: withAdminGuard(<AdminFinancial />),
  },
  {
    name: 'Warranty Search',
    path: '/admin/warranty-search',
    element: withAdminGuard(<WarrantySearch />),
  },
  {
    name: 'Warranty List',
    path: '/admin/warranty-list',
    element: withAdminGuard(<WarrantyList />),
  },
];

export default routes;
