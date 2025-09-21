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
  const [sendVia, setSendVia] = useState<'SMS'|'WhatsApp'>('SMS');
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Add Sale</h1>
        <BackButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sale Details</CardTitle>
            <CardDescription>Fill out the details to generate invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

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
                <Input type="number" min={1} placeholder="Qty" value={form.productQty || 1} onChange={e => setForm(prev => ({ ...prev, productQty: Number(e.target.value) }))} />
                <Input type="number" min={0} step={0.01} placeholder="Unit price" value={form.productUnitPrice || 0} onChange={e => setForm(prev => ({ ...prev, productUnitPrice: Number(e.target.value) }))} />
              </div>
              <div>
                <Button type="button" variant="outline" className="h-11 w-full sm:w-auto" onClick={addProductItem}>Add Product</Button>
              </div>
            </div>

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
                <Input type="number" min={1} placeholder="Qty" value={form.serviceQty || 1} onChange={e => setForm(prev => ({ ...prev, serviceQty: Number(e.target.value) }))} />
                <Input type="number" min={0} step={0.01} placeholder="Unit price" value={form.serviceUnitPrice || 0} onChange={e => setForm(prev => ({ ...prev, serviceUnitPrice: Number(e.target.value) }))} />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" className="h-11 w-full sm:w-auto" onClick={addServiceItem}>Add Service</Button>
                <Button type="button" variant="outline" className="h-11 w-full sm:w-auto" onClick={addCustomService}>Add Custom Service</Button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="space-y-2">
                <Label>Line Items</Label>
                {items.map((i,idx)=> (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-2 border rounded items-center">
                    <Input value={i.name} onChange={e=>setItems(prev=> prev.map((it,j)=> j===idx?{...it,name:e.target.value}:it))} />
                    <span className="text-xs text-gray-500">{i.type}</span>
                    <Input type="number" min={1} value={i.quantity} onChange={e=>setItems(prev=> prev.map((it,j)=> j===idx?{...it,quantity:Number(e.target.value)}:it))} />
                    <Input type="number" min={0} step={0.01} value={i.unitPrice} onChange={e=>setItems(prev=> prev.map((it,j)=> j===idx?{...it,unitPrice:Number(e.target.value)}:it))} />
                    <div className="text-right font-medium">₹{(i.quantity*i.unitPrice).toFixed(2)}</div>
                    <Button size="sm" variant="ghost" onClick={()=>removeItem(idx)}>Remove</Button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <Label>Tax rate (%)</Label>
              <Input
                type="number"
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
                <Input placeholder="+91 98765 43210" value={form.customerPhone} onChange={e => setForm(prev => ({ ...prev, customerPhone: e.target.value }))} />
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
                    <Input type="number" min={0} max={100} step={0.01} value={form.commissionRatePct || 0} onChange={e=> setForm(prev=> ({...prev, commissionRatePct: Number(e.target.value)}))} />
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
                <span className="font-medium">��{commissionAmount.toFixed(2)}</span>
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

      {generated && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Invoice</CardTitle>
            <CardDescription>Review the invoice below, then click Send to share with the customer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfessionalInvoice invoiceData={generated.data} showActions={false} />
            <div className="flex flex-col sm:flex-row gap-3 items-end justify-between">
              <div className="flex items-center gap-3">
                <Label className="text-sm">Send via</Label>
                <select
                  className="px-3 py-2 border rounded-md text-sm"
                  value={sendVia}
                  onChange={(e)=> setSendVia(e.target.value as any)}
                >
                  <option value="SMS">SMS</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>
              <Button
                onClick={() => {
                  const phone = (generated.phone || '').replace(/\s+/g, '');
                  const origin = window.location.origin;
                  const link = `${origin}/dashboard/document-vault`;
                  const msg = encodeURIComponent(`Invoice ${generated.invoiceNumber}\nAmount: ₹${total.toFixed(2)}\nStatus: ${form.paymentStatus}\nLink: ${link}`);
                  if (!/^\+?[1-9]\d{7,14}$/.test(phone)) return;
                  if (sendVia === 'WhatsApp') {
                    window.open(`https://wa.me/${phone.replace(/^\+/, '')}?text=${msg}`, '_blank');
                  } else {
                    window.open(`sms:${phone}?&body=${msg}`, '_self');
                  }
                }}
                className="min-w-28"
              >
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
