import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import ProfessionalInvoice from '@/components/ProfessionalInvoice';
import BackButton from '@/components/BackButton';
import { useToast } from '@/hooks/use-toast';
import { saleInvoiceRepository } from '@/services/indexeddb/repositories/saleInvoiceRepository';
import { toBePaidRepository } from '@/services/indexeddb/repositories/toBePaidRepository';
import { productRepository } from '@/services/indexeddb/repositories/productRepository';
import { serviceRepository } from '@/services/indexeddb/repositories/serviceRepository';
import { dataManager } from '@/lib/data-manager';
import { professionalInvoiceService } from '@/lib/professional-invoice-service';
import { authService } from '@/lib/auth-service';
import { getBusinessData } from '@/lib/business-data';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface LineItem { id: string; type: 'product' | 'service'; name: string; quantity: number; unitPrice: number; isCustom?: boolean; }

interface FormState {
  productId: string;
  productLabel: string;
  customProductName?: string;
  productQty?: number;
  productUnitPrice?: number;
  taxRate: number; // 0 | 5 | 12 | 18 | 28
  paymentMode: 'Cash' | 'UPI' | 'Card' | '';
  paymentStatus: 'Pending' | 'Paid' | '';
  customerPhone: string;
  customerName?: string;
  salespersonId?: string;
  commissionRatePct?: number;
  description?: string;
  serviceId?: string;
  serviceQty?: number;
  serviceUnitPrice?: number;
  customServiceName?: string;
}

