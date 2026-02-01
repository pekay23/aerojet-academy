"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link"; // Ensure Link is imported

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
        toast.success("Initial application sent. Now complete the full form.");
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

  const myCourseIds = new Set(applications.map(app => app.courseId));
  const availableCourses = courses.filter(c => !myCourseIds.has(c.id));
  const fullTimePrograms = availableCourses.filter(c => c.code.startsWith('PROG-'));
  const examModules = availableCourses.filter(c => c.code.startsWith('MOD-'));

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Courses...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight">Courses & Exams</h1>
          <p className="text-slate-500 mt-1">Manage your active enrollments and browse available programs.</p>
        </div>
        
        <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
          <button onClick={() => setActiveTab('my-courses')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'my-courses' ? "bg-aerojet-sky text-white shadow-md" : "text-slate-400 hover:text-aerojet-blue"}`}>
            My Enrollments
          </button>
          <button onClick={() => setActiveTab('browse')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'browse' ? "bg-aerojet-sky text-white shadow-md" : "text-slate-400 hover:text-aerojet-blue"}`}>
            Browse Catalog
          </button>
        </div>
      </div>

      {/* --- TAB: MY ENROLLMENTS --- */}
      {activeTab === 'my-courses' && (
        <div className="space-y-6">
          {applications.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-medium mb-4">You have not applied for any courses yet.</p>
              <button onClick={() => setActiveTab('browse')} className="bg-aerojet-sky text-white px-8 py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all">Browse Catalog &rarr;</button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {applications.map((app) => (
                <div key={app.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                            app.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                            app.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                            'bg-orange-100 text-orange-700'
                        }`}>
                            {app.status}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-xl font-black text-aerojet-blue leading-tight mb-1">{app.course?.title}</h3>
                    <p className="text-xs font-bold text-aerojet-sky font-mono uppercase">{app.course?.code}</p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-50">
                    {app.status === 'APPROVED' ? (
                      app.course?.materialLink ? (
                        <a 
                          href={app.course.materialLink} 
                          target="_blank" 
                          rel="noopener noreferrer"  
                          className="block w-full py-3 rounded-xl bg-aerojet-blue text-white font-black text-center text-xs uppercase tracking-widest hover:bg-aerojet-sky transition-all shadow-md"
                        >
                          Access Course Materials ↗
                        </a>
                      ) : (
                        <button disabled className="w-full py-3 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs uppercase cursor-not-allowed">Materials Not Yet Linked</button>
                      )
                    ) : (
                      <div className="space-y-3">
                        <Link 
                          href={`/portal/applications/${app.id}`}
                          className="block w-full py-3 rounded-xl bg-orange-500 text-white font-black text-center text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md"
                        >
                          Complete Application Form &rarr;
                        </Link>
                        <p className="text-[10px] text-center text-slate-400 font-medium">
                          Note: Enrollment is confirmed after fee verification.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB: BROWSE CATALOG --- */}
      {activeTab === 'browse' && (
        <div className="space-y-16">
          
          {/* Section: Full-Time Programs */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center">
              <span className="w-8 h-px bg-slate-200 mr-4"></span>
              A. Full-Time & Revision Programmes
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {fullTimePrograms.map((course) => (
                <div key={course.id} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col group hover:border-aerojet-sky transition-all">
                  <div className="grow">
                    <h3 className="text-xl font-black text-aerojet-blue mb-2 group-hover:text-aerojet-sky transition-colors">{course.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-6">{course.description}</p>
                    <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest mb-6 bg-slate-50 p-3 rounded-xl">
                        <span>⏱ {course.duration}</span>
                        <span className="text-aerojet-blue text-sm">€{course.price.toLocaleString()}</span>
                    </div>
                  </div>
                  <button onClick={() => handleApply(course.id)} disabled={!!applyingId} className="w-full py-4 rounded-xl border-2 border-aerojet-sky text-aerojet-sky font-black uppercase text-xs tracking-widest hover:bg-aerojet-sky hover:text-white transition-all disabled:opacity-50">
                    {applyingId === course.id ? 'Processing...' : 'Start Application'}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Modular Exams */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center">
              <span className="w-8 h-px bg-slate-200 mr-4"></span>
              B. Modular Exam Seats (First Attempt)
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-sm text-slate-600 min-w-175">
                        <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-5 whitespace-nowrap">Code</th>
                                <th className="px-6 py-5 whitespace-nowrap">Module Title</th>
                                <th className="px-6 py-5 text-right whitespace-nowrap">Price</th>
                                <th className="px-6 py-5 text-center whitespace-nowrap">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {examModules.map((course) => (
                                <tr key={course.id} className="hover:bg-slate-50/50 transition">
                                    <td className="px-6 py-4 font-mono text-aerojet-sky whitespace-nowrap font-black">{course.code}</td>
                                    <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">{course.title}</td>
                                    <td className="px-6 py-4 text-right font-black text-slate-900 whitespace-nowrap">€{course.price}</td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        <button 
                                            onClick={() => handleApply(course.id)}
                                            disabled={!!applyingId}
                                            className="text-aerojet-sky hover:text-aerojet-blue font-black uppercase text-[10px] tracking-tighter border border-aerojet-sky px-5 py-2 rounded-lg disabled:opacity-50 transition-all hover:bg-blue-50 active:scale-95"
                                        >
                                            {applyingId === course.id ? '...' : 'Select Seat'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
