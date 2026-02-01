"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type Course = {
  id: string;
  title: string;
  code: string;
  description: string;
  duration: string;
  price: number;
};

type Application = {
  id: string;
  courseId: string;
  status: string;
  appliedAt: string;
  course: Course & { materialLink?: string };
};

export default function CoursesPage() {
  const { status } = useSession();
  const [activeTab, setActiveTab] = useState<'my-courses' | 'browse'>('my-courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  // Fetch Data
  async function fetchData() {
    try {
      const res = await fetch('/api/portal/courses');
      const data = await res.json();
      if (res.ok) {
        setCourses(data.courses || []);
        // Manually merge course data into applications for display
        const apps = (data.applications || []).map((app: any) => ({
            ...app,
            course: data.courses.find((c: any) => c.id === app.courseId)
        }));
        setApplications(apps);
        
        if (apps.length === 0) setActiveTab('browse');
      }
    } catch (error) {
      toast.error("Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'authenticated') fetchData();
  }, [status]);

  const handleApply = async (courseId: string) => {
    setApplyingId(courseId);
    try {
      const res = await fetch('/api/portal/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      
      if (res.ok) {
        toast.success("Application submitted! Please check Finance tab for invoice.");
        fetchData(); 
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to apply.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setApplyingId(null);
    }
  };

  // Filter available courses (remove ones already applied to)
  const myCourseIds = new Set(applications.map(app => app.courseId));
  const availableCourses = courses.filter(c => !myCourseIds.has(c.id));

  // Split Catalog into Categories
  const fullTimePrograms = availableCourses.filter(c => c.code.startsWith('PROG-'));
  const examModules = availableCourses.filter(c => c.code.startsWith('MOD-'));

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Courses...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-aerojet-blue">Courses & Exams</h1>
          <p className="text-gray-600 mt-1">Manage enrollments and book new modules.</p>
        </div>
        
        <div className="bg-white p-1 rounded-lg border border-gray-200 flex">
          <button onClick={() => setActiveTab('my-courses')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'my-courses' ? "bg-aerojet-sky text-white shadow-sm" : "text-gray-500 hover:text-aerojet-blue"}`}>
            My Enrollments
          </button>
          <button onClick={() => setActiveTab('browse')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'browse' ? "bg-aerojet-sky text-white shadow-sm" : "text-gray-500 hover:text-aerojet-blue"}`}>
            Browse Catalog
          </button>
        </div>
      </div>

      {/* --- MY ENROLLMENTS --- */}
      {activeTab === 'my-courses' && (
        <div className="space-y-6">
          {applications.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
              <p className="text-gray-500 mb-4">You have not enrolled in any programs yet.</p>
              <button onClick={() => setActiveTab('browse')} className="text-aerojet-sky font-bold hover:underline">Browse Catalog &rarr;</button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {applications.map((app) => (
                <div key={app.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                            app.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                            app.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                            'bg-yellow-100 text-yellow-700'
                        }`}>
                            {app.status}
                        </span>
                        <span className="text-xs text-gray-400">Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-xl font-bold text-aerojet-blue">{app.course?.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{app.course?.code}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    {app.status === 'APPROVED' ? (
    app.course?.materialLink ? (
        <a 
            href={app.course.materialLink} 
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2 rounded-lg bg-aerojet-blue text-white font-bold text-center text-sm hover:bg-aerojet-navy transition"
        >
            Access Course Materials ↗
        </a>
    ) : (
        <button disabled className="w-full py-2 rounded-lg bg-gray-200 text-gray-500 font-bold text-sm cursor-not-allowed">
            Materials Pending
        </button>
    )
) : (
    <p className="text-xs text-center text-gray-500 italic">
        Waiting for admin approval & deposit.
    </p>
)}

                    ) : (
                        <p className="text-xs text-center text-gray-500 italic">Waiting for admin approval & deposit.</p>
                    )
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- BROWSE CATALOG --- */}
      {activeTab === 'browse' && (
        <div className="space-y-12">
          
          {/* Section: Full-Time Programs */}
          <section>
            <h2 className="text-xl font-bold text-aerojet-blue mb-4 flex items-center">
              <span className="bg-aerojet-sky text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">A</span>
              Full-Time & Revision Programmes
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {fullTimePrograms.map((course) => (
                <div key={course.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                  <div className="grow">
                    <h3 className="text-lg font-bold text-aerojet-blue mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{course.description}</p>
                    <div className="flex justify-between text-sm font-semibold text-gray-500 mb-4 bg-gray-50 p-2 rounded">
                        <span>⏱ {course.duration}</span>
                        <span className="text-aerojet-blue">€{course.price.toLocaleString()}</span>
                    </div>
                  </div>
                  <button onClick={() => handleApply(course.id)} disabled={!!applyingId} className="w-full py-2 rounded-lg border-2 border-aerojet-sky text-aerojet-sky font-bold text-sm hover:bg-aerojet-sky hover:text-white transition disabled:opacity-50">
                    {applyingId === course.id ? 'Processing...' : 'Apply Now'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Modular Exams */}
          <section>
            <h2 className="text-xl font-bold text-aerojet-blue mb-4 flex items-center">
              <span className="bg-aerojet-sky text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">B</span>
              Modular Exam Seats (First Attempt)
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-800 font-bold uppercase text-xs border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3">Code</th>
                            <th className="px-6 py-3">Module Title</th>
                            <th className="px-6 py-3 text-right">Price</th>
                            <th className="px-6 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {examModules.map((course) => (
                            <tr key={course.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-mono text-aerojet-sky">{course.code}</td>
                                <td className="px-6 py-4 font-medium text-gray-800">{course.title}</td>
                                <td className="px-6 py-4 text-right">€{course.price}</td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handleApply(course.id)}
                                        disabled={!!applyingId}
                                        className="text-aerojet-sky hover:text-aerojet-blue font-bold text-xs border border-aerojet-sky px-3 py-1 rounded disabled:opacity-50"
                                    >
                                        {applyingId === course.id ? '...' : 'Select'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
