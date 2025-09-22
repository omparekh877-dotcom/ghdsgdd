import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PieChart,
  LogOut,
  Menu,
  X,
  Crown,
  User,
  ChevronRight,
  TrendingUp,
  Calendar,
  Clock,
  Package,
  Users,
  UserCheck,
  Trophy,
  HelpCircle,
  MessageCircle,
  Search,
} from 'lucide-react';
import CommandPalette from '@/components/CommandPalette';
import { useGlobalShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { DashboardConfig } from '@shared/types';
import { DashboardShimmer } from '@/components/ui/shimmer';
import { usePermissions } from '@/lib/permissions';
import { generateDashboardConfig, getIconComponent, DASHBOARD_MODULES } from '@/lib/dashboard-config';
import { getBusinessModules, getBusinessTypeConfig } from '@/lib/business-modules';
import { authService, AuthUser, Business } from '@/lib/auth-service';
import { dataManager, BusinessMetrics } from '@/lib/data-manager';
import { useBranchContext } from '@/lib/use-branch-context';
import BranchSwitcher from '@/components/BranchSwitcher';
import NotificationsInbox from '@/components/NotificationsInbox';
import { planService } from '@/lib/plan-service';
import { PremiumBadge } from '@/components/PremiumGate';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);

  const permissions = usePermissions();
  const { canSwitchBranches } = useBranchContext();
  const isPremium = planService.isPremiumUser();

  // Initialize global shortcuts
  useGlobalShortcuts();

  useEffect(() => {
    // Listen for command palette open event
    const handleOpenCommandPalette = () => setCommandPaletteOpen(true);
    const handleGlobalEscape = () => setCommandPaletteOpen(false);

    window.addEventListener('openCommandPalette', handleOpenCommandPalette);
    window.addEventListener('globalEscape', handleGlobalEscape);

    return () => {
      window.removeEventListener('openCommandPalette', handleOpenCommandPalette);
      window.removeEventListener('globalEscape', handleGlobalEscape);
    };
  }, []);

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      navigate('/signin');
      return;
    }

    // Load user and business data
    const currentUser = authService.getCurrentUser();
    const businessData = authService.getBusinessData();

    if (currentUser && businessData) {
      setUser(currentUser);
      setBusiness(businessData);

      // Generate dashboard configuration
      const config = generateDashboardConfig(
        businessData.type,
        currentUser.role,
        currentUser.permissions
      );
      setDashboardConfig(config);

      // Get business-specific modules
      const businessModules = getBusinessModules(businessData.type, currentUser.role);
      console.log('Available business modules:', businessModules);

      // Load business metrics
      const businessMetrics = dataManager.getBusinessMetrics();
      setMetrics(businessMetrics);
    } else {
      navigate('/signin');
      return;
    }

    setIsLoading(false);
  }, [navigate]);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <DashboardShimmer />
        </div>
      </div>
    );
  }

  if (!user || !business || !dashboardConfig) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 max-w-full overflow-x-hidden">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">
                    {business.name}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Command Palette Trigger */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden sm:flex items-center gap-2 text-gray-500 hover:text-gray-700"
              >
                <Search className="w-4 h-4" />
                <span className="text-sm">Search...</span>
                <Badge variant="outline" className="text-xs">���K</Badge>
              </Button>

              {/* Mobile search button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCommandPaletteOpen(true)}
                className="sm:hidden"
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* Branch Switcher */}
              {canSwitchBranches && (
                <div className="hidden md:block">
                  <BranchSwitcher variant="header" />
                </div>
              )}

              {/* Notifications */}
              <NotificationsInbox />

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  {permissions.isOwner ? <Crown className="w-4 h-4 text-yellow-600" /> : <User className="w-4 h-4 text-gray-600" />}
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{permissions.userRole}</p>
                </div>
              </div>
              
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:transition-none`}>
          <div className="h-full flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="capitalize text-xs">
                  {permissions.businessType}
                </Badge>
                <Badge variant={permissions.isOwner ? 'default' : 'secondary'} className="text-xs">
                  {permissions.userRole}
                </Badge>
              </div>
            </div>
            
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {/* Business-specific modules */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {getBusinessTypeConfig(business.type).name}
                </h3>
                {getBusinessModules(business.type, user.role).slice(0, 5).map((module) => {
                  const IconComponent = getIconComponent(module.icon);
                  return (
                    <Link
                      key={module.id}
                      to={module.path}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="text-sm font-medium">{module.title}</span>
                      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  );
                })}
              </div>

              {/* Staff Management Section */}
              {(permissions.hasPermission('manage_team') || permissions.hasPermission('hrAndStaffAttendance')) && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Staff Management
                  </h3>

                  {permissions.hasPermission('manage_team') && (
                    <Link
                      to="/dashboard/staff"
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
                    >
                      <Users className="w-5 h-5" />
                      <span className="text-sm font-medium">Staff Directory</span>
                      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  )}

                  {(permissions.hasPermission('financialReports') || permissions.userRole === 'sales_staff') && (
                    <Link
                      to="/dashboard/staff/commission"
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
                    >
                      <Package className="w-5 h-5" />
                      <span className="text-sm font-medium">Sales Commission</span>
                      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  )}

                  <Link
                    to="/dashboard/staff/attendance"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
                  >
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">Staff Attendance</span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  {permissions.hasPermission('performanceDashboard') && (
                    <Link
                    to={isPremium ? "/dashboard/staff/leaderboard" : "/upgrade-to-premium"}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
                  >
                    <Trophy className="w-5 h-5" />
                    <span className="text-sm font-medium flex items-center gap-2">
                      Staff Leaderboard
                      {!isPremium && <Crown className="w-3 h-3 text-yellow-600" aria-label="Premium" />}
                    </span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  )}

                  <Link
                    to={isPremium ? "/dashboard/tasks/assignment" : "/upgrade-to-premium"}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
                  >
                    <UserCheck className="w-5 h-5" />
                    <span className="text-sm font-medium flex items-center gap-2">
                      Task Assignment
                      {!isPremium && <Crown className="w-3 h-3 text-yellow-600" aria-label="Premium" />}
                    </span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <Link
                    to={isPremium ? "/dashboard/staff/support" : "/upgrade-to-premium"}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
                  >
                    <HelpCircle className="w-5 h-5" />
                    <span className="text-sm font-medium flex items-center gap-2">
                      Support Tickets
                      {!isPremium && <Crown className="w-3 h-3 text-yellow-600" aria-label="Premium" />}
                    </span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  <Link
                    to="/dashboard/chat"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Internal Chat</span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>

                  {permissions.hasPermission('performanceDashboard') && (
                    <Link
                      to="/dashboard/staff/performance"
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
                    >
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-sm font-medium">Performance Reports</span>
                      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  )}
                </div>
              )}

              {/* Core modules */}
              {dashboardConfig && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Core Features
                  </h3>
                  {dashboardConfig.primaryWidgets.map((module) => {
                    const IconComponent = getIconComponent(module.icon);
                    return (
                      <Link
                        key={module.id}
                        to={module.path}
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-sm font-medium">{module.title}</span>
                        <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    );
                  })}
                  <Link
                    to="/dashboard/account"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors group"
                  >
                    <PieChart className="w-5 h-5" />
                    <span className="text-sm font-medium">Account</span>
                    <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-0">
          <div className="max-w-7xl mx-auto p-6">
            {/* Welcome Section */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, {user.name}
                  </h1>
                  <p className="text-gray-600 mt-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Managing your {permissions.businessType.toLowerCase()} business
                  </p>
                </div>
                
                <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                  {/* Owner Analytics Button */}
                  {permissions.isOwner && (
                    <Link to="/dashboard/owner-analytics">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Analytics
                      </Button>
                    </Link>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    Online now
                  </div>
                </div>
              </div>
            </div>


            {/* Quick Stats Dashboard */}
            {permissions.hasPermission('view_basic_analytics') && (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-100">Total Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-200" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{metrics?.totalRevenue.toFixed(2) || '0.00'}</div>
                    <p className="text-xs text-blue-100">
                      {metrics?.monthlyGrowth ?
                        `${metrics.monthlyGrowth > 0 ? '+' : ''}${metrics.monthlyGrowth.toFixed(1)}% from last month` :
                        'Track your revenue growth'
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-100">Active Orders</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-200" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-green-100">
                      No orders yet
                    </p>
                  </CardContent>
                </Card>

                {permissions.hasPermission('manage_team') ? (
                  <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-purple-100">Team Members</CardTitle>
                      <Users className="h-4 w-4 text-purple-200" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metrics?.teamMembers || 0}</div>
                      <p className="text-xs text-purple-100">
                        {metrics?.teamMembers ? 'Active team members' : 'No staff added yet'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-purple-100">Customers</CardTitle>
                      <TrendingUp className="h-4 w-4 text-purple-200" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metrics?.customerCount || 0}</div>
                      <p className="text-xs text-purple-100">
                        {metrics?.customerCount ? 'Total customers' : 'No customers yet'}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {permissions.hasPermission('manage_team') ? (
                  <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-orange-100">Active Tasks</CardTitle>
                      <UserCheck className="h-4 w-4 text-orange-200" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metrics?.activeTasks || 0}</div>
                      <p className="text-xs text-orange-100">
                        {metrics?.activeTasks ? 'Pending completion' : 'No active tasks'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-orange-100">Growth Rate</CardTitle>
                      <TrendingUp className="h-4 w-4 text-orange-200" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metrics?.monthlyGrowth ? `${metrics.monthlyGrowth > 0 ? '+' : ''}${metrics.monthlyGrowth.toFixed(1)}%` : '0%'}</div>
                      <p className="text-xs text-orange-100">
                        {metrics?.monthlyGrowth ? 'Monthly growth rate' : 'Growth will appear here'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Business-Specific Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {getBusinessTypeConfig(business.type).name} Features
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {getBusinessModules(business.type, user.role)
                  .filter(m => m.id !== "sales-documents" && m.id !== "main-dashboard")
                  .slice(0, 4)
                  .map((module) => {
                  const IconComponent = getIconComponent(module.icon);
                  return (
                    <Link key={module.id} to={module.path}>
                      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-0 shadow-md aspect-square flex">
                        <CardHeader>
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 bg-gradient-to-br from-${getBusinessTypeConfig(business.type).primaryColor}-100 to-${getBusinessTypeConfig(business.type).primaryColor}-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <IconComponent className={`w-6 h-6 text-${getBusinessTypeConfig(business.type).primaryColor}-600`} />
                            </div>
                            <div>
                              <CardTitle className={`text-lg group-hover:text-${getBusinessTypeConfig(business.type).primaryColor}-600 transition-colors`}>
                                {module.title}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                {module.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Manufacturer Production/Recipe Tabs (manufacturer only) */}
            {permissions.businessType === 'manufacturer' && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Manufacturing</h2>
                <Tabs defaultValue="production" className="w-full">
                  <TabsList className="grid grid-cols-2 w-full gap-2">
                    <TabsTrigger value="production">Production</TabsTrigger>
                    <TabsTrigger value="recipe">Recipe</TabsTrigger>
                  </TabsList>
                  <TabsContent value="production">
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <CardTitle className="text-lg">Plan Production</CardTitle>
                            <CardDescription>Create production orders, assign staff, and estimate costs</CardDescription>
                          </div>
                          <Link to="/dashboard/manufacturer/production">
                            <Button size="sm" className="w-full sm:w-auto">Open Production</Button>
                          </Link>
                        </div>
                      </CardHeader>
                    </Card>
                  </TabsContent>
                  <TabsContent value="recipe">
                    <Card className="border-0 shadow-md">
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <CardTitle className="text-lg">Manage Recipes</CardTitle>
                            <CardDescription>Define material breakdowns and live unit costs</CardDescription>
                          </div>
                          <Link to="/dashboard/manufacturer/recipe">
                            <Button size="sm" className="w-full sm:w-auto">Open Recipes</Button>
                          </Link>
                        </div>
                      </CardHeader>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Staff Management Quick Actions */}
            {(permissions.hasPermission('manage_team') || permissions.hasPermission('hrAndStaffAttendance')) && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Staff Management</h2>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {permissions.hasPermission('manage_team') && (
                    <Link to="/dashboard/staff">
                      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-0 shadow-md aspect-square flex">
                        <CardHeader>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Users className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg group-hover:text-green-600 transition-colors">
                                Staff Directory
                              </CardTitle>
                              <CardDescription className="text-sm">
                                Manage team members and roles
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  )}

                  <Link to="/dashboard/staff/attendance">
                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-0 shadow-md aspect-square flex">
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Clock className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                              Attendance
                            </CardTitle>
                            <CardDescription className="text-sm">
                              Track check-ins and leave
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>

                  {permissions.hasPermission('performanceDashboard') && (
                    <Link to="/dashboard/staff/leaderboard">
                      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-0 shadow-md aspect-square flex">
                        <CardHeader>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Trophy className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg group-hover:text-yellow-600 transition-colors">
                                Leaderboard
                              </CardTitle>
                              <CardDescription className="text-sm">
                                Performance rankings
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  )}

                  <Link to="/dashboard/chat">
                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-0 shadow-md aspect-square flex">
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <MessageCircle className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                              Team Chat
                            </CardTitle>
                            <CardDescription className="text-sm">
                              Internal communication
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                </div>
              </div>
            )}

            {/* Core Quick Actions */}
            {dashboardConfig && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {dashboardConfig.quickActions.map((module) => {
                    const IconComponent = getIconComponent(module.icon);
                    return (
                      <Link key={module.id} to={module.path}>
                        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-0 shadow-md aspect-square flex">
                          <CardHeader>
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <IconComponent className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                                  {module.title}
                                </CardTitle>
                                <CardDescription className="text-sm">
                                  {module.description}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <Card className="shadow-md border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest updates and activities in your business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">New order received</p>
                      <p className="text-sm text-gray-500">Recent order completed</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                      <Badge variant="secondary" className="text-xs">New</Badge>
                    </div>
                  </div>

                  {permissions.hasPermission('addEditDeleteProducts') && (
                    <div className="flex items-center space-x-4 p-3 rounded-lg bg-green-50 border border-green-100">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">Inventory updated</p>
                        <p className="text-sm text-gray-500">Products updated in inventory</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">1 hour ago</p>
                        <Badge variant="outline" className="text-xs">Inventory</Badge>
                      </div>
                    </div>
                  )}

                  {permissions.hasPermission('hrAndStaffAttendance') && (
                    <div className="flex items-center space-x-4 p-3 rounded-lg bg-purple-50 border border-purple-100">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">Team member joined</p>
                        <p className="text-sm text-gray-500">New team member added</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">3 hours ago</p>
                        <Badge variant="outline" className="text-xs">HR</Badge>
                      </div>
                    </div>
                  )}

                  {permissions.hasPermission('assignTasksOrRoutes') && (
                    <div className="flex items-center space-x-4 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">Task completed</p>
                        <p className="text-sm text-gray-500">Monthly report generated</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">5 hours ago</p>
                        <Badge variant="outline" className="text-xs">Tasks</Badge>
                      </div>
                    </div>
                  )}

                  {(permissions.hasPermission('financialReports') || permissions.userRole === 'sales_staff') && (
                    <div className="flex items-center space-x-4 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                      <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">Commission earned</p>
                        <p className="text-sm text-gray-500">Commission processed for sales team</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">1 day ago</p>
                        <Badge variant="outline" className="text-xs">Commission</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
