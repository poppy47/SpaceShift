import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

// ── Shifts ────────────────────────────────────────────────────────────────────
export function useShifts() {
  return useQuery({ queryKey: ['shifts'], queryFn: () => api.get('/seats/shifts').then((r) => r.data) });
}

// ── Seat Map ──────────────────────────────────────────────────────────────────
export function useSeatMap(shiftId, startDate, endDate) {
  return useQuery({
    queryKey: ['seatMap', shiftId, startDate, endDate],
    queryFn: () =>
      api.get('/bookings/seat-map', { params: { shiftId, startDate, endDate } }).then((r) => r.data),
    enabled: !!(shiftId && startDate && endDate),
  });
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export function useMyBookings() {
  return useQuery({ queryKey: ['myBookings'], queryFn: () => api.get('/bookings/my').then((r) => r.data) });
}

export function useAllBookings(params = {}) {
  return useQuery({
    queryKey: ['allBookings', params],
    queryFn: () => api.get('/bookings', { params }).then((r) => r.data),
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/bookings', data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Booking confirmed!');
      qc.invalidateQueries({ queryKey: ['seatMap'] });
      qc.invalidateQueries({ queryKey: ['myBookings'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Booking failed.'),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/bookings/${id}/cancel`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Booking cancelled.');
      qc.invalidateQueries({ queryKey: ['myBookings'] });
      qc.invalidateQueries({ queryKey: ['seatMap'] });
      qc.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Cancellation failed.'),
  });
}

export function useMarkPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/bookings/${id}/payment`, body).then((r) => r.data),
    onSuccess: () => {
      toast.success('Payment status updated.');
      qc.invalidateQueries({ queryKey: ['allBookings'] });
      qc.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Update failed.'),
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export function useAdminDashboard() {
  return useQuery({
    queryKey: ['adminDashboard'],
    queryFn:  () => api.get('/admin/dashboard').then((r) => r.data),
  });
}

export function useExpiringSoon(days = 3) {
  return useQuery({
    queryKey: ['expiringSoon', days],
    queryFn:  () => api.get('/admin/memberships/expiring-soon', { params: { days } }).then((r) => r.data),
  });
}

export function useSendReminders() {
  return useMutation({
    mutationFn: (days) => api.post('/admin/memberships/send-reminders', { days }).then((r) => r.data),
    onSuccess: (data) => toast.success(`${data.sent} reminder(s) sent.`),
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to send reminders.'),
  });
}

export function useAdminUsers(params = {}) {
  return useQuery({
    queryKey: ['adminUsers', params],
    queryFn:  () => api.get('/admin/users', { params }).then((r) => r.data),
  });
}

export function useAdminSeats() {
  return useQuery({
    queryKey: ['adminSeats'],
    queryFn:  () => api.get('/admin/seats').then((r) => r.data),
  });
}