export default function NewSale() {
  const { toast } = useToast();
  const [products, setProducts] = useState<{ id: string; name: string; sku?: string; costPerUnit?: number }[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; serviceCharge: number }[]>([]);
  const [items, setItems] = useState<LineItem[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [generated, setGenerated] = useState<{ invoiceId: string; invoiceNumber: string; phone: string; data: any } | null>(null);
  const [sendVia, setSendVia] = useState<'SMS'|'WhatsApp'|'Email'>("SMS");
  const [form, setForm] = useState<FormState>({
    productId: '',
    productLabel: '',
    productQty: 1,
    productUnitPrice: 0,
    taxRate: 0,
    paymentMode: 'Cash',
    paymentStatus: 'Paid',
    customerPhone: '',
    customerName: '',
    salespersonId: '',
    commissionRatePct: 0,
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    productRepository.getAll().then(setProducts).catch(() => setProducts([]));
    serviceRepository.getAll().then(setServices).catch(() => setServices([]));
    setStaff(dataManager.getAllStaff());
  }, []);

  const selectedProduct = useMemo(() => products.find(p => p.id === form.productId), [products, form.productId]);

  const subtotal = useMemo(() => items.reduce((s,i)=> s + (Number(i.quantity)||0) * (Number(i.unitPrice)||0), 0), [items]);
  const taxAmount = useMemo(() => (subtotal * (form.taxRate || 0)) / 100, [subtotal, form.taxRate]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);
  const commissionAmount = useMemo(() => ((form.commissionRatePct||0) > 0 ? (subtotal * (form.commissionRatePct||0)) / 100 : 0), [subtotal, form.commissionRatePct]);

  const phoneValid = useMemo(() => {
    const normalized = (form.customerPhone || '').replace(/\s+/g, '');
    return /^\+?[1-9]\d{7,14}$/.test(normalized);
  }, [form.customerPhone]);

  const canGenerate = items.length > 0 && phoneValid && !!form.paymentMode && !!form.paymentStatus;

  const onProductChange = (id: string) => {
    const p = products.find(pp => pp.id === id);
    setForm(prev => ({
      ...prev,
      productId: id,
      productLabel: p ? `${p.name}${p.sku ? ` (${p.sku})` : ''}` : '',
      productUnitPrice: p?.costPerUnit ?? prev.productUnitPrice
    }));
  };

  const addProductItem = () => {
    const usingCustom = (form.customProductName || '').trim().length > 0;
    if (!usingCustom && !form.productId) return;
    const name = usingCustom ? String(form.customProductName) : (products.find(p=>p.id===form.productId)?.name || form.productLabel || 'Product');
    const qty = Math.max(1, Number(form.productQty || 1));
    const unitPrice = Number(form.productUnitPrice || 0);
    const id = usingCustom ? `custom_${Date.now()}` : form.productId;
    setItems(prev => [...prev, { id, type: 'product', name, quantity: qty, unitPrice, isCustom: usingCustom }]);
    setForm(prev => ({ ...prev, productId: '', productLabel: '', customProductName: '', productQty: 1, productUnitPrice: 0 }));
  };

  const addServiceItem = () => {
    if (!form.serviceId) return;
    const svc = services.find(s => s.id === form.serviceId);
    if (!svc) return;
    const qty = Math.max(1, Number(form.serviceQty || 1));
    const price = Number(form.serviceUnitPrice ?? svc.serviceCharge ?? 0);
    setItems(prev => [...prev, { id: svc.id, type: 'service', name: svc.name, quantity: qty, unitPrice: price }]);
    setForm(prev => ({ ...prev, serviceId: '', serviceQty: 1, serviceUnitPrice: price }));
  };

  const addCustomService = () => {
    const name = (form.customServiceName || '').trim();
    if (!name) return;
    const qty = Math.max(1, Number(form.serviceQty || 1));
    const price = Number(form.serviceUnitPrice || 0);
    setItems(prev => [...prev, { id: `custom_${Date.now()}`, type: 'service', name, quantity: qty, unitPrice: price, isCustom: true }]);
    setForm(prev => ({ ...prev, customServiceName: '', serviceQty: 1 }));
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_,i)=>i!==idx));
  };

  const nextInvoiceNumber = () => {
    const y = new Date();
    const key = 'invoice_seq_' + y.getFullYear() + String(y.getMonth() + 1).padStart(2, '0');
    const current = Number(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, String(current));
    return `INV-${y.getFullYear()}${String(y.getMonth() + 1).padStart(2, '0')}-${String(current).padStart(4, '0')}`;
  };

  const saveAsDraft = async () => {
    setSubmitting(true);
    try {
      const record: any = {
        invoiceDate: new Date().toISOString(),
        paymentMode: form.paymentMode || 'Cash',
        customerNumber: form.customerPhone,
        customerName: form.customerName || '',
        paymentStatus: 'Pending',
        subtotal,
        taxRate: form.taxRate,
        totalAmount: total,
        status: 'draft',
        salespersonId: form.salespersonId,
        commissionRatePct: form.commissionRatePct || 0,
        description: form.description,
        lineItems: items
      };
      await saleInvoiceRepository.add(record);
      toast({ title: 'Draft saved' });
    } catch (e) {
      toast({ title: 'Failed to save draft', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const generateInvoice = async () => {
    if (!canGenerate) return;
    setSubmitting(true);
    try {
      const invoiceNumber = nextInvoiceNumber();
      const salespersonName = staff.find(s=>s.id===form.salespersonId)?.name || '';

      const sale: any = {
        invoiceDate: new Date().toISOString(),
        taxRate: form.taxRate,
        subtotal,
        taxAmount,
        totalAmount: total,
        paymentMode: form.paymentMode,
        paymentStatus: form.paymentStatus,
        customerName: form.customerName || '',
        customerNumber: form.customerPhone,
        salespersonId: form.salespersonId,
        salespersonName,
        commissionRatePct: form.commissionRatePct || 0,
        commissionAmount,
        description: form.description,
        invoiceNumber,
        lineItems: items
      };

      const saved = await saleInvoiceRepository.add(sale);
      if (saved.paymentStatus === 'Pending') {
        await toBePaidRepository.add({ invoiceId: saved.id, customerNumber: saved.customerNumber, amount: saved.totalAmount });
      }

      const business = authService.getBusinessData();
      const invoiceItems = items.map(i => ({
        id: i.id,
        description: i.name,
        quantity: i.quantity,
        unit: i.type === 'service' ? 'service' : 'pcs',
        rate: i.unitPrice,
        amount: i.quantity * i.unitPrice
      }));

      const invoiceData = {
        id: saved.id,
        invoiceNumber,
        invoiceDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        customer: {
          name: sale.customerName || 'Customer',
          address: '',
          phone: sale.customerNumber,
          email: ''
        },
        items: invoiceItems,
        subtotal,
        totalDiscount: 0,
        taxAmount,
        totalAmount: total,
        totalInWords: professionalInvoiceService.convertToWords(total),
        notes: sale.description || '',
        paymentMode: form.paymentMode as any,
        paymentStatus: form.paymentStatus as any,
        salespersonName,
        commissionRatePct: form.commissionRatePct || 0,
        commissionAmount
      } as any;

      await professionalInvoiceService.generateAndStoreInvoice(invoiceData, {
        companyName: business?.name || 'Business',
        showTermsAndConditions: false,
        logoUrl: (getBusinessData() as any)?.logoUrl || undefined
      }, true);

      setGenerated({ invoiceId: saved.id, invoiceNumber, phone: sale.customerNumber, data: invoiceData });
      toast({ title: `Invoice ${invoiceNumber} generated. Review below and send.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to generate invoice', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const markPaid = async () => {
    setSubmitting(true);
    try {
      const invoices = await saleInvoiceRepository.getAll();
      const last = invoices[invoices.length - 1];
      if (last && last.paymentStatus === 'Pending') {
        await saleInvoiceRepository.update({ ...last, paymentStatus: 'Paid' } as any);
        await toBePaidRepository.markPaidByInvoiceId(last.id);
        toast({ title: 'Marked as fully paid' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const sendInvoice = (channel: 'SMS'|'WhatsApp'|'Email') => {
    if (!generated) return;
    const phone = (generated.phone || '').replace(/\s+/g, '');
    const origin = window.location.origin;
    const link = `${origin}/dashboard/document-vault`;
    const msg = encodeURIComponent(`Invoice ${generated.invoiceNumber}\nAmount: ₹${total.toFixed(2)}\nStatus: ${form.paymentStatus}\nLink: ${link}`);

    if (channel === 'WhatsApp') {
      if (!/^\+?[1-9]\d{7,14}$/.test(phone)) return;
      window.open(`https://wa.me/${phone.replace(/^\+/, '')}?text=${msg}`, '_blank');
    } else if (channel === 'SMS') {
      if (!/^\+?[1-9]\d{7,14}$/.test(phone)) return;
      window.open(`sms:${phone}?&body=${msg}`, '_self');
    } else {
      const subject = encodeURIComponent(`Invoice ${generated.invoiceNumber}`);
      const body = msg;
      window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Add Sale</h1>
        <BackButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - Desktop/Tablet */}
        <div className="hidden md:block lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Sale Details</CardTitle>
              <CardDescription>Fill out the details to generate invoice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Product */}
              <div className="space-y-2">
                <Label>Add Product</Label>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <Select value={form.productId} onValueChange={onProductChange}>
                    <SelectTrigger className="md:col-span-2"><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Or custom name" value={form.customProductName || ''} onChange={e=>setForm(prev=>({...prev, customProductName: e.target.value}))} />
                  <Input type="number" inputMode="numeric" min={1} placeholder="Qty" value={form.productQty || 1} onChange={e => setForm(prev => ({ ...prev, productQty: Number(e.target.value) }))} />
                  <Input type="number" inputMode="decimal" min={0} step={0.01} placeholder="Unit price" value={form.productUnitPrice || 0} onChange={e => setForm(prev => ({ ...prev, productUnitPrice: Number(e.target.value) }))} />
                </div>
                <div>
                  <Button type="button" variant="outline" className="h-11 w-full sm:w-auto" onClick={addProductItem}>Add Product</Button>
                </div>
              </div>

              {/* Add Service */}
              <div className="space-y-2">
                <Label>Add Service</Label>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <Select value={form.serviceId} onValueChange={v => setForm(prev => ({ ...prev, serviceId: v }))}>
                    <SelectTrigger className="md:col-span-2"><SelectValue placeholder="Select service" /></SelectTrigger>
                    <SelectContent>
                      {services.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} (₹{(s.serviceCharge||0).toFixed(2)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Or custom service" value={form.customServiceName || ''} onChange={e=>setForm(prev=>({...prev, customServiceName: e.target.value}))} />
                  <Input type="number" inputMode="numeric" min={1} placeholder="Qty" value={form.serviceQty || 1} onChange={e => setForm(prev => ({ ...prev, serviceQty: Number(e.target.value) }))} />
                  <Input type="number" inputMode="decimal" min={0} step={0.01} placeholder="Unit price" value={form.serviceUnitPrice || 0} onChange={e => setForm(prev => ({ ...prev, serviceUnitPrice: Number(e.target.value) }))} />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="button" variant="outline" className="h-11 w-full sm:w-auto" onClick={addServiceItem}>Add Service</Button>
                  <Button type="button" variant="outline" className="h-11 w-full sm:w-auto" onClick={addCustomService}>Add Custom Service</Button>
                </div>
              </div>

              {/* Line items table (desktop/tablet) */}
              {items.length > 0 && (
                <div className="space-y-2">
                  <Label>Line Items</Label>
                  <div className="table-enhanced overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">Item</th>
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-left">Qty</th>
                          <th className="px-4 py-2 text-left">Rate</th>
                          <th className="px-4 py-2 text-left">Tax %</th>
                          <th className="px-4 py-2 text-right">Line Total</th>
                          <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((i, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2 align-middle min-w-40">
                              <Input value={i.name} onChange={e=>setItems(prev=> prev.map((it,j)=> j===idx?{...it,name:e.target.value}:it))} />
                            </td>
                            <td className="px-4 py-2 align-middle capitalize">{i.type}</td>
                            <td className="px-4 py-2 align-middle min-w-28">
                              <Input type="number" min={1} value={i.quantity} onChange={e=>setItems(prev=> prev.map((it,j)=> j===idx?{...it,quantity:Number(e.target.value)}:it))} />
                            </td>
                            <td className="px-4 py-2 align-middle min-w-32">
                              <Input type="number" min={0} step={0.01} value={i.unitPrice} onChange={e=>setItems(prev=> prev.map((it,j)=> j===idx?{...it,unitPrice:Number(e.target.value)}:it))} />
                            </td>
                            <td className="px-4 py-2 align-middle text-center">{(form.taxRate || 0).toFixed(2)}</td>
                            <td className="px-4 py-2 align-middle text-right font-medium">₹{(i.quantity * i.unitPrice).toFixed(2)}</td>
                            <td className="px-4 py-2 align-middle text-center">
                              <Button size="sm" variant="ghost" onClick={()=>removeItem(idx)}>Remove</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tax & Payment */}
              <div>
                <Label>Tax rate (%)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.01}
                  placeholder="Optional"
                  value={Number.isFinite(form.taxRate) ? form.taxRate : ''}
                  onChange={e => setForm(prev => ({ ...prev, taxRate: e.target.value === '' ? 0 : Number(e.target.value) }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Payment mode</Label>
                  <RadioGroup value={form.paymentMode} onValueChange={(v: any) => setForm(prev => ({ ...prev, paymentMode: v }))} className="flex gap-4">
                    {['Cash','UPI','Card'].map(m => (
                      <div key={m} className="flex items-center space-x-2">
                        <RadioGroupItem id={`mode-${m}`} value={m} />
                        <Label htmlFor={`mode-${m}`}>{m}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label>Payment status</Label>
                  <RadioGroup value={form.paymentStatus} onValueChange={(v: any) => setForm(prev => ({ ...prev, paymentStatus: v }))} className="flex gap-4">
                    {['Pending','Paid'].map(s => (
                      <div key={s} className="flex items-center space-x-2">
                        <RadioGroupItem id={`status-${s}`} value={s} />
                        <Label htmlFor={`status-${s}`}>{s}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Customer phone</Label>
                  <Input placeholder="+91 98765 43210" inputMode="tel" value={form.customerPhone} onChange={e => setForm(prev => ({ ...prev, customerPhone: e.target.value }))} />
                  {!phoneValid && form.customerPhone && (
                    <p className="text-xs text-red-600 mt-1">Enter a valid phone (E.164)</p>
                  )}
                </div>
                <div>
                  <Label>Customer name</Label>
                  <Input value={form.customerName} onChange={e => setForm(prev => ({ ...prev, customerName: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Sales person</Label>
                  <Select value={form.salespersonId} onValueChange={v => setForm(prev => ({ ...prev, salespersonId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                    <SelectContent>
                      {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {form.salespersonId && (
                    <div className="mt-2">
                      <Label>Commission Rate (%)</Label>
                      <Input type="number" inputMode="decimal" min={0} max={100} step={0.01} value={form.commissionRatePct || 0} onChange={e=> setForm(prev=> ({...prev, commissionRatePct: Number(e.target.value)}))} />
                      <div className="text-sm text-gray-600 mt-1">Commission Amount: ₹{commissionAmount.toFixed(2)}</div>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Description/Notes</Label>
                  <Textarea rows={3} value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Left column - Mobile stepper */}
        <div className="md:hidden">
          <div className="space-y-3">
            {/* Step 1 */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Step 1: Add Product/Service</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Product */}
                <div className="space-y-2">
                  <Label>Product</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <Select value={form.productId} onValueChange={onProductChange}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Or custom name" value={form.customProductName || ''} onChange={e=>setForm(prev=>({...prev, customProductName: e.target.value}))} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input type="number" inputMode="numeric" min={1} placeholder="Qty" value={form.productQty || 1} onChange={e => setForm(prev => ({ ...prev, productQty: Number(e.target.value) }))} />
                      <Input type="number" inputMode="decimal" min={0} step={0.01} placeholder="Unit price" value={form.productUnitPrice || 0} onChange={e => setForm(prev => ({ ...prev, productUnitPrice: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <Button type="button" variant="outline" onClick={addProductItem}>Add Product</Button>
                </div>

                {/* Service */}
                <div className="space-y-2">
                  <Label>Service</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <Select value={form.serviceId} onValueChange={v => setForm(prev => ({ ...prev, serviceId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                      <SelectContent>
                        {services.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name} (₹{(s.serviceCharge||0).toFixed(2)})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Or custom service" value={form.customServiceName || ''} onChange={e=>setForm(prev=>({...prev, customServiceName: e.target.value}))} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input type="number" inputMode="numeric" min={1} placeholder="Qty" value={form.serviceQty || 1} onChange={e => setForm(prev => ({ ...prev, serviceQty: Number(e.target.value) }))} />
                      <Input type="number" inputMode="decimal" min={0} step={0.01} placeholder="Unit price" value={form.serviceUnitPrice || 0} onChange={e => setForm(prev => ({ ...prev, serviceUnitPrice: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={addServiceItem}>Add Service</Button>
                    <Button type="button" variant="outline" className="flex-1" onClick={addCustomService}>Add Custom</Button>
                  </div>
                </div>

                {/* Line items as cards */}
                {items.length > 0 && (
                  <div className="space-y-3">
                    {items.map((i, idx) => (
                      <div key={idx} className="product-card">
                        <div className="content-spacing">
                          <Input value={i.name} onChange={e=>setItems(prev=> prev.map((it,j)=> j===idx?{...it,name:e.target.value}:it))} />
                          <div className="grid grid-cols-2 gap-2">
                            <Input type="number" inputMode="numeric" min={1} value={i.quantity} onChange={e=>setItems(prev=> prev.map((it,j)=> j===idx?{...it,quantity:Number(e.target.value)}:it))} />
                            <Input type="number" inputMode="decimal" min={0} step={0.01} value={i.unitPrice} onChange={e=>setItems(prev=> prev.map((it,j)=> j===idx?{...it,unitPrice:Number(e.target.value)}:it))} />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground capitalize">{i.type}</span>
                            <span className="font-medium">₹{(i.quantity * i.unitPrice).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-end">
                            <Button size="sm" variant="ghost" onClick={()=>removeItem(idx)}>Remove</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Step 2: Customer Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Customer phone</Label>
                  <Input placeholder="+91 98765 43210" inputMode="tel" value={form.customerPhone} onChange={e => setForm(prev => ({ ...prev, customerPhone: e.target.value }))} />
                  {!phoneValid && form.customerPhone && (
                    <p className="text-xs text-red-600 mt-1">Enter a valid phone (E.164)</p>
                  )}
                </div>
                <div>
                  <Label>Customer name</Label>
                  <Input value={form.customerName} onChange={e => setForm(prev => ({ ...prev, customerName: e.target.value }))} />
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Step 3: Payment Info</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Payment mode</Label>
                  <RadioGroup value={form.paymentMode} onValueChange={(v: any) => setForm(prev => ({ ...prev, paymentMode: v }))} className="flex gap-4">
                    {['Cash','UPI','Card'].map(m => (
                      <div key={m} className="flex items-center space-x-2">
                        <RadioGroupItem id={`mode-m-${m}`} value={m} />
                        <Label htmlFor={`mode-m-${m}`}>{m}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label>Payment status</Label>
                  <RadioGroup value={form.paymentStatus} onValueChange={(v: any) => setForm(prev => ({ ...prev, paymentStatus: v }))} className="flex gap-4">
                    {['Pending','Paid'].map(s => (
                      <div key={s} className="flex items-center space-x-2">
                        <RadioGroupItem id={`status-m-${s}`} value={s} />
                        <Label htmlFor={`status-m-${s}`}>{s}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label>Sales person</Label>
                  <Select value={form.salespersonId} onValueChange={v => setForm(prev => ({ ...prev, salespersonId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                    <SelectContent>
                      {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {form.salespersonId && (
                    <div className="mt-2">
                      <Label>Commission Rate (%)</Label>
                      <Input type="number" inputMode="decimal" min={0} max={100} step={0.01} value={form.commissionRatePct || 0} onChange={e=> setForm(prev=> ({...prev, commissionRatePct: Number(e.target.value)}))} />
                      <div className="text-sm text-gray-600 mt-1">Commission Amount: ₹{commissionAmount.toFixed(2)}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Step 4: Notes + Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Description/Notes</Label>
                  <Textarea rows={3} value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} />
                </div>
                <div className="rounded-lg border p-3 bg-gray-50">
                  <div className="flex items-center justify-between text-sm"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                  <div className="flex items-center justify-between text-sm"><span>Tax ({form.taxRate || 0}%)</span><span>₹{taxAmount.toFixed(2)}</span></div>
                  <div className="flex items-center justify-between text-base font-semibold mt-1"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right column (sticky) */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 self-start hidden lg:block">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
              <CardDescription>Live calculation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tax ({form.taxRate || 0}%)</span>
                <span className="font-medium">₹{taxAmount.toFixed(2)}</span>
              </div>
              {form.salespersonId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Commission ({(form.commissionRatePct||0).toFixed(2)}%)</span>
                  <span className="font-medium">₹{commissionAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-lg font-semibold">₹{total.toFixed(2)}</span>
              </div>
              <div>
                {form.paymentStatus === 'Paid' ? (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Fully Paid</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Pending</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button onClick={generateInvoice} disabled={!canGenerate || submitting} className="w-full sm:w-auto">Generate Invoice</Button>
                <Button variant="outline" onClick={saveAsDraft} disabled={submitting} className="w-full sm:w-auto">Save as Draft</Button>
                {form.paymentStatus === 'Pending' && (
                  <Button variant="secondary" onClick={markPaid} disabled={submitting} className="w-full sm:w-auto">Mark Fully Paid</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile sticky bottom summary */}
      <div className="fixed md:hidden bottom-0 inset-x-0 z-40 px-4 pb-[env(safe-area-inset-bottom)] pt-2 bg-white/95 backdrop-blur border-t shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-lg font-semibold">₹{total.toFixed(2)}</div>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateInvoice} disabled={!canGenerate || submitting}>Generate</Button>
            <Button variant="outline" onClick={saveAsDraft} disabled={submitting}>Draft</Button>
          </div>
        </div>
      </div>

      {generated && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Invoice</CardTitle>
            <CardDescription>Review the invoice below, then click Send to share with the customer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfessionalInvoice invoiceData={generated.data} showActions={false} />
            <div className="flex flex-col sm:flex-row gap-3 items-end justify-between">
              <div className="text-sm text-gray-600">Invoice details are shown below.</div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="min-w-36 justify-between">
                    Send via {sendVia}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(['SMS','WhatsApp','Email'] as const).map(ch => (
                    <DropdownMenuItem key={ch} onSelect={(e) => { e.preventDefault(); setSendVia(ch); sendInvoice(ch); }}>
                      {ch}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
