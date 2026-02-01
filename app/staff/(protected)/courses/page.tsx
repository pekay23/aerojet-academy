"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import InputModal from "@/components/modal/InputModal";

export default function StaffCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingCourse, setEditingCourse] = useState<any | null>(null);

  async function fetchCourses() {
    const res = await fetch('/api/staff/courses');
    const data = await res.json();
    setCourses(data.courses || []);
    setLoading(false);
  }

  useEffect(() => { fetchCourses(); }, []);

  const handleUpdateLink = async (link: string) => {
    if (!editingCourse) return;
    const res = await fetch('/api/staff/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCourse.id, materialLink: link })
    });
    if (res.ok) {
        toast.success("Materials Link Updated");
        fetchCourses();
    } else {
        toast.error("Failed to update");
    }
    setEditingCourse(null);
  };

  if (loading) return <div className="p-8">Loading Catalog...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Course Management</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-slate-50 text-slate-800 font-bold border-b">
            <tr>
              <th className="p-4">Code</th>
              <th className="p-4">Title</th>
              <th className="p-4">Materials Access</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {courses.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono font-bold">{c.code}</td>
                <td className="p-4">{c.title}</td>
                <td className="p-4">
                    {c.materialLink ? (
                        <a href={c.materialLink} target="_blank" className="text-blue-600 hover:underline truncate block max-w-50">
                            {c.materialLink}
                        </a>
                    ) : (
                        <span className="text-gray-400 italic">No link set</span>
                    )}
                </td>
                <td className="p-4 text-right">
                    <button 
                        onClick={() => setEditingCourse(c)}
                        className="text-blue-600 hover:text-blue-800 font-bold text-xs border border-blue-200 px-3 py-1 rounded"
                    >
                        Edit Link
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InputModal 
        isOpen={!!editingCourse}
        onClose={() => setEditingCourse(null)}
        onConfirm={handleUpdateLink}
        title="Set Material Link"
        message={`Enter the OneDrive/SharePoint link for ${editingCourse?.code}.`}
        defaultValue={editingCourse?.materialLink || ""}
        placeholder="https://sharepoint.com/..."
      />
    </div>
  );
}
