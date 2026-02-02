"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { UploadButton } from "@/app/utils/uploadthing";
import Image from "next/image";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add User State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'STAFF' });

  async function fetchUsers() {
    const res = await fetch('/api/staff/users');
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch('/api/staff/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
    });
    if (res.ok) {
        toast.success("Role Updated");
        fetchUsers();
    } else {
        toast.error("Failed to update");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/staff/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
    });
    if (res.ok) {
        toast.success("User created successfully");
        setIsAddOpen(false);
        setNewUser({ name: '', email: '', password: '', role: 'STAFF' }); // Reset
        fetchUsers();
    } else {
        toast.error("Failed to create. Email might be in use.");
    }
  };

  const handleUserPhotoUpload = async (userId: string, url: string) => {
    const res = await fetch('/api/staff/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, image: url })
    });
    if (res.ok) {
        toast.success("Photo Updated");
        fetchUsers();
    } else {
        toast.error("Failed to update photo");
    }
  };

  if (loading) return <div className="p-8">Loading Users...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">User Role Management</h1>
        <button 
            onClick={() => setIsAddOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition"
        >
            + Add New User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm text-gray-600 min-w-200">
                <thead className="bg-slate-50 border-b font-bold">
                    <tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Current Role</th><th className="p-4">Change Role</th></tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} className="border-b hover:bg-slate-50">
                            <td className="p-4 flex items-center gap-3">
                                {/* PHOTO COLUMN WITH UPLOAD */}
                                <div className="relative group w-10 h-10 shrink-0">
                                    <div className="w-full h-full rounded-full overflow-hidden border border-slate-200 bg-slate-100 relative">
                                        {u.image ? (
                                            <Image src={u.image} alt={u.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xs">
                                                {u.name?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Upload Overlay */}
                                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer overflow-hidden">
                                        <div className="absolute inset-0 w-full h-full">
                                            <UploadButton
                                                endpoint="adminStudentPhoto"
                                                onClientUploadComplete={(res) => handleUserPhotoUpload(u.id, res[0].url)}
                                                // FIX IS HERE: Wrapped in braces
                                                onUploadError={(e) => { toast.error(e.message); }}
                                                appearance={{
                                                    button: "w-full h-full bg-transparent text-transparent absolute inset-0 cursor-pointer",
                                                    container: "w-full h-full",
                                                    allowedContent: "hidden"
                                                }}
                                            />
                                        </div>
                                        <span className="text-white text-[8px] font-bold pointer-events-none relative z-10">Edit</span>
                                    </div>
                                </div>
                                <span className="font-bold text-slate-700">{u.name}</span>
                            </td>
                            <td className="p-4">{u.email}</td>
                            <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-red-100 text-red-800' : u.role === 'STAFF' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>{u.role}</span></td>
                            <td className="p-4">
                                <select 
                                    value={u.role} 
                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                    className="border rounded p-1 text-xs"
                                >
                                    <option value="STUDENT">Student</option>
                                    <option value="STAFF">Staff</option>
                                    <option value="INSTRUCTOR">Instructor</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* ADD USER MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Create New Account</h2>
                <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                        <input type="text" required className="w-full border rounded p-2" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                        <input type="email" required className="w-full border rounded p-2" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Initial Password</label>
                        <input type="text" required className="w-full border rounded p-2" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                        <select className="w-full border rounded p-2" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                            <option value="STAFF">Staff</option>
                            <option value="INSTRUCTOR">Instructor</option>
                            <option value="ADMIN">Admin</option>
                            <option value="STUDENT">Student</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Create Account</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
