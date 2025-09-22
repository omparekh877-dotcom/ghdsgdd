import "./global.css"

import { Toaster } from "@/components/ui/toaster"
import { createRoot } from "react-dom/client"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { ToastContainer } from "@/components/Toast"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Index from "./pages/Index"
import Signup from "./pages/Signup"
import Signin from "./pages/Signin"
import Dashboard from "./pages/Dashboard"
import AdvancedAnalytics from "./pages/dashboard/AdvancedAnalytics"
import AIAssistant from "./pages/dashboard/AIAssistant"
import Settings from "./pages/dashboard/Settings"
import ProtectedRoute from "./components/ProtectedRoute"
import { ThemeProvider } from "next-themes"
import ErrorBoundary from "./components/ErrorBoundary"
import Account from "./pages/dashboard/Account"
import BranchManagement from "./pages/dashboard/BranchManagement"
import StaffRequests from "./pages/StaffRequests"
import ImportBatchDetail from "./pages/dashboard/ImportBatchDetail"
import FloatingBackButton from "./components/FloatingBackButton"
import NotificationBell from "./components/NotificationBell"
// Business-specific components
import CustomerDatabase from "./pages/business/retailer/CustomerDatabase"
import Services from "./pages/business/retailer/Services"
import FinishedProductInventory from "./pages/business/manufacturer/FinishedProductInventory"
import RawMaterialInventory from "./pages/business/manufacturer/RawMaterialInventory"
// Manufacturer components
import RecipePage from "./pages/business/manufacturer/Recipe"
import ProductionPage from "./pages/business/manufacturer/Production"
import ProductionLogs from "./pages/business/manufacturer/ProductionLogs"
import AttendanceManagement from "./pages/staff/AttendanceManagement"
import PerformanceTracking from "./pages/staff/PerformanceTracking"
import StaffCommissionManagement from "./pages/staff/CommissionManagement"
import StaffLeaderboard from "./pages/staff/StaffLeaderboard"
import StaffAttendance from "./pages/staff/StaffAttendance"
import SupportTickets from "./pages/staff/SupportTickets"
import InternalChat from "./pages/InternalChat"
import TaskAssignment from "./pages/TaskAssignment"
import WhatsAppDashboard from "./pages/dashboard/WhatsAppDashboard"
import PaymentReminders from "./pages/dashboard/PaymentReminders"
import InventoryBatches from "./pages/dashboard/InventoryBatches"
import Inventory from "./pages/dashboard/InventoryEnhanced"
import NewSale from "./pages/sales/NewSale"
import SalesDocuments from "./pages/dashboard/SalesDocuments"
import InvoicePreview from "./pages/dashboard/InvoicePreview"
import ProductManagement from "./pages/dashboard/ProductManagement"
import OrderManagement from "./pages/dashboard/OrderManagement"
import StaffManagementSystem from "./pages/dashboard/StaffManagementSystem"
import StaffApprovals from "./pages/dashboard/StaffApprovals"
import AnalyticsSystem from "./pages/dashboard/AnalyticsSystem"
import PlaceholderPage from "./pages/PlaceholderPage"
import NotFound from "./pages/NotFound"
// New feature components
import CRM from "./pages/dashboard/CRM"
import DocumentVault from "./pages/dashboard/DocumentVault"
import OwnerAnalytics from "./pages/dashboard/OwnerAnalytics"
import PerformanceReports from "./pages/dashboard/PerformanceReports"
import UpgradeToPremium from "./pages/UpgradeToPremium"

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ErrorBoundary>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signin" element={<Signin />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Placeholder routes for future features */}
            <Route
              path="/demo"
              element={
                <PlaceholderPage
                  title="Product Demo"
                  description="Watch our comprehensive product demo to see how Insygth can transform your business operations."
                  feature="The interactive demo"
                />
              }
            />
            <Route
              path="/features"
              element={
                <PlaceholderPage
                  title="Features"
                  description="Explore all the powerful features that make Insygth the complete business management solution."
                  feature="The features page"
                />
              }
            />
            <Route
              path="/pricing"
              element={
                <PlaceholderPage
                  title="Pricing Plans"
                  description="Choose the perfect plan for your business needs with transparent, affordable pricing."
                  feature="Pricing information"
                />
              }
            />
            <Route
              path="/integrations"
              element={
                <PlaceholderPage
                  title="Integrations"
                  description="Connect Insygth with your favorite tools and services for seamless workflow."
                  feature="Integration marketplace"
                />
              }
            />
            <Route
              path="/about"
              element={
                <PlaceholderPage
                  title="About Us"
                  description="Learn more about our mission to empower businesses with intelligent management tools."
                  feature="Company information"
                />
              }
            />
            <Route
              path="/contact"
              element={
                <PlaceholderPage
                  title="Contact Us"
                  description="Get in touch with our team for support, sales inquiries, or partnership opportunities."
                  feature="Contact form"
                />
              }
            />
            <Route
              path="/support"
              element={
                <PlaceholderPage
                  title="Support Center"
                  description="Find help, documentation, and resources to get the most out of Insygth."
                  feature="Support resources"
                />
              }
            />
            <Route
              path="/privacy"
              element={
                <PlaceholderPage
                  title="Privacy Policy"
                  description="Learn how we protect your data and respect your privacy while using Insygth."
                  feature="Privacy policy"
                />
              }
            />

            {/* Dashboard sub-routes */}
            <Route path="/dashboard/account" element={<Account />} />
            <Route
              path="/dashboard/analytics"
              element={
                <ProtectedRoute requiredPermission="view_basic_analytics">
                  <AnalyticsSystem />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/advanced-analytics"
              element={
                <ProtectedRoute ownerOnly={true}>
                  <AdvancedAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/products"
              element={
                <ProtectedRoute requiredPermission="addEditDeleteProducts">
                  <ProductManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/orders"
              element={
                <ProtectedRoute requiredPermission="viewAddEditOrders">
                  <OrderManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/users"
              element={
                <PlaceholderPage
                  title="User Management"
                  description="Manage team members, roles, and permissions for your business."
                  feature="User management"
                />
              }
            />
            <Route
              path="/dashboard/financials"
              element={
                <PlaceholderPage
                  title="Financial Reports"
                  description="View P&L statements, EBITDA analysis, and comprehensive financial reporting."
                  feature="Financial reports"
                />
              }
            />
            <Route
              path="/dashboard/tasks"
              element={
                <ProtectedRoute requiredPermission="taskAndTodoManager">
                  <TaskAssignment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/hr"
              element={
                <PlaceholderPage
                  title="HR & Attendance"
                  description="Manage staff attendance, leave requests, and HR operations."
                  feature="HR management"
                />
              }
            />
            <Route
              path="/dashboard/assets"
              element={
                <PlaceholderPage
                  title="Asset Management"
                  description="Track business assets, liabilities, and resource allocation."
                  feature="Asset tracking"
                />
              }
            />
            <Route
              path="/dashboard/ai"
              element={
                <ProtectedRoute requiredPermission="view_ai_assistant">
                  <AIAssistant />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/qr-scanner"
              element={
                <PlaceholderPage
                  title="QR Code Scanner"
                  description="Scan QR codes for quick product lookup and data entry."
                  feature="QR scanner"
                />
              }
            />
            <Route
              path="/dashboard/asset-tracker"
              element={
                <PlaceholderPage
                  title="Asset Tracker"
                  description="Real-time tracking of vehicles, equipment, and business assets."
                  feature="Asset tracker"
                />
              }
            />
            <Route
              path="/dashboard/performance"
              element={
                <ProtectedRoute requiredPermission="performanceDashboard">
                  <PerformanceTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/todo"
              element={
                <PlaceholderPage
                  title="Task & To-Do Manager"
                  description="Personal and team task management with priorities and deadlines."
                  feature="Todo management"
                />
              }
            />
            <Route
              path="/dashboard/chat"
              element={
                <ProtectedRoute requiredPermission="internalTeamChat">
                  <InternalChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/attendance"
              element={
                <ProtectedRoute requiredPermission="leaveAndAttendance">
                  <AttendanceManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/activity-logs"
              element={
                <PlaceholderPage
                  title="Activity Logs"
                  description="Monitor user actions and system activity for security and auditing."
                  feature="Activity monitoring"
                />
              }
            />
            <Route
              path="/dashboard/branches"
              element={
                <ProtectedRoute ownerOnly={true}>
                  <BranchManagement />
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route
              path="/dashboard/export"
              element={
                <PlaceholderPage
                  title="Data Export"
                  description="Export business data to CSV, Excel, and other formats."
                  feature="Data export"
                />
              }
            />
            <Route
              path="/dashboard/import"
              element={
                <PlaceholderPage
                  title="Data Import"
                  description="Import data from CSV, Excel, and external sources."
                  feature="Data import"
                />
              }
            />

            {/* Staff Management Routes */}
            <Route
              path="/dashboard/staff"
              element={
                <ProtectedRoute requiredPermission="manage_team">
                  <StaffManagementSystem />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/staff/attendance"
              element={
                <ProtectedRoute requiredPermission="hrAndStaffAttendance">
                  <StaffAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/staff/requests"
              element={
                <ProtectedRoute ownerOnly={true}>
                  <StaffRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/staff/approvals"
              element={
                <ProtectedRoute ownerOnly={true}>
                  <StaffApprovals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/staff/commission"
              element={
                <ProtectedRoute requiredPermission="financialReports">
                  <StaffCommissionManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/staff/leaderboard"
              element={
                <ProtectedRoute requiredPermission="performanceDashboard">
                  <StaffLeaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/staff/support"
              element={
                <ProtectedRoute>
                  <SupportTickets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/tasks/assignment"
              element={
                <ProtectedRoute requiredPermission="assignTasksOrRoutes">
                  <TaskAssignment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/whatsapp"
              element={
                <ProtectedRoute requiredPermission="manage_settings">
                  <WhatsAppDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/payment-reminders"
              element={
                <ProtectedRoute requiredPermission="viewAddEditOrders">
                  <PaymentReminders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/inventory-batches"
              element={
                <ProtectedRoute requiredPermission="addEditDeleteProducts">
                  <InventoryBatches />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/inventory"
              element={
                <ProtectedRoute requiredPermission="addEditDeleteProducts">
                  <Inventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/new"
              element={
                <ProtectedRoute requiredPermission="viewAddEditOrders">
                  <NewSale />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/sales-documents"
              element={
                <ProtectedRoute requiredPermission="viewAddEditOrders">
                  <SalesDocuments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/sales-documents/invoice/:invoiceId"
              element={
                <ProtectedRoute requiredPermission="viewAddEditOrders">
                  <InvoicePreview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/imports/:batchId"
              element={
                <ProtectedRoute>
                  <ImportBatchDetail />
                </ProtectedRoute>
              }
            />

            {/* New Enhanced Features */}
            <Route
              path="/dashboard/crm"
              element={
                <ProtectedRoute requiredPermission="viewAddEditOrders">
                  <CRM />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/document-vault"
              element={
                <ProtectedRoute requiredPermission="viewAddEditOrders">
                  <DocumentVault />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/owner-analytics"
              element={
                <ProtectedRoute ownerOnly={true}>
                  <OwnerAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/staff/performance"
              element={
                <ProtectedRoute requiredPermission="performanceDashboard">
                  <PerformanceReports />
                </ProtectedRoute>
              }
            />

            {/* Business-specific module routes */}
            {/* Retailer specific routes */}
            <Route
              path="/dashboard/retailer/customers"
              element={
                <ProtectedRoute requiredPermission="viewAddEditOrders">
                  <CustomerDatabase />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/retailer/services"
              element={
                <ProtectedRoute requiredPermission="addEditDeleteProducts">
                  <Services />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/retailer/inventory"
              element={
                <PlaceholderPage
                  title="Shop Owner Inventory"
                  description="Advanced inventory management with stock tracking, variants, and alerts."
                  feature="Retail inventory system"
                />
              }
            />
            <Route
              path="/dashboard/retailer/offers"
              element={
                <PlaceholderPage
                  title="Offers & Promotions"
                  description="Create and manage time-limited discounts and combo offers."
                  feature="Promotion management"
                />
              }
            />
            <Route
              path="/dashboard/retailer/expenses"
              element={
                <PlaceholderPage
                  title="Expense Tracking"
                  description="Track daily and monthly business expenses with categorization."
                  feature="Expense management"
                />
              }
            />
            <Route
              path="/dashboard/retailer/sales-analytics"
              element={
                <PlaceholderPage
                  title="Sales Analytics"
                  description="Detailed sales reports with visual trends and insights."
                  feature="Sales analytics"
                />
              }
            />
            <Route
              path="/dashboard/retailer/gst-reports"
              element={
                <PlaceholderPage
                  title="GST Reports"
                  description="Generate and download GST filing data and compliance reports."
                  feature="GST reporting"
                />
              }
            />
            <Route
              path="/dashboard/retailer/catalog-sharing"
              element={
                <PlaceholderPage
                  title="Catalog Sharing"
                  description="Share product catalogs via PDF/WhatsApp"
                  feature="Catalog sharing"
                />
              }
            />
            <Route
              path="/dashboard/retailer/inventory-sync"
              element={
                <PlaceholderPage
                  title="Multi-Branch Inventory Sync"
                  description="Synchronize inventory across multiple retail locations"
                  feature="Inventory synchronization"
                />
              }
            />

            {/* Manufacturer specific routes */}
            <Route
              path="/dashboard/manufacturer/recipe"
              element={
                <ProtectedRoute requiredPermission="addEditDeleteProducts">
                  <RecipePage />
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard/manufacturer/finished-product-inventory" element={<FinishedProductInventory />} />
            <Route path="/dashboard/manufacturer/raw-material-inventory" element={<RawMaterialInventory />} />
            <Route
              path="/dashboard/manufacturer/production"
              element={
                <ProtectedRoute requiredPermission="addEditDeleteProducts">
                  <ProductionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/manufacturer/production-logs"
              element={
                <ProtectedRoute requiredPermission="addEditDeleteProducts">
                  <ProductionLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/manufacturer/production-planning"
              element={
                <PlaceholderPage
                  title="Production Planning"
                  description="Plan and schedule production runs with resource allocation."
                  feature="Production planning"
                />
              }
            />
            <Route
              path="/dashboard/manufacturer/waste-tracking"
              element={
                <PlaceholderPage
                  title="Waste Tracking"
                  description="Monitor and analyze production waste and loss."
                  feature="Waste management"
                />
              }
            />
            <Route
              path="/dashboard/manufacturer/cost-per-unit"
              element={
                <PlaceholderPage
                  title="Cost per Unit Calculator"
                  description="Calculate precise manufacturing costs per unit."
                  feature="Cost calculation"
                />
              }
            />
            <Route
              path="/dashboard/manufacturer/dispatch"
              element={
                <PlaceholderPage
                  title="Dispatch Management"
                  description="Manage finished goods dispatch and delivery."
                  feature="Dispatch management"
                />
              }
            />
            <Route
              path="/dashboard/manufacturer/purchase-orders"
              element={
                <PlaceholderPage
                  title="Purchase Order Management"
                  description="Manage supplier purchase orders and procurement."
                  feature="Purchase order system"
                />
              }
            />
            <Route
              path="/dashboard/manufacturer/staff-productivity"
              element={
                <PlaceholderPage
                  title="Staff Productivity Tracker"
                  description="Track and analyze staff productivity metrics."
                  feature="Productivity tracking"
                />
              }
            />
            <Route
              path="/dashboard/manufacturer/vendor-management"
              element={
                <PlaceholderPage
                  title="Vendor Management"
                  description="Manage supplier relationships and performance."
                  feature="Vendor management"
                />
              }
            />
            <Route
              path="/dashboard/manufacturer/sales-commission"
              element={
                <ProtectedRoute requiredPermission="financialReports">
                  <StaffCommissionManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/manufacturer/multi-branch-sync"
              element={
                <PlaceholderPage
                  title="Multi-Branch Sync"
                  description="Synchronize data across manufacturing locations."
                  feature="Multi-branch sync"
                />
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}

            <Route
              path="/upgrade-to-premium"
              element={
                <ProtectedRoute>
                  <UpgradeToPremium />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingBackButton />
        </BrowserRouter>
        <ToastContainer />
        <NotificationBell />
      </ErrorBoundary>
    </ThemeProvider>
  </QueryClientProvider>
)

{
  const container = document.getElementById("root")!
  const w = window as any
  const root = w.__insygth_root ?? createRoot(container)
  root.render(<App />)
  w.__insygth_root = root
}
