import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Archive,
  TrendingDown,
  Calendar,
  Warehouse,
  Settings
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions';
import { inventoryService } from '@/lib/inventory-service';
import { formatCurrency } from '@/lib/business-data';
import { dataManager } from '@/lib/data-manager';
import BackButton from '@/components/BackButton';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  lastUpdated: string;
}

// Inventory products are now loaded from data manager - no mock data

export default function Inventory() {
  const permissions = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Load products from data manager
    const loadedProducts = dataManager.getAllProducts().map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      price: p.price,
      stock: p.stock,
      minStock: p.lowStockThreshold || 10,
      status: p.isActive ? (p.stock > 0 ? 'active' : 'out_of_stock') : 'inactive',
      lastUpdated: new Date().toISOString().split('T')[0]
    }));
    setProducts(loadedProducts);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Load data from inventory service
    setLowStockProducts(inventoryService.getLowStockProducts());
    setExpiryAlerts(inventoryService.getExpiryAlerts(false));
  }, []);

  if (!permissions.hasPermission('addEditDeleteProducts')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-500">You don't have permission to access inventory management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);

  const getStatusColor = (status: Product['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusColor = (stock: number, minStock: number) => {
    if (stock === 0) return 'text-red-600';
    if (stock <= minStock) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <BackButton className="mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            Inventory Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage products, stock levels, and inventory alerts
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/inventory-batches'}>
            <Calendar className="w-4 h-4 mr-2" />
            Batch Tracking
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {(lowStockCount > 0 || outOfStockCount > 0 || expiryAlerts.length > 0) && (
        <div className="space-y-4">
          {outOfStockCount > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-red-800">
                    {outOfStockCount} product(s) are out of stock!
                  </span>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                    Restock Now
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {lowStockCount > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-orange-800">
                    {lowStockCount} product(s) are running low on stock
                  </span>
                  <Button variant="outline" size="sm" className="text-orange-600 border-orange-200">
                    Review Stock
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {expiryAlerts.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-yellow-800">
                    {expiryAlerts.length} product batch(es) are expiring soon
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-yellow-600 border-yellow-200"
                    onClick={() => window.location.href = '/dashboard/inventory-batches'}
                  >
                    View Batches
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold mt-2">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold mt-2 text-orange-600">{lowStockCount}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold mt-2 text-red-600">{outOfStockCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold mt-2">{formatCurrency(totalValue)}</p>
              </div>
              <Warehouse className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid grid-cols-3 sm:grid-cols-3 gap-2">
          <TabsTrigger value="products">All Products</TabsTrigger>
          <TabsTrigger value="lowstock">Low Stock ({lowStockCount})</TabsTrigger>
          <TabsTrigger value="outofstock">Out of Stock ({outOfStockCount})</TabsTrigger>
        </TabsList>

        {/* All Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Inventory</CardTitle>
              <CardDescription>
                Manage your product catalog and stock levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search products by name or SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Products List */}
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        product.status === 'out_of_stock' ? 'bg-red-100 text-red-600' :
                        product.stock <= product.minStock ? 'bg-orange-100 text-orange-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          SKU: {product.sku} • Category: {product.category}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm font-medium">
                            Price: {formatCurrency(product.price)}
                          </span>
                          <span className={`text-sm font-medium ${getStockStatusColor(product.stock, product.minStock)}`}>
                            Stock: {product.stock} units
                          </span>
                          <Badge className={getStatusColor(product.status)}>
                            {product.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 justify-start sm:justify-end">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No products found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sticky mobile action bar */}
        <div className="fixed bottom-0 inset-x-0 z-40 md:hidden px-4 pb-[env(safe-area-inset-bottom)] pt-2 bg-white/95 backdrop-blur border-t shadow-lg">
          <div className="flex gap-2">
            <Button className="flex-1">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => (window.location.href = '/dashboard/inventory-batches')}>
              <Calendar className="w-4 h-4 mr-2" /> Batches
            </Button>
          </div>
        </div>

        {/* Low Stock Tab */}
        <TabsContent value="lowstock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-600" />
                Low Stock Products
              </CardTitle>
              <CardDescription>
                Products that need restocking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.filter(p => p.stock <= p.minStock && p.stock > 0).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 rounded-lg border border-orange-200 bg-orange-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center">
                        <TrendingDown className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          Current: {product.stock} • Minimum: {product.minStock}
                        </p>
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-orange-500 h-2 rounded-full" 
                            style={{ width: `${Math.min((product.stock / product.minStock) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Restock
                    </Button>
                  </div>
                ))}

                {products.filter(p => p.stock <= p.minStock && p.stock > 0).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                    <p>All products are adequately stocked</p>
                    <p className="text-sm">No low stock alerts at this time</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Out of Stock Tab */}
        <TabsContent value="outofstock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Out of Stock Products
              </CardTitle>
              <CardDescription>
                Products that are completely out of stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.filter(p => p.stock === 0).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-200 text-red-700 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          SKU: {product.sku} • Last updated: {product.lastUpdated}
                        </p>
                        <p className="text-sm text-red-600 font-medium">
                          URGENT: Immediate restocking required
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Archive className="w-4 h-4 mr-2" />
                        Deactivate
                      </Button>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Urgent Restock
                      </Button>
                    </div>
                  </div>
                ))}

                {products.filter(p => p.stock === 0).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                    <p>No products are out of stock</p>
                    <p className="text-sm">All products have available inventory</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
