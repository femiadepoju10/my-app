"use client";

import { useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  transactionCount: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  async function toggleRole(userId: number, currentRole: string, userName: string) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const action = newRole === "admin" ? "promote" : "demote";
    if (!confirm(`Are you sure you want to ${action} ${userName}?`)) return;
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      {loading ? (
        <div className="py-20 text-center text-zinc-500">Loading...</div>
      ) : users.length === 0 ? (
        <div className="py-20 text-center text-zinc-500">No users found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Name</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Email</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Phone</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Role</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Transactions</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Joined</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{user.name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.email}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${user.role === "admin" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.transactionCount}</td>
                  <td className="px-4 py-3 text-zinc-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleRole(user.id, user.role, user.name)} disabled={actionLoading === user.id} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                      {actionLoading === user.id ? "..." : user.role === "admin" ? "Demote" : "Promote"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
