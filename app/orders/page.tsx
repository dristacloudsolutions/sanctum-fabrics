'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  ChevronRight,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Banknote,
  CreditCard,
  User as UserIcon,
  LogOut,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { SalesOrder } from '@/lib/dristaService';
import { formatINR } from '@/lib/format';
import AuthModal from '@/app/components/AuthModal';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  paid: {
    label: 'Paid',
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
    label: 'Failed',
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
    label: 'Processing',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    step: 2,
  },
  shipped: {
    label: 'Shipped',
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

type FilterTab = 'all' | 'active' | 'delivered' | 'cancelled';

export default function OrdersPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [orders, setOrders] = useState<SalesOrder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    fetch('/api/orders')
      .then((res) => res.json())
      .then((payload) => {
        if (payload.error) throw new Error(payload.error);
        setOrders(payload.orders || []);
      })
      .catch((err) => setError(err.message || 'Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [user]);

  const copyOrderId = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered orders computation
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    return orders.filter((order) => {
      // Tab filter
      const fulfillment = order.fulfillment_status || 'pending';
      if (activeTab === 'active' && (fulfillment === 'delivered' || fulfillment === 'cancelled')) return false;
      if (activeTab === 'delivered' && fulfillment !== 'delivered') return false;
      if (activeTab === 'cancelled' && fulfillment !== 'cancelled') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesSo = order.so_number?.toLowerCase().includes(query);
        const matchesId = order.id?.toLowerCase().includes(query);
        if (!matchesSo && !matchesId) return false;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // Counts for pills
  const stats = useMemo(() => {
    if (!orders) return { all: 0, active: 0, delivered: 0, cancelled: 0 };
    return {
      all: orders.length,
      active: orders.filter((o) => {
        const f = o.fulfillment_status || 'pending';
        return f !== 'delivered' && f !== 'cancelled';
      }).length,
      delivered: orders.filter((o) => o.fulfillment_status === 'delivered').length,
      cancelled: orders.filter((o) => o.fulfillment_status === 'cancelled').length,
    };
  }, [orders]);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-24">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 rounded-xl bg-[color:var(--ink)]/10" />
          <div className="h-28 rounded-3xl bg-[color:var(--ink)]/5" />
          <div className="h-44 rounded-3xl bg-[color:var(--ink)]/5" />
          <div className="h-44 rounded-3xl bg-[color:var(--ink)]/5" />
        </div>
      </div>
    );
  }

  // Not signed in state
  if (!user) {
    return (
      <div className="min-h-[70vh] bg-[color:var(--cream)] px-5 py-24 flex items-center justify-center">
        <div className="mx-auto max-w-md w-full text-center rounded-3xl border border-[color:var(--border)] bg-white p-8 sm:p-10 shadow-xs">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
            <ShoppingBag size={38} strokeWidth={1.5} />
          </div>
          <h1 className="mt-6 font-serif text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
            My Orders
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--ink)]/70">
            Sign in with your mobile number to view your complete order history, live delivery status, and tax invoices.
          </p>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] py-3.5 text-sm font-semibold text-white shadow-md hover:bg-[color:var(--primary)]/90 hover:shadow-lg transition-all"
            >
              Sign In with OTP
            </button>
            <Link
              href="/products"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--border)] bg-white py-3.5 text-sm font-semibold text-[color:var(--ink)] hover:bg-[color:var(--cream)] transition-all"
            >
              Explore Collections
            </Link>
          </div>
        </div>

        {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--cream)] pb-24 pt-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header with User Info */}
        <div className="rounded-3xl border border-[color:var(--border)] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5">
                <Sparkles size={20} className="text-[color:var(--accent)]" />
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
                  My Orders
                </h1>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[color:var(--ink)]/60">
                Track your artisanal fabric shipments, view invoices, and manage returns.
              </p>
            </div>

            {/* Profile pill & logout */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-2xl border border-[color:var(--border)] bg-[color:var(--cream)]/60 px-3.5 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[color:var(--primary)] text-white text-xs font-bold">
                  {user.first_name ? user.first_name[0].toUpperCase() : 'U'}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-[color:var(--ink)] leading-tight">
                    {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Customer'}
                  </p>
                  <p className="text-[11px] text-[color:var(--ink)]/50 leading-tight">
                    {user.phone || user.email || 'Verified Shopper'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => logout()}
                className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--border)] bg-white p-2.5 text-[color:var(--ink)]/60 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 transition-all shadow-2xs"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* Quick Stats Banner */}
          {orders && orders.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[color:var(--border)] pt-6">
              <div className="rounded-2xl border border-[color:var(--border)]/70 bg-[color:var(--cream)]/40 p-3 text-center">
                <p className="text-lg sm:text-2xl font-serif font-bold text-[color:var(--ink)]">{stats.all}</p>
                <p className="text-[11px] font-medium text-[color:var(--ink)]/60 uppercase tracking-wider">Total Orders</p>
              </div>

              <div className="rounded-2xl border border-blue-200/70 bg-blue-50/40 p-3 text-center">
                <p className="text-lg sm:text-2xl font-serif font-bold text-blue-900">{stats.active}</p>
                <p className="text-[11px] font-medium text-blue-700/80 uppercase tracking-wider">In Transit / Active</p>
              </div>

              <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-3 text-center">
                <p className="text-lg sm:text-2xl font-serif font-bold text-emerald-900">{stats.delivered}</p>
                <p className="text-[11px] font-medium text-emerald-700/80 uppercase tracking-wider">Delivered</p>
              </div>
            </div>
          )}
        </div>

        {/* Filter Tabs & Search Row */}
        {orders && orders.length > 0 && (
          <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveTab('all')}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'all'
                    ? 'bg-[color:var(--primary)] text-white shadow-xs'
                    : 'bg-white border border-[color:var(--border)] text-[color:var(--ink)]/70 hover:border-[color:var(--ink)]/30'
                }`}
              >
                All Orders ({stats.all})
              </button>

              <button
                onClick={() => setActiveTab('active')}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'active'
                    ? 'bg-[color:var(--primary)] text-white shadow-xs'
                    : 'bg-white border border-[color:var(--border)] text-[color:var(--ink)]/70 hover:border-[color:var(--ink)]/30'
                }`}
              >
                Active &amp; Transit ({stats.active})
              </button>

              <button
                onClick={() => setActiveTab('delivered')}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'delivered'
                    ? 'bg-[color:var(--primary)] text-white shadow-xs'
                    : 'bg-white border border-[color:var(--border)] text-[color:var(--ink)]/70 hover:border-[color:var(--ink)]/30'
                }`}
              >
                Delivered ({stats.delivered})
              </button>

              {stats.cancelled > 0 && (
                <button
                  onClick={() => setActiveTab('cancelled')}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'cancelled'
                      ? 'bg-[color:var(--primary)] text-white shadow-xs'
                      : 'bg-white border border-[color:var(--border)] text-[color:var(--ink)]/70 hover:border-[color:var(--ink)]/30'
                  }`}
                >
                  Cancelled ({stats.cancelled})
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--ink)]/40" />
              <input
                type="text"
                placeholder="Search by Order #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[color:var(--border)] bg-white py-2 pl-9 pr-4 text-xs text-[color:var(--ink)] placeholder-[color:var(--ink)]/40 focus:border-[color:var(--accent)] focus:outline-hidden focus:ring-1 focus:ring-[color:var(--accent)] shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[color:var(--ink)]/40 hover:text-[color:var(--ink)]"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="mt-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-40 rounded-3xl bg-white border border-[color:var(--border)] p-6" />
            ))}
          </div>
        )}

        {/* Orders List / Empty states */}
        {!loading && orders && (
          <div className="mt-6 space-y-4">
            {orders.length === 0 ? (
              // User has no orders at all
              <div className="rounded-3xl border border-[color:var(--border)] bg-white p-12 text-center shadow-xs">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--cream)] text-[color:var(--ink)]/30">
                  <Package size={32} />
                </div>
                <h3 className="mt-4 font-serif text-xl font-semibold text-[color:var(--ink)]">
                  No orders placed yet
                </h3>
                <p className="mt-2 text-xs text-[color:var(--ink)]/60 max-w-sm mx-auto leading-relaxed">
                  Discover our curated collection of handcrafted linens, silks, and artisanal fabrics made for connoisseurs.
                </p>
                <div className="mt-6">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 rounded-full bg-[color:var(--primary)] px-7 py-3 text-xs font-semibold text-white shadow-md hover:bg-[color:var(--primary)]/90 transition-all"
                  >
                    Browse Collections <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : filteredOrders.length === 0 ? (
              // Search or filter yielded 0 results
              <div className="rounded-3xl border border-[color:var(--border)] bg-white p-10 text-center shadow-xs">
                <p className="text-sm font-semibold text-[color:var(--ink)]">No orders match your filter</p>
                <p className="mt-1 text-xs text-[color:var(--ink)]/50">
                  Try adjusting your search query or reset the active filter tab.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--cream)]/60 px-4 py-2 text-xs font-semibold text-[color:var(--ink)] hover:bg-[color:var(--cream)] transition-all"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              // Render filtered orders
              filteredOrders.map((order) => {
                const payment = STATUS_CONFIG[order.payment_status] || {
                  label: order.payment_status,
                  bg: 'bg-zinc-100',
                  text: 'text-zinc-600',
                  border: 'border-zinc-200',
                  icon: Clock,
                };
                const PaymentIcon = payment.icon;

                const fulfillment = FULFILLMENT_CONFIG[order.fulfillment_status || 'pending'] || FULFILLMENT_CONFIG.pending;
                const isCancelled = order.fulfillment_status === 'cancelled';
                const currentStep = isCancelled ? 0 : fulfillment.step;

                const date = order.order_date || order.created_at;
                const formattedDate = date
                  ? new Date(date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '';

                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="group block rounded-3xl border border-[color:var(--border)] bg-white p-6 shadow-xs hover:border-[color:var(--accent)]/50 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[color:var(--border)] pb-4">
                      {/* Left: Order ID & Date */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold text-[color:var(--ink)] group-hover:text-[color:var(--accent)] transition-colors">
                            {order.so_number}
                          </span>
                          <button
                            onClick={(e) => copyOrderId(e, order.so_number)}
                            className="text-[color:var(--ink)]/40 hover:text-[color:var(--ink)] p-1 rounded-md transition-colors"
                            title="Copy Order ID"
                          >
                            {copiedId === order.so_number ? (
                              <Check size={13} className="text-emerald-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>

                        {formattedDate && (
                          <p className="flex items-center gap-1 text-xs text-[color:var(--ink)]/50">
                            <Clock size={12} className="opacity-60" />
                            <span>Placed on {formattedDate}</span>
                          </p>
                        )}
                      </div>

                      {/* Right: Price & Status Badges */}
                      <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
                        {/* Payment Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${payment.bg} ${payment.text} ${payment.border}`}
                        >
                          <PaymentIcon size={12} />
                          <span>{payment.label}</span>
                        </span>

                        {/* Fulfillment Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${fulfillment.bg} ${fulfillment.text} ${fulfillment.border}`}
                        >
                          <span className="relative flex h-1.5 w-1.5">
                            {!isCancelled && fulfillment.step < 4 && (
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                            )}
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                          </span>
                          <span>{fulfillment.label}</span>
                        </span>

                        {/* Total Amount */}
                        <div className="text-right pl-2 sm:pl-3">
                          <span className="font-serif text-lg font-bold text-[color:var(--ink)]">
                            ₹{formatINR(order.total_amount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Footer */}
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Delivery Mini-Stepper */}
                      {!isCancelled ? (
                        <div className="flex items-center gap-2 text-xs text-[color:var(--ink)]/60">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4].map((step) => (
                              <div
                                key={step}
                                className={`h-1.5 w-7 sm:w-10 rounded-full transition-colors ${
                                  step <= currentStep
                                    ? 'bg-[color:var(--accent)]'
                                    : 'bg-[color:var(--border)]'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] font-medium text-[color:var(--ink)]/70 pl-1">
                            {fulfillment.label}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-rose-700 font-medium">Order was cancelled</p>
                      )}

                      {/* Payment Method & View Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 text-[11px] text-[color:var(--ink)]/50">
                          {order.payment_method === 'cod' ? (
                            <>
                              <Banknote size={14} className="text-[color:var(--ink)]/60" />
                              <span>Cash on Delivery</span>
                            </>
                          ) : (
                            <>
                              <CreditCard size={14} className="text-[color:var(--ink)]/60" />
                              <span>Online Payment</span>
                            </>
                          )}
                        </span>

                        <span className="inline-flex items-center gap-1 font-semibold text-[color:var(--primary)] group-hover:text-[color:var(--accent)] transition-colors">
                          <span>View Order &amp; Tracking</span>
                          <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>

      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
    </div>
  );
}
