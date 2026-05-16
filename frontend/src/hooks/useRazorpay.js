/**
 * useRazorpay — loads the Razorpay checkout script and exposes openCheckout()
 *
 * Usage:
 *   const { openCheckout, loading } = useRazorpay();
 *   await openCheckout({ bookingId, onSuccess, onFailure });
 */

import { useState, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) return resolve(true);
    const script    = document.createElement('script');
    script.id       = 'razorpay-script';
    script.src      = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload   = () => resolve(true);
    script.onerror  = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpay() {
  const [loading, setLoading] = useState(false);

  const openCheckout = useCallback(async ({ bookingId, onSuccess, onFailure }) => {
    setLoading(true);

    // 1. Load Razorpay SDK
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error('Failed to load payment gateway. Check your internet connection.');
      setLoading(false);
      return;
    }

    // 2. Create order on backend
    let orderData;
    try {
      const { data } = await api.post('/payments/create-order', { bookingId });
      orderData = data;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not initiate payment.');
      setLoading(false);
      return;
    }

    // 3. Open Razorpay checkout popup
    const options = {
      key:         orderData.keyId,
      amount:      orderData.amount,
      currency:    orderData.currency,
      name:        'SpaceShift',
      description: orderData.description,
      order_id:    orderData.orderId,
      prefill:     orderData.prefill,
      theme:       { color: '#111827' },

      handler: async (response) => {
        // 4. Verify payment on backend
        try {
          const { data } = await api.post('/payments/verify', {
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
            bookingId,
          });
          toast.success('Payment successful! Booking confirmed.');
          onSuccess?.(data.booking);
        } catch (err) {
          toast.error('Payment verification failed. Contact support.');
          onFailure?.(err);
        }
      },

      modal: {
        ondismiss: () => {
          toast('Payment cancelled.', { icon: '⚠️' });
          onFailure?.({ cancelled: true });
        },
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (response) => {
      toast.error(`Payment failed: ${response.error.description}`);
      onFailure?.(response.error);
    });

    rzp.open();
    setLoading(false);
  }, []);

  return { openCheckout, loading };
}
