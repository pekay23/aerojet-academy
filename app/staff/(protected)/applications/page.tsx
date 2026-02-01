"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Document Viewer State
  const [viewingDocs, setViewingDocs] = useState<any | null>(null);

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
        setViewingDocs(null); // Close modal if open
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
                <option value="UNDER_REVIEW">Under Review</option>
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

      {/* Table Container - Mobile Optimized */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm text-gray-600 min-w-200">
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
                                app.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-700' :
                                app.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                            }`}>
                                {app.status}
                            </span>
                            {/* View Docs Link if Submitted */}
                            {app.isSubmitted && (
                                <button 
                                    onClick={() => setViewingDocs(app)}
                                    className="ml-2 text-xs text-blue-600 underline hover:text-blue-800 font-bold"
                                >
                                    View Docs
                                </button>
                            )}
                        </td>
                        <td className="p-4 text-right">
                            {app.status !== 'APPROVED' && (
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

      {/* DOCUMENT VIEWER MODAL */}
      {viewingDocs && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewingDocs(null)}>
            <div className="bg-white rounded-xl p-8 max-w-2xl w-full relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setViewingDocs(null)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold text-xl">✕</button>
                <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">Documents: {viewingDocs.student.user.name}</h2>
                
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-700">Passport / National ID</p>
                            <p className="text-xs text-slate-500">{viewingDocs.idDocumentUrl ? 'Uploaded' : 'Missing'}</p>
                        </div>
                        {viewingDocs.idDocumentUrl ? (
                            <a href={viewingDocs.idDocumentUrl} target="_blank" className="bg-white border px-4 py-2 rounded text-sm font-bold text-blue-600 hover:bg-blue-50">View File ↗</a>
                        ) : <span className="text-gray-400 text-sm italic">N/A</span>}
                    </div>

                    <div className="p-4 bg-slate-50 border rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-700">High School Certificate</p>
                            <p className="text-xs text-slate-500">{viewingDocs.certificateUrl ? 'Uploaded' : 'Missing'}</p>
                        </div>
                        {viewingDocs.certificateUrl ? (
                            <a href={viewingDocs.certificateUrl} target="_blank" className="bg-white border px-4 py-2 rounded text-sm font-bold text-blue-600 hover:bg-blue-50">View File ↗</a>
                        ) : <span className="text-gray-400 text-sm italic">N/A</span>}
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button onClick={() => handleApprove(viewingDocs.id)} className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700">
                        Approve Application
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
