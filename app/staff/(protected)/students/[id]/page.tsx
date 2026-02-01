"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import InputModal from "@/components/modal/InputModal";
import { UploadButton } from "@/app/utils/uploadthing"; 
import Image from "next/image";

export default function StudentDetailPage() {
  const params = useParams();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditIdOpen, setIsEditIdOpen] = useState(false);

  async function fetchStudent() {
    try {
      const res = await fetch(`/api/staff/students/${params.id}`);
      const data = await res.json();
      setStudent(data.student);
    } catch (error) {
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStudent(); }, []);

  const handlePhotoUpload = async (res: any[]) => {
    if (!res?.[0]?.url) return;
    const url = res[0].url;

    const apiRes = await fetch(`/api/staff/students/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoUrl: url })
    });

    if (apiRes.ok) {
        toast.success("Official Photo Updated");
        fetchStudent();
    } else {
        toast.error("Failed to update photo");
    }
  };

  const handleUpdateId = async (newId: string) => {
    const res = await fetch(`/api/staff/students/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: newId })
    });
    if (res.ok) {
        toast.success("Student ID Updated");
        fetchStudent();
    } else {
        toast.error("Failed to update ID");
    }
  };

  if (loading) return <div className="p-8">Loading Profile...</div>;
  if (!student) return <div className="p-8">Student not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Header Profile */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="flex gap-6 items-center">
            
            {/* Photo Section with Hover Upload */}
            <div className="relative group w-24 h-24 shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate-100 shadow-sm relative bg-slate-200">
                    {student.photoUrl ? (
                        <Image src={student.photoUrl} alt="Official" layout="fill" objectFit="cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-500">
                            {student.user.name?.[0]}
                        </div>
                    )}
                </div>
                
                {/* Upload Overlay */}
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer overflow-hidden">
                     <div className="absolute inset-0 flex items-center justify-center">
                        <UploadButton
                            endpoint="adminStudentPhoto"
                            onClientUploadComplete={handlePhotoUpload}
                            // FIX IS HERE: Added curly braces to avoid returning the toast ID
                            onUploadError={(error: Error) => {
                                toast.error(`Upload Failed: ${error.message}`);
                            }}
                            appearance={{
                                button: "w-full h-full bg-transparent text-transparent absolute inset-0 cursor-pointer",
                                container: "w-full h-full",
                                allowedContent: "hidden"
                            }}
                        />
                        <span className="text-white text-xs font-bold pointer-events-none relative z-10">Change</span>
                     </div>
                </div>
            </div>

            <div>
                <h1 className="text-2xl font-bold text-slate-800">{student.user.name}</h1>
                <p className="text-slate-500">{student.user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-bold text-gray-600">Student ID:</span>
                    <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">
                        {student.studentId || "PENDING"}
                    </span>
                    <button onClick={() => setIsEditIdOpen(true)} className="text-xs text-blue-500 hover:underline">Edit</button>
                </div>
            </div>
        </div>
        
        <div className="text-left md:text-right w-full md:w-auto">
            <span className="block text-sm text-gray-500">Enrollment Status</span>
            <span className="font-bold text-green-600 uppercase tracking-wide">{student.enrollmentStatus}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Applications */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Applications</h3>
            {student.applications.length === 0 ? <p className="text-sm text-gray-400">No applications found.</p> : (
                <ul className="space-y-3">
                    {student.applications.map((app: any) => (
                        <li key={app.id} className="flex justify-between text-sm">
                            <span className="font-medium text-slate-700">{app.course.code}</span>
                            <span className={`font-bold ${app.status === 'APPROVED' ? 'text-green-600' : 'text-yellow-600'}`}>{app.status}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>

        {/* Financials */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Financial History</h3>
            {student.fees.length === 0 ? <p className="text-sm text-gray-400">No financial records.</p> : (
                <ul className="space-y-3">
                    {student.fees.map((fee: any) => (
                        <li key={fee.id} className="flex justify-between text-sm items-center border-b border-gray-50 pb-2 last:border-0">
                            <span className="truncate w-1/2 text-slate-600">{fee.description}</span>
                            <span className={`font-bold font-mono ${fee.status === 'PAID' ? 'text-green-600' : 'text-red-600'}`}>
                                {fee.status} ({fee.amount})
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
      </div>

      <InputModal 
        isOpen={isEditIdOpen}
        onClose={() => setIsEditIdOpen(false)}
        onConfirm={handleUpdateId}
        title="Assign Student ID"
        message="Enter the official Student ID (e.g. AAT-2026-005). This must be unique."
        defaultValue={student.studentId || ""}
        placeholder="AAT-YYYY-XXX"
      />
    </div>
  );
}
