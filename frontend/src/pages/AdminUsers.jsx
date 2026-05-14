import { useState } from 'react';
import { format } from 'date-fns';
import { Users, Search } from 'lucide-react';
import { useAdminUsers } from '../hooks/useLibrary';
import api from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [deactivating, setDea]  = useState(null);
  const { data, isLoading }     = useAdminUsers({ search, page, limit: 15 });
  const qc                      = useQueryClient();

  const users  = data?.users  || [];
  const total  = data?.total  || 0;
  const pages  = data?.pages  || 1;

  async function handleDeactivate(id) {
    setDea(id);
    try {
      await api.patch(`/admin/users/${id}/deactivate`);
      toast.success('User deactivated.');
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      qc.invalidateQueries({ queryKey: ['adminDashboard'] });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed.');
    } finally {
      setDea(null);
    }
  }

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-medium text-gray-900 mb-1 flex items-center gap-2">
        <Users className="w-5 h-5" /> Students
      </h1>
      <p className="text-sm text-gray-500 mb-5">{total} registered students</p>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-8 text-xs"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400 py-8">Loading students…</div>
      ) : users.length === 0 ? (
        <div className="card text-center py-10">
          <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No students found.</p>
        </div>
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Student', 'Phone', 'Joined', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{u.phone || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(u.createdAt), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={u.isActive ? 'badge-green' : 'badge-gray'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.isActive && (
                          <button
                            onClick={() => handleDeactivate(u._id)}
                            disabled={deactivating === u._id}
                            className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                          >
                            {deactivating === u._id ? 'Deactivating…' : 'Deactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-500">Page {page} of {pages}</p>
              <div className="flex gap-1.5">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Prev</button>
                <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
