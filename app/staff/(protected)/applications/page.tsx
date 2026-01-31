"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, APPROVED
  const [dateSort, setDateSort] = useState('desc'); // desc (newest first), asc (oldest first)

  async function fetchApps() {
    const res = await fetch('/api/staff/applications');
    const data = await res.json();
    setApps(data.applications || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchApps();
  }, []);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/staff/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id })
      });
      if (res.ok) {
        toast.success("Application Approved");
        fetchApps();
      } else {
        toast.error("Failed to approve");
      }
    } catch (e) {
      toast.error("Error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  // --- Filter Logic ---
  const filteredApps = apps
    .filter(app => {
      if (statusFilter === 'ALL') return true;
      return app.status === statusFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.appliedAt).getTime();
      const dateB = new Date(b.appliedAt).getTime();
      return dateSort === 'asc' ? dateA - dateB : dateB - dateA;
    });

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Student Applications</h1>
      
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-600">Status:</span>
            <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
                <option value="ALL">All Applications</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
            </select>
        </div>

        <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-600">Date:</span>
            <select 
                value={dateSort} 
                onChange={(e) => setDateSort(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
            </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-slate-50 text-slate-800 font-bold border-b">
            <tr>
              <th className="p-4">Student</th>
              <th className="p-4">Course</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredApps.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No applications match your filters.</td></tr>
            ) : (
                filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50">
                    <td className="p-4">
                        <p className="font-bold text-slate-700">{app.student.user.name}</p>
                        <p className="text-xs text-gray-500">{app.student.user.email}</p>
                    </td>
                    <td className="p-4">
                        <p className="font-medium">{app.course.code}</p>
                        <p className="text-xs text-gray-500 truncate w-48">{app.course.title}</p>
                    </td>
                    <td className="p-4">{new Date(app.appliedAt).toLocaleDateString()}</td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                            app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            app.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                        }`}>
                            {app.status}
                        </span>
                    </td>
                    <td className="p-4 text-right">
                        {app.status === 'PENDING' && (
                            <button 
                                onClick={() => handleApprove(app.id)}
                                disabled={!!processingId}
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 text-xs font-bold"
                            >
                                {processingId === app.id ? '...' : 'Approve'}
                            </button>
                        )}
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
