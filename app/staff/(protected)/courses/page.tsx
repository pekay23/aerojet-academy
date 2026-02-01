"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function StaffCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [formData, setFormData] = useState({ materialLink: '', instructorIds: [] as string[] });

  async function fetchCourses() {
    const res = await fetch('/api/staff/courses');
    const data = await res.json();
    setCourses(data.courses || []);
    setInstructors(data.instructors || []);
    setLoading(false);
  }

  useEffect(() => { fetchCourses(); }, []);

  const handleEdit = (course: any) => {
    setEditingCourse(course);
    setFormData({
        materialLink: course.materialLink || '',
        instructorIds: course.instructors ? course.instructors.map((i: any) => i.id) : []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/staff/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id: editingCourse.id, 
            materialLink: formData.materialLink,
            instructorIds: formData.instructorIds
        })
    });

    if (res.ok) {
        toast.success("Course Updated");
        fetchCourses();
        setEditingCourse(null);
    } else {
        toast.error("Failed to update");
    }
  };

  // Helper to toggle instructor selection
  const toggleInstructor = (id: string) => {
    setFormData(prev => {
        const newIds = prev.instructorIds.includes(id) 
            ? prev.instructorIds.filter(i => i !== id) 
            : [...prev.instructorIds, id];
        return { ...prev, instructorIds: newIds };
    });
  };

  if (loading) return <div className="p-8">Loading Catalog...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Course Management</h1>
      
            <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
        <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm text-gray-600 min-w-175">
            <thead className="bg-slate-50 text-slate-800 font-bold border-b">
                <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Title</th>
                <th className="p-4">Instructors</th>
                <th className="p-4">Materials</th>
                <th className="p-4 text-right">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {courses.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold">{c.code}</td>
                    <td className="p-4">{c.title}</td>
                    <td className="p-4">
                        {c.instructors && c.instructors.length > 0 
                            ? <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">{c.instructors.length} Assigned</span> 
                            : <span className="text-gray-400 italic">None</span>
                        }
                    </td>
                    <td className="p-4">
                        {c.materialLink ? (
                            <a href={c.materialLink} target="_blank" className="text-blue-600 hover:underline truncate block max-w-37.5">Link Set</a>
                        ) : <span className="text-gray-400 italic">--</span>}
                    </td>
                    <td className="p-4 text-right">
                        <button onClick={() => handleEdit(c)} className="text-blue-600 hover:text-blue-800 font-bold text-xs border border-blue-200 px-3 py-1 rounded">
                            Edit
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>


      {/* Edit Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Edit {editingCourse.code}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Materials Link (OneDrive/SharePoint)</label>
                        <input 
                            type="url" 
                            className="w-full border rounded p-2 text-sm"
                            value={formData.materialLink}
                            onChange={e => setFormData({...formData, materialLink: e.target.value})}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Assign Instructors</label>
                        <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2 bg-gray-50">
                            {instructors.map(inst => (
                                <label key={inst.id} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-white p-1 rounded">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.instructorIds.includes(inst.id)}
                                        onChange={() => toggleInstructor(inst.id)}
                                        className="rounded text-blue-600"
                                    />
                                    <span>{inst.name} <span className="text-gray-400 text-xs">({inst.email})</span></span>
                                </label>
                            ))}
                            {instructors.length === 0 && <p className="text-xs text-gray-400 italic">No instructors found. Change user roles first.</p>}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setEditingCourse(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-bold">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
