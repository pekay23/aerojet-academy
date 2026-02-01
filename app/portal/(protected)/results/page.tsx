"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function StudentResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch('/api/portal/results');
        const data = await res.json();
        setResults(data.results || []);
      } catch (error) {
        toast.error("Failed to load results");
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Results...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-aerojet-blue">Academic Transcript</h1>
        <p className="text-gray-600 mt-1">Your official examination results and assessments.</p>
      </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {/* Added overflow-x-auto and no-scrollbar here */}
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm text-gray-600 min-w-175">
              <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                      <th className="px-6 py-4 whitespace-nowrap">Date</th>
                      <th className="px-6 py-4 whitespace-nowrap">Module / Exam</th>
                      <th className="px-6 py-4 whitespace-nowrap">Type</th>
                      <th className="px-6 py-4 text-center whitespace-nowrap">Score</th>
                      <th className="px-6 py-4 text-center whitespace-nowrap">Grade</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {results.length === 0 ? (
                      <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">No results published yet.</td>
                      </tr>
                  ) : (
                      results.map((res) => (
                          <tr key={res.id} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-4 font-mono whitespace-nowrap">
                                  {new Date(res.recordedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                  <p className="font-bold text-aerojet-blue">
                                      {res.run?.course.code || "Internal Assessment"}
                                  </p>
                                  <p className="text-[10px] text-gray-500">
                                      {res.run?.course.title || "-"}
                                  </p>
                              </td>
                              <td className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase whitespace-nowrap">
                                  {res.type.replace('_', ' ')}
                              </td>
                              <td className="px-6 py-4 text-center font-mono text-lg font-bold text-slate-700 whitespace-nowrap">
                                  {res.score}%
                              </td>
                              <td className="px-6 py-4 text-center whitespace-nowrap">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                                      res.isPassed ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
                                  }`}>
                                      {res.isPassed ? 'PASS' : 'FAIL'}
                                  </span>
                              </td>
                          </tr>
                      ))
                  )}
              </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
