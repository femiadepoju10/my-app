"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import { Loader2, Search, UserPlus, Shield, Trash2 } from "lucide-react";

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
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [search, setSearch] = useState("");

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

  async function handleDelete(userId: number, userName: string) {
    if (!confirm(`Are you sure you want to remove ${userName}? This action can be undone by an admin.`)) return;
    setDeleteLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } finally {
      setDeleteLoading(null);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          User Management
        </h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon="inbox"
            title="No users found"
            description={search ? "Try adjusting your search terms." : "There are no users in the system yet."}
          />
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">User</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Email</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Phone</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Role</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Transactions</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Joined</th>
                <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={undefined}
                        fallback={user.name}
                        size="sm"
                      />
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.email}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "admin" ? "primary" : "default"} size="sm">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.transactionCount}</td>
                  <td className="px-4 py-3 text-zinc-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={user.role === "admin" ? "destructive" : "primary"}
                        size="sm"
                        onClick={() => toggleRole(user.id, user.role, user.name)}
                        isLoading={actionLoading === user.id}
                      >
                        <Shield className="h-3 w-3" />
                        {user.role === "admin" ? "Demote" : "Promote"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(user.id, user.name)}
                        isLoading={deleteLoading === user.id}
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </Button>
                    </div>
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
