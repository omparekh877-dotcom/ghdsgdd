import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Home, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

interface BackButtonProps {
  onBack?: () => void;
  showBreadcrumb?: boolean;
  customBreadcrumbs?: BreadcrumbItem[];
  className?: string;
}

export default function BackButton({ 
  onBack, 
  showBreadcrumb = true, 
  customBreadcrumbs,
  className = "" 
}: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customBreadcrumbs) return customBreadcrumbs;

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', path: '/dashboard', icon: <Home className="w-3 h-3" /> }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      if (index === 0 && segment === 'dashboard') return; // Skip dashboard as it's already added
      
      let label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Custom labels for known routes
      const routeLabels: { [key: string]: string } = {
        'inventory': 'Inventory Management',
        'inventory-batches': 'Batch & Expiry Tracking',
        'payment-reminders': 'Payment Reminders',
        'whatsapp': 'WhatsApp Integration',
        'staff': 'Staff Management',
                'settings': 'Settings',
        'retailer': 'Shop Owner',
        'manufacturer': 'Manufacturer',
        'wholesaler': 'Wholesaler',
        'distributor': 'Distributor',
        'crm': 'Customer Relationship Management',
        'document-vault': 'Document Vault',
        'owner-analytics': 'Owner Analytics Dashboard',
        'vendor-management': 'Vendor Management'
      };

      if (routeLabels[segment]) {
        label = routeLabels[segment];
      }

      breadcrumbs.push({
        label,
        path: index === pathSegments.length - 1 ? undefined : currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = showBreadcrumb ? generateBreadcrumbs() : [];

  return (
    <div data-back-button className={`flex items-center gap-4 ${className}`}>
      {/* Back Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleBack}
        className="flex items-center gap-2 hover:bg-gray-50 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back</span>
        <Badge variant="outline" className="text-xs ml-1 hidden md:inline">
          B
        </Badge>
      </Button>

      {/* Breadcrumb Navigation */}
      {showBreadcrumb && breadcrumbs.length > 1 && (
        <nav className="flex items-center space-x-1 text-sm text-gray-600">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              <div className="flex items-center gap-1">
                {item.icon}
                {item.path ? (
                  <button
                    onClick={() => navigate(item.path!)}
                    className="hover:text-blue-600 transition-colors font-medium"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="text-gray-900 font-medium">{item.label}</span>
                )}
              </div>
            </React.Fragment>
          ))}
        </nav>
      )}
    </div>
  );
}
