'use client';

import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import {
  selectActiveCart, selectActiveCartItems, selectActiveCartItemCount,
  selectActiveCartGrandTotal, selectActiveCartHasPrices, selectActiveCartIsPaid,
  selectCanMarkPayment, selectCategories,
  incrementItemInActiveCart, decrementItemInActiveCart, removeItemFromActiveCart,
  clearActiveCart, markActiveCartAsPaid,
  useCheckoutMutation,
} from '@groceryone/store';
import { DomainTypes } from '@groceryone/store';
import { Plus, Minus, Trash2, ArrowLeft, CreditCard, Printer, ShoppingCart, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { PaymentInline } from '@/components/payment/PaymentInline';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function OrderDetailPage() {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const activeCart = useAppSelector(selectActiveCart);
  const cartItems = useAppSelector(selectActiveCartItems);
  const itemCount = useAppSelector(selectActiveCartItemCount);
  const grandTotal = useAppSelector(selectActiveCartGrandTotal);
  const hasPrices = useAppSelector(selectActiveCartHasPrices);
  const isPaid = useAppSelector(selectActiveCartIsPaid);
  const canPay = useAppSelector(selectCanMarkPayment);
  const categories = useAppSelector(selectCategories);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [showPayment, setShowPayment] = useState(false);
  const [checkout, { isLoading: isCheckingOut }] = useCheckoutMutation();

  const groupedItems = useMemo(() => {
    const groups = new Map<string, DomainTypes.CartItemState[]>();
    cartItems.forEach((ci) => {
      const catId = ci.item.categoryId;
      if (!groups.has(catId)) groups.set(catId, []);
      groups.get(catId)!.push(ci);
    });
    return groups;
  }, [cartItems]);

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? `${cat.icon} ${cat.name}` : catId;
  };

  // Confirm payment = commit the sale to the backend FIRST (deduct stock),
  // THEN mark the local cart paid. The web/desktop POS is otherwise local-only,
  // so this checkout call is the single path that actually moves inventory.
  // If the backend rejects (e.g. insufficient stock), we throw so PaymentInline
  // surfaces the message and does NOT show success — the cart stays unpaid.
  // `clientRef = activeCart.id` makes a retry idempotent (no double-deduction).
  const handleConfirmPayment = useCallback(async (paymentInfo: DomainTypes.PaymentInfo) => {
    try {
      await checkout({
        items: cartItems.map((ci) => ({ itemId: ci.item.id, quantity: ci.quantity })),
        paymentMethod: paymentInfo.method,
        paidAmount: grandTotal,
        clientRef: activeCart?.id,
      }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string; error?: { message?: string } } };
      throw new Error(
        e?.data?.message || e?.data?.error?.message || t('payment.checkoutFailed'),
      );
    }
    dispatch(markActiveCartAsPaid({ amount: grandTotal, paymentInfo }));
  }, [checkout, cartItems, grandTotal, activeCart?.id, dispatch, t]);

  if (!activeCart) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <ShoppingCart size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-lg font-medium mb-4">{t('picking.cartEmpty')}</p>
        <Link href="/picking" className="text-primary hover:underline">{t('dashboard.startPicking')}</Link>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: t('manageCarts.title'), href: '/orders' }, { label: activeCart.name }]} />

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/orders" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{activeCart.name}</h1>
          <p className="text-sm text-gray-500">
            {itemCount} {t('picking.items')} &middot; {activeCart.status}
            {isPaid && activeCart.paidAt && ` \u00b7 ${t('dashboard.paid')} ${new Date(activeCart.paidAt).toLocaleTimeString()}`}
          </p>
        </div>

        {/* Grand total — mobile only (shown in payment panel on desktop) */}
        {hasPrices && (
          <div className="text-right lg:hidden">
            <p className="text-sm text-gray-500">{t('picking.grandTotal')}</p>
            <p className="text-2xl font-bold text-primary">₹{grandTotal.toFixed(2)}</p>
          </div>
        )}

        {/* Utility buttons — desktop only (shown in footer on mobile) */}
        {!isPaid && cartItems.length > 0 && (
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => dispatch(clearActiveCart())}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t('picking.clearAll')}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Printer size={16} /> {t('picking.printList')}
            </button>
          </div>
        )}
        {isPaid && (
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Printer size={16} /> {t('picking.printList')}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {cartItems.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800">
          <ShoppingCart size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">{t('picking.cartEmpty')}</p>
          <Link href="/picking" className="text-primary hover:underline">{t('picking.browseItems')}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_400px] gap-6" data-testid="order-layout-grid">
          {/* LEFT COLUMN: Order Items */}
          <div className="min-w-0" data-testid="order-items-column">
            <div className="space-y-4">
              {Array.from(groupedItems.entries()).map(([catId, items]) => (
                <div key={catId} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{getCategoryName(catId)} ({items.length})</p>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {items.map((ci) => (
                      <div key={ci.item.id} className="px-4 py-3 flex items-center gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{ci.item.name}</p>
                          {ci.priceSnapshot !== undefined && ci.priceSnapshot > 0 && (
                            <p className="text-xs text-gray-500">₹{ci.priceSnapshot}/{ci.item.unit}</p>
                          )}
                        </div>
                        {!isPaid && (
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            <button onClick={() => dispatch(decrementItemInActiveCart(ci.item.id))} className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 flex items-center justify-center"><Minus size={12} /></button>
                            <span className="text-sm font-medium w-14 sm:w-16 text-center">{ci.quantity} {ci.item.unit}</span>
                            <button onClick={() => dispatch(incrementItemInActiveCart(ci.item.id))} className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Plus size={12} /></button>
                            <button onClick={() => dispatch(removeItemFromActiveCart(ci.item.id))} className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={12} /></button>
                          </div>
                        )}
                        {ci.priceSnapshot !== undefined && ci.priceSnapshot > 0 && (
                          <p className="text-sm font-semibold w-20 sm:w-24 text-right flex-shrink-0">₹{(ci.priceSnapshot * ci.quantity).toFixed(2)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile: inline payment (toggle-gated) */}
            {!isDesktop && showPayment && !isPaid && (
              <div className="mt-6">
                <PaymentInline
                  grandTotal={grandTotal}
                  onConfirm={handleConfirmPayment}
                  onCancel={() => setShowPayment(false)}
                  isProcessing={isCheckingOut}
                />
              </div>
            )}

            {/* Mobile: action buttons */}
            {!isDesktop && (
              <div className="flex gap-3 mt-6" data-testid="mobile-action-buttons">
                {!isPaid && !showPayment && (
                  <button onClick={() => dispatch(clearActiveCart())} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {t('picking.clearAll')}
                  </button>
                )}
                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Printer size={16} /> {t('picking.printList')}
                </button>
                {canPay && !showPayment && (
                  <button
                    onClick={() => setShowPayment(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
                    data-testid="mobile-pay-now-btn"
                  >
                    <CreditCard size={16} /> {t('picking.payment')} &middot; ₹{grandTotal.toFixed(0)}
                  </button>
                )}
                {isPaid && (
                  <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
                    {t('dashboard.paid')} ₹{activeCart.paidAmount?.toFixed(0)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Payment Panel (desktop only) */}
          {isDesktop && (
            <div className="sticky top-0 self-start max-h-[calc(100vh-8rem)] overflow-y-auto" data-testid="payment-panel-column">
              {!isPaid ? (
                <PaymentInline
                  grandTotal={grandTotal}
                  onConfirm={handleConfirmPayment}
                  isProcessing={isCheckingOut}
                />
              ) : (
                /* Paid confirmation card */
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-1">{t('payment.paymentSuccessful')}</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {activeCart.paymentInfo?.method && (
                        <span className="capitalize">{activeCart.paymentInfo.method}</span>
                      )}
                      {activeCart.paidAt && ` \u00b7 ${new Date(activeCart.paidAt).toLocaleTimeString()}`}
                    </p>
                    <div className="bg-primary/5 rounded-xl p-4 mb-4">
                      <p className="text-sm text-gray-500">{t('picking.totalAmount')}</p>
                      <p className="text-3xl font-bold text-primary">₹{(activeCart.paidAmount ?? grandTotal).toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Printer size={16} /> {t('picking.printList')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
