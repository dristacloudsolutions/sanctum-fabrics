'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  Truck,
  Home,
  Copy,
  Check,
  Printer,
  MessageCircle,
  ShieldCheck,
  CreditCard,
  Banknote,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { OrderDetail, OrderLineItem, ReturnRequest } from '@/lib/dristaService';
import ReturnRequestModal from '@/app/components/ReturnRequestModal';
import AuthModal from '@/app/components/AuthModal';
import { formatINR } from '@/lib/format';

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  paid: {
    label: 'Payment Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  pending: {
    label: 'Payment Pending',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Clock,
  },
  failed: {
    label: 'Payment Failed',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: AlertCircle,
  },
};

const FULFILLMENT_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; step: number }> = {
  pending: {
    label: 'Order Confirmed',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    step: 1,
  },
  processing: {
    label: 'Processing & Handcrafting',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    step: 2,
  },
  shipped: {
    label: 'Shipped & In Transit',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    step: 3,
  },
  delivered: {
    label: 'Delivered',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    step: 4,
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    step: 0,
  },
};

const RETURN_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  requested: { label: 'Return Requested', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Return Approved', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  rejected: { label: 'Return Rejected', cls: 'bg-red-50 text-red-600 border-red-200' },
  pickup_scheduled: { label: 'Pickup Scheduled', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  received: { label: 'Item Received', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  refunded: { label: 'Refunded', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  exchanged: { label: 'Exchanged', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
};

const TRACKING_STEPS = [
  { id: 1, label: 'Order Placed', desc: 'Received & verified', icon: ShoppingBag },
  { id: 2, label: 'Processing', desc: 'Handcrafted & packed', icon: Package },
  { id: 3, label: 'Dispatched', desc: 'On its way to you', icon: Truck },
  { id: 4, label: 'Delivered', desc: 'Doorstep delivery', icon: Home },
];

export default function OrderDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [returnItem, setReturnItem] = useState<OrderLineItem | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedAwb, setCopiedAwb] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const loadReturns = () => {
    fetch('/api/returns')
      .then((res) => res.json())
      .then((payload) => setReturns(payload.returns || []))
      .catch(() => {});
  };

  const fetchOrder = () => {
    if (!orderId) return;
    setLoading(true);
    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((payload) => {
        if (payload.error) throw new Error(payload.error);
        setOrder(payload.order);
      })
      .catch((err) => setError(err.message || 'Order not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchOrder();
    loadReturns();
  }, [user, orderId]);

  const copyToClipboard = (text: string, type: 'id' | 'awb') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedAwb(true);
      setTimeout(() => setCopiedAwb(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (authLoading || (loading && user)) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-24">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-48 rounded-lg bg-[color:var(--ink)]/10" />
          <div className="h-44 rounded-3xl bg-[color:var(--ink)]/5" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="h-96 rounded-3xl bg-[color:var(--ink)]/5 lg:col-span-2" />
            <div className="h-96 rounded-3xl bg-[color:var(--ink)]/5" />
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated
  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
          <Package size={38} strokeWidth={1.5} />
        </div>
        <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-[color:var(--ink)]">
          Track Your Order
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--ink)]/70">
          Sign in with your mobile number to view real-time tracking, item details, invoices, and manage returns for your orders.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] px-8 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-[color:var(--primary)]/90 hover:shadow-lg transition-all"
          >
            Sign In with OTP
          </button>
          <Link
            href="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--border)] bg-white px-6 py-3.5 text-sm font-semibold text-[color:var(--ink)] hover:bg-[color:var(--cream)] transition-all"
          >
            Continue Shopping
          </Link>
        </div>

        {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertCircle size={32} />
        </div>
        <h2 className="mt-5 font-serif text-2xl text-[color:var(--ink)]">Order Not Found</h2>
        <p className="mt-2 text-sm text-[color:var(--ink)]/60">
          {error || "We couldn't retrieve the details for this order."}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[color:var(--primary)]/90 transition-all"
          >
            <ArrowLeft size={16} /> Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const fulfillment = FULFILLMENT_CONFIG[order.fulfillment_status || 'pending'] || FULFILLMENT_CONFIG.pending;
  const paymentStatus = PAYMENT_STATUS_CONFIG[order.payment_status] || {
    label: order.payment_status,
    bg: 'bg-zinc-100',
    text: 'text-zinc-600',
    border: 'border-zinc-200',
    icon: Clock,
  };
  const PaymentIcon = paymentStatus.icon;
  const address = order.shipping_address as Record<string, string> | undefined;
  const isCancelled = order.fulfillment_status === 'cancelled';
  const currentStep = isCancelled ? 0 : fulfillment.step;

  const formattedOrderDate = (order.order_date || order.created_at)
    ? new Date((order.order_date || order.created_at)!).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const whatsappMessage = encodeURIComponent(
    `Hello Sanctum Fabrics, I have an inquiry regarding my order ${order.so_number || order.id}.`
  );

  return (
    <div className="min-h-screen bg-[color:var(--cream)] pb-20 pt-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Top Breadcrumb & Quick Actions Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-2 text-xs font-medium text-[color:var(--ink)]/60">
            <Link href="/" className="hover:text-[color:var(--accent)] transition-colors">
              Home
            </Link>
            <ChevronRight size={14} className="opacity-40" />
            <Link href="/orders" className="hover:text-[color:var(--accent)] transition-colors">
              My Orders
            </Link>
            <ChevronRight size={14} className="opacity-40" />
            <span className="font-semibold text-[color:var(--ink)]">{order.so_number || 'Order Details'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-white px-3.5 py-2 text-xs font-semibold text-[color:var(--ink)] shadow-xs hover:border-[color:var(--ink)]/30 hover:bg-[color:var(--cream)]/40 transition-all"
              title="Print Order Receipt"
            >
              <Printer size={15} className="text-[color:var(--ink)]/70" />
              <span>Print Invoice</span>
            </button>

            <a
              href={`https://wa.me/918097008785?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-xs hover:bg-emerald-100 transition-all"
            >
              <MessageCircle size={15} className="text-emerald-700" />
              <span>WhatsApp Concierge</span>
            </a>
          </div>
        </div>

        {/* Hero Order Header Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-[color:var(--border)] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
                  Order {order.so_number}
                </h1>
                <button
                  onClick={() => copyToClipboard(order.so_number, 'id')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--cream)]/60 px-2.5 py-1 text-xs font-medium text-[color:var(--ink)]/70 hover:bg-[color:var(--cream)] transition-all"
                  title="Copy Order ID"
                >
                  {copiedId ? (
                    <>
                      <Check size={13} className="text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {formattedOrderDate && (
                <p className="flex items-center gap-2 text-xs sm:text-sm text-[color:var(--ink)]/60">
                  <Clock size={14} className="opacity-60" />
                  <span>Placed on {formattedOrderDate}</span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Payment Badge */}
              <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold ${paymentStatus.bg} ${paymentStatus.text} ${paymentStatus.border}`}>
                <PaymentIcon size={14} />
                <span>{paymentStatus.label}</span>
              </div>

              {/* Fulfillment Badge */}
              <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold ${fulfillment.bg} ${fulfillment.text} ${fulfillment.border}`}>
                <span className="relative flex h-2 w-2">
                  {!isCancelled && fulfillment.step < 4 && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                  )}
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                </span>
                <span>{fulfillment.label}</span>
              </div>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          {!isCancelled ? (
            <div className="mt-10 border-t border-[color:var(--border)] pt-8">
              <div className="relative">
                {/* Horizontal line */}
                <div className="absolute top-5 left-6 right-6 hidden sm:block h-0.5 bg-[color:var(--border)] -z-0">
                  <div
                    className="h-full bg-[color:var(--accent)] transition-all duration-500"
                    style={{
                      width: `${Math.max(0, (currentStep - 1) / (TRACKING_STEPS.length - 1)) * 100}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4 relative z-10">
                  {TRACKING_STEPS.map((step) => {
                    const isCompleted = currentStep > step.id;
                    const isCurrent = currentStep === step.id;
                    const Icon = step.icon;

                    return (
                      <div key={step.id} className="flex flex-col sm:items-center text-left sm:text-center">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl border-2 transition-all duration-300 ${
                            isCompleted
                              ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white shadow-xs'
                              : isCurrent
                              ? 'border-[color:var(--accent)] bg-white text-[color:var(--accent)] shadow-md ring-4 ring-[color:var(--accent)]/15'
                              : 'border-[color:var(--border)] bg-white text-[color:var(--ink)]/30'
                          }`}
                        >
                          {isCompleted ? <Check size={20} strokeWidth={2.5} /> : <Icon size={20} />}
                        </div>
                        <p
                          className={`mt-3 text-xs sm:text-sm font-semibold ${
                            isCompleted || isCurrent ? 'text-[color:var(--ink)]' : 'text-[color:var(--ink)]/40'
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[color:var(--ink)]/50">
                          {step.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs sm:text-sm text-rose-800">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle size={16} />
                <span>This order was cancelled.</span>
              </div>
              <p className="mt-1 text-rose-700/80">
                If you made a payment, the refund will be processed back to your original source within 3–5 working days.
              </p>
            </div>
          )}
        </div>

        {/* Courier / Live Tracking Notice */}
        {(order.courier_name || order.tracking_number || order.awb_number) && (
          <div className="mt-6 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xs">
                  <Truck size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      Dispatched with {order.courier_name || 'Express Logistics'}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                      Live
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-[color:var(--ink)]">
                    <span className="font-mono font-semibold">AWB: {order.tracking_number || order.awb_number}</span>
                    <button
                      onClick={() => copyToClipboard(order.tracking_number || order.awb_number || '', 'awb')}
                      className="text-xs text-blue-700 hover:text-blue-900 underline underline-offset-2 inline-flex items-center gap-1"
                    >
                      {copiedAwb ? 'Copied!' : 'Copy AWB'}
                    </button>
                  </div>
                  {order.shipped_at && (
                    <p className="mt-1 text-xs text-[color:var(--ink)]/60">
                      Shipped on {new Date(order.shipped_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right sm:self-center">
                <p className="text-xs text-[color:var(--ink)]/60">Estimated Delivery</p>
                <p className="text-sm font-bold text-[color:var(--ink)]">Within 4–7 Business Days</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Layout: 2 Columns */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Items in Order */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-4">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={18} className="text-[color:var(--accent)]" />
                  <h2 className="font-serif text-lg font-semibold text-[color:var(--ink)]">
                    Items in this Order ({order.items?.length || 0})
                  </h2>
                </div>
                <span className="text-xs text-[color:var(--ink)]/50">Handcrafted Textiles</span>
              </div>

              <div className="divide-y divide-[color:var(--border)]">
                {order.items?.map((item) => {
                  const existingReturn = returns.find((r) => r.sales_order_item_id === item.id);
                  const isDelivered = order.fulfillment_status === 'delivered';

                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 first:pt-4 last:pb-0">
                      <div className="flex items-start gap-4">
                        {/* Thumbnail */}
                        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--cream)]">
                          {item.variant?.image_url ? (
                            <Image
                              src={item.variant.image_url}
                              alt={item.item?.name || 'Product'}
                              fill
                              unoptimized
                              className="object-cover transition-transform duration-300 hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[color:var(--ink)]/30">
                              <Package size={24} />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="space-y-1">
                          {item.item?.slug ? (
                            <Link
                              href={`/products/${item.item.slug}`}
                              className="text-sm font-semibold text-[color:var(--ink)] hover:text-[color:var(--accent)] transition-colors line-clamp-1"
                            >
                              {item.item?.name}
                            </Link>
                          ) : (
                            <p className="text-sm font-semibold text-[color:var(--ink)] line-clamp-1">
                              {item.item?.name || 'Artisanal Fabric'}
                            </p>
                          )}

                          {/* Variant Pills */}
                          {item.variant?.attributes && Object.keys(item.variant.attributes).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {Object.entries(item.variant.attributes)
                                .filter(([k]) => !k.toLowerCase().endsWith(' hex'))
                                .map(([k, v]) => (
                                <span
                                  key={k}
                                  className="inline-flex items-center rounded-md bg-[color:var(--cream)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--ink)]/80 border border-[color:var(--border)]/60"
                                >
                                  {k}: {String(v)}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="text-xs text-[color:var(--ink)]/60">
                            Quantity: <span className="font-semibold text-[color:var(--ink)]">{Number(item.quantity)}</span> × ₹{formatINR(item.rate)}
                          </p>

                          {/* Returns Action / Status */}
                          {isDelivered && (
                            <div className="pt-2">
                              {existingReturn ? (
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                                    RETURN_STATUS_LABEL[existingReturn.status]?.cls || 'bg-zinc-100 text-zinc-600 border-zinc-200'
                                  }`}
                                >
                                  <RotateCcw size={11} />
                                  <span>
                                    {existingReturn.request_type === 'exchange' ? 'Exchange' : 'Return'}: {RETURN_STATUS_LABEL[existingReturn.status]?.label || existingReturn.status}
                                  </span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => setReturnItem(item)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--primary)] hover:text-[color:var(--accent)] underline underline-offset-4 transition-colors"
                                >
                                  <RotateCcw size={12} />
                                  <span>Request Return / Exchange</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-left sm:text-right pl-20 sm:pl-0">
                        <span className="text-xs text-[color:var(--ink)]/40 sm:block">Item Total</span>
                        <span className="font-serif text-base font-semibold text-[color:var(--ink)]">
                          ₹{formatINR(item.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Fulfillment Activity Timeline (Collapsible) */}
            {order.fulfillment_history && order.fulfillment_history.length > 0 && (
              <div className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-xs">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock size={18} className="text-[color:var(--ink)]/60" />
                    <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">
                      Order Activity &amp; Milestones ({order.fulfillment_history.length})
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-[color:var(--primary)] underline underline-offset-2">
                    {showHistory ? 'Hide Timeline' : 'View Full Timeline'}
                  </span>
                </button>

                {showHistory && (
                  <ol className="mt-6 space-y-5 border-l-2 border-[color:var(--border)] ml-3 pl-4">
                    {order.fulfillment_history.map((h, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[23px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/20" />
                        <div>
                          <p className="text-xs font-bold text-[color:var(--ink)]">
                            Status changed to {FULFILLMENT_CONFIG[h.to_status]?.label || h.to_status}
                          </p>
                          <p className="text-[11px] text-[color:var(--ink)]/50">
                            {new Date(h.created_at).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                          {h.note && (
                            <p className="mt-1 text-xs text-[color:var(--ink)]/70 bg-[color:var(--cream)]/60 rounded-xl p-2.5 border border-[color:var(--border)]/60">
                              {h.note}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            {/* Authenticity & Concierge Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-xs text-center">
              <div className="flex flex-col items-center p-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 mb-2">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="text-xs font-bold text-[color:var(--ink)]">100% Genuine Fabrics</h4>
                <p className="mt-0.5 text-[11px] text-[color:var(--ink)]/50">Hand-inspected artisanal quality</p>
              </div>

              <div className="flex flex-col items-center p-2 border-t sm:border-t-0 sm:border-l border-[color:var(--border)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 mb-2">
                  <RotateCcw size={20} />
                </div>
                <h4 className="text-xs font-bold text-[color:var(--ink)]">7-Day Easy Returns</h4>
                <p className="mt-0.5 text-[11px] text-[color:var(--ink)]/50">Hassle-free pickups &amp; exchanges</p>
              </div>

              <div className="flex flex-col items-center p-2 border-t sm:border-t-0 sm:border-l border-[color:var(--border)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 mb-2">
                  <HelpCircle size={20} />
                </div>
                <h4 className="text-xs font-bold text-[color:var(--ink)]">Textile Concierge</h4>
                <p className="mt-0.5 text-[11px] text-[color:var(--ink)]/50">Support via WhatsApp &amp; Phone</p>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary, Payment & Delivery Details */}
          <div className="space-y-6">
            {/* Price & Billing Summary Card */}
            <div className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-xs">
              <h2 className="font-serif text-lg font-semibold text-[color:var(--ink)] border-b border-[color:var(--border)] pb-3">
                Payment Summary
              </h2>

              <div className="mt-4 space-y-2.5 text-xs text-[color:var(--ink)]/70">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-medium text-[color:var(--ink)]">₹{formatINR(order.subtotal)}</span>
                </div>

                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount Applied</span>
                    <span>−₹{formatINR(order.discount_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping &amp; Handling</span>
                  <span className="font-medium text-emerald-700">
                    {Number(order.shipping_cost) > 0 ? `₹${formatINR(order.shipping_cost || 0)}` : 'FREE'}
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-[color:var(--ink)]/50">
                  <span>Taxes (GST Included)</span>
                  <span>Included</span>
                </div>

                <div className="flex justify-between border-t border-[color:var(--border)] pt-3 text-sm font-bold text-[color:var(--ink)]">
                  <span>Grand Total</span>
                  <span className="font-serif text-lg text-[color:var(--primary)]">₹{formatINR(order.total_amount)}</span>
                </div>
              </div>

              {/* Payment Method Badge */}
              <div className="mt-5 rounded-2xl border border-[color:var(--border)] bg-[color:var(--cream)]/40 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[color:var(--accent)] shadow-2xs border border-[color:var(--border)]/60">
                    {order.payment_method === 'cod' ? <Banknote size={18} /> : <CreditCard size={18} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[color:var(--ink)]">
                      {order.payment_method === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment (Razorpay)'}
                    </p>
                    <p className="text-[11px] text-[color:var(--ink)]/60">
                      {order.payment_method === 'cod'
                        ? 'Payable to courier agent upon doorstep delivery'
                        : order.payment_status === 'paid'
                        ? 'Transaction verified & settled securely'
                        : 'Pending confirmation from payment gateway'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address Card */}
            <div className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2.5 border-b border-[color:var(--border)] pb-3">
                <MapPin size={18} className="text-[color:var(--accent)]" />
                <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">Shipping Destination</h3>
              </div>

              {address ? (
                <div className="mt-4 space-y-1.5 text-xs text-[color:var(--ink)]/70">
                  {/* Name */}
                  <p className="font-semibold text-sm text-[color:var(--ink)]">
                    {address.name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Customer')}
                  </p>
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {[address.city, address.state, address.pincode].filter(Boolean).join(', ')}
                  </p>
                  <p>{address.country || 'India'}</p>

                  {/* Phone & Email */}
                  <div className="mt-4 space-y-1 border-t border-[color:var(--border)] pt-3 text-[11px]">
                    {(address.phone || user?.phone) && (
                      <p className="flex items-center gap-2 text-[color:var(--ink)]/80">
                        <Phone size={13} className="text-[color:var(--ink)]/50" />
                        <span>{address.phone || user?.phone}</span>
                      </p>
                    )}
                    {user?.email && (
                      <p className="flex items-center gap-2 text-[color:var(--ink)]/80">
                        <Mail size={13} className="text-[color:var(--ink)]/50" />
                        <span>{user.email}</span>
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-xs text-[color:var(--ink)]/50">Address details unavailable.</p>
              )}
            </div>

            {/* Need Help Card */}
            <div className="rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-xs">
              <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">Need Assistance?</h3>
              <p className="mt-1 text-xs text-[color:var(--ink)]/60">
                Our artisanal fabric support team is available Monday to Saturday, 10 AM – 7 PM.
              </p>

              <div className="mt-4 space-y-2">
                <a
                  href={`https://wa.me/918097008785?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50/80 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                >
                  <MessageCircle size={15} />
                  <span>Chat on WhatsApp</span>
                </a>

                <a
                  href="mailto:support@sanctumfabrics.in?subject=Order%20Query%20"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[color:var(--border)] bg-white py-2.5 text-xs font-semibold text-[color:var(--ink)] hover:bg-[color:var(--cream)] transition-colors"
                >
                  <Mail size={15} />
                  <span>Email Support</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Return / Exchange Modal */}
      {returnItem && (
        <ReturnRequestModal
          orderId={order.id}
          item={returnItem}
          onClose={() => setReturnItem(null)}
          onSuccess={() => {
            setReturnItem(null);
            loadReturns();
          }}
        />
      )}

      {/* Auth Modal if launched */}
      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
    </div>
  );
}
