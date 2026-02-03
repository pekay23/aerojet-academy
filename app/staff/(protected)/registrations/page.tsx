"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function RegistrationsPage() {
  const [users, setUsers] = useState<any[]>([]);

  const fetchInactive = async () => {
    // API should fetch users where isActive: false
    const res = await fetch('/api/staff/users'); // Reuse this for now
    const data = await res.json();
    setUsers(data.users.filter((u: any) => !u.isActive && u.role === 'STUDENT'));
  };

  useEffect(() => { fetchInactive(); }, []);
  
  const handleActivate = async (userId: string) => {
    await fetch('/api/staff/users', { method: 'PATCH', body: JSON.stringify({ userId, isActive: true }) });
    toast.success("Account Activated!");
    fetchInactive();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Pending Registrations</h1>
      <div className="bg-white rounded-lg shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b"><tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4 text-right">Action</th></tr></thead>
          <tbody className="divide-y">
            {users.map(u => (
              <tr key={u.id}>
                <td className="p-4 font-bold">{u.name}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4 text-right">
                    <button onClick={() => handleActivate(u.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">
                        Activate
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
