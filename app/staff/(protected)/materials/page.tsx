"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link"; // Import Link

export default function TeachingMaterialsPage() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    fetch('/api/staff/my-teaching')
      .then(res => res.json())
      .then(data => {
        setCourses(data.courses || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading Courses...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Teaching Materials</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? <p className="text-gray-500 col-span-3 text-center py-10 bg-white rounded shadow-sm">You are not assigned to any courses yet.</p> : courses.map(c => (
            
            <div key={c.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col overflow-hidden group">
                
                {/* Clickable Card Header -> Goes to Roster */}
                <Link href={`/staff/materials/${c.id}`} className="block p-6 bg-slate-50 border-b border-gray-100 grow group-hover:bg-blue-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Class Roster</span>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-700">{c.code}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{c.title}</p>
                </Link>
                
                {/* Material Link Footer */}
                <div className="p-4 bg-white">
                    <h4 className="font-bold text-[10px] uppercase text-slate-400 mb-2 tracking-widest">Course Materials</h4>
                    {c.materialLink ? (
                        <a 
                            href={c.materialLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800 text-xs font-bold transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            Open Link
                        </a>
                    ) : (
                        <p className="text-red-400 text-xs italic">No materials link set.</p>
                    )}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
