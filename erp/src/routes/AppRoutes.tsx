import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Dashboard } from '../features/dashboard/Dashboard';
import { JobsList } from '../features/jobs/JobsList';
import { JobDetail } from '../features/jobs/JobDetail';
import { BOQListView } from '../features/boq/BOQListView';
import { PurchasesView } from '../features/purchases/PurchasesView';
import { InventoryView } from '../features/inventory/InventoryView';
import { TasksView } from '../features/tasks/TasksView';
import { SitesManagementView } from '../features/sites/SitesManagementView';
import { EmployeesView } from '../features/employees/EmployeesView';
import { VendorsView } from '../features/vendors/VendorsView';
import { ClientsView } from '../features/clients/ClientsView';
import { AccountsView } from '../features/accounts/AccountsView';
import { ProfitLossReport } from '../features/reports/ProfitLossReport';
import { PriceHistoryView } from '../features/reports/PriceHistoryView';
import { AuditLogView } from '../features/audit/AuditLogView';
import { SettingsView } from '../features/settings/SettingsView';
import { MembersView } from '../features/members/MembersView';
import { LoginView } from '../features/auth/LoginView';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { AuthGuard } from '../components/common/AuthGuard';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route
        element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        }
      >
        <Route path="/" element={<Dashboard />} />
        
        {/* Projects Spine */}
        <Route
          path="/jobs"
          element={
            <ProtectedRoute permission="jobs.view">
              <JobsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <ProtectedRoute permission="jobs.view">
              <JobDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/boq"
          element={
            <ProtectedRoute permission="boq.view">
              <BOQListView />
            </ProtectedRoute>
          }
        />

        {/* Procurement & Materials */}
        <Route
          path="/purchases"
          element={
            <ProtectedRoute permission="purchases.view">
              <PurchasesView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute permission="inventory.view">
              <InventoryView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendors"
          element={
            <ProtectedRoute permission="partners.view">
              <VendorsView />
            </ProtectedRoute>
          }
        />

        {/* Site Execution & Labour */}
        <Route
          path="/sites"
          element={
            <ProtectedRoute permission="sites.view">
              <SitesManagementView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute permission="sites.view">
              <TasksView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute permission="labour.view">
              <EmployeesView />
            </ProtectedRoute>
          }
        />

        {/* Finance & Commercial */}
        <Route
          path="/clients"
          element={
            <ProtectedRoute permission="partners.view">
              <ClientsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <ProtectedRoute permission="billing.view">
              <AccountsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/pnl"
          element={
            <ProtectedRoute permission="reports.pnl_view">
              <ProfitLossReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/price-history"
          element={
            <ProtectedRoute permission="purchases.view">
              <PriceHistoryView />
            </ProtectedRoute>
          }
        />

        {/* Governance & Administration */}
        <Route
          path="/members"
          element={
            <ProtectedRoute permission="members.manage">
              <MembersView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute permission="roles.manage">
              <MembersView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute permission="audit.view">
              <AuditLogView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute permission="settings.manage">
              <SettingsView />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
