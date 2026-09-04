import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function AdminUsers() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [grants, setGrants] = useState([]);
  const [permKey, setPermKey] = useState('attendance:scan');
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = () => api.get('/admin/users', { params: { search } }).then((res) => setUsers(res.data.users));

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [search]);

  const openUser = async (u) => {
    setSelected(u);
    const res = await api.get(`/admin/users/${u.id}/permissions`);
    setGrants(res.data.grants);
  };

  const changeRole = async (role) => {
    await api.patch(`/admin/users/${selected.id}/role`, { role });
    setSelected({ ...selected, role });
    load();
  };

  const grantPermission = async () => {
    await api.post(`/admin/users/${selected.id}/permissions`, { permissionKey: permKey });
    const res = await api.get(`/admin/users/${selected.id}/permissions`);
    setGrants(res.data.grants);
  };

  const revokePermission = async (grantId) => {
    await api.delete(`/admin/users/${selected.id}/permissions/${grantId}`);
    setGrants(grants.filter((g) => g.id !== grantId));
  };

  const confirmDeleteUser = async () => {
    try {
      await api.delete(`/admin/users/${pendingDelete.id}`);
      showToast(`${pendingDelete.fullName} deleted`);
      if (selected?.id === pendingDelete.id) setSelected(null);
      setPendingDelete(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Could not delete user', 'error');
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <section className="app-card p-5">
        <h1 className="font-display text-xl font-extrabold mb-3">Users</h1>
        <input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-3 rounded-xl border border-black/10 px-3 py-2"
        />
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-black/5">
          {users.map((u) => (
            <div
              key={u.id}
              className={`w-full flex items-center justify-between py-2.5 px-1 ${
                selected?.id === u.id ? 'bg-brand/5' : ''
              }`}
            >
              <button onClick={() => openUser(u)} className="text-left flex-1">
                <p className="font-medium">{u.fullName}</p>
                <p className="text-xs text-ink/40">{u.email}</p>
              </button>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-muted mr-2">{u.role}</span>
              <button
                onClick={() => setPendingDelete(u)}
                className="text-red-500 text-xs font-semibold shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
          {users.length === 0 && <p className="py-4 text-sm text-ink/40">No users found.</p>}
        </div>
      </section>

      <section className="app-card p-5">
        {!selected ? (
          <p className="text-sm text-ink/50">Select a user to manage their role and permissions.</p>
        ) : (
          <>
            <h2 className="font-display text-lg font-bold">{selected.fullName}</h2>
            <p className="text-sm text-ink/50 mb-4">{selected.email}</p>

            <label className="block text-sm font-semibold mb-1">Role</label>
            <select
              value={selected.role}
              onChange={(e) => changeRole(e.target.value)}
              className="w-full mb-5 rounded-xl border border-black/10 px-3 py-2"
            >
              <option value="MEMBER">Member</option>
              <option value="SERVANT">Servant</option>
              <option value="ADMIN">Admin</option>
            </select>

            {selected.role === 'SERVANT' && (
              <>
                <h3 className="font-display font-bold mb-2">Permissions</h3>
                <ul className="space-y-1.5 mb-4">
                  {grants.length === 0 && <p className="text-sm text-ink/40">No permissions granted yet.</p>}
                  {grants.map((g) => (
                    <li key={g.id} className="flex items-center justify-between text-sm bg-surface-muted rounded-lg px-3 py-1.5">
                      <span>{g.permission.key}{g.scopeType ? ` (${g.scopeType}:${g.scopeId})` : ''}</span>
                      <button onClick={() => revokePermission(g.id)} className="text-red-500 font-semibold">
                        Revoke
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="flex gap-2">
                  <select
                    value={permKey}
                    onChange={(e) => setPermKey(e.target.value)}
                    className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm"
                  >
                    <option value="attendance:scan">attendance:scan</option>
                    <option value="league:manage">league:manage</option>
                    <option value="task:manage">task:manage</option>
                  </select>
                  <button onClick={grantPermission} className="bg-brand text-white font-bold rounded-full px-4 text-sm">
                    Grant
                  </button>
                </div>
                <p className="text-xs text-ink/40 mt-2">
                  Scoped grants (e.g. limited to one league) can be added via the API's `scopeType`/`scopeId` fields.
                </p>
              </>
            )}
          </>
        )}
      </section>

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete ${pendingDelete?.fullName}?`}
        body="This permanently removes their account, attendance history, points, and task assignments. This can't be undone."
        onConfirm={confirmDeleteUser}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}