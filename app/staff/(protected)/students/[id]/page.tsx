"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation"; // Added useRouter
import Link from "next/link";
import Image from "next/image";
import InputModal from "@/components/modal/InputModal";
import ConfirmationModal from "@/components/modal/ConfirmationModal"; // Added for Delete
import { UploadButton } from "@/app/utils/uploadthing"; 

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditIdOpen, setIsEditIdOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  async function fetchStudent() {
    try {
      const res = await fetch(`/api/staff/students/${params.id}`);
      const data = await res.json();
      if (res.ok) {
        setStudent(data.student);
      } else {
        toast.error("Student not found");
      }
    } catch (error) {
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStudent(); }, []);

  // --- 1. HANDLE PHOTO UPLOAD ---
  const handlePhotoUpload = async (res: any[]) => {
    if (!res?.[0]?.url) return;
    const url = res[0].url;

    const apiRes = await fetch(`/api/staff/students/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoUrl: url })
    });

    if (apiRes.ok) {
        toast.success("Official ID Photo Updated");
        fetchStudent();
    } else {
        toast.error("Failed to update photo");
    }
  };

  // --- 2. HANDLE MANUAL ENROLLMENT ---
  const handleEnroll = async () => {
    const res = await fetch(`/api/staff/students/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollmentStatus: 'ENROLLED' })
    });

    if (res.ok) {
        toast.success("Student officially ENROLLED");
        fetchStudent();
    } else {
        toast.error("Failed to update status");
    }
  };

  // --- 3. HANDLE STUDENT ID UPDATE ---
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

  // --- 4. HANDLE DELETE ACCOUNT ---
  const handleDelete = async () => {
    const res = await fetch(`/api/staff/students/${params.id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
        toast.success("Account permanently deleted");
        router.push('/staff/students'); // Go back to list
    } else {
        toast.error("Failed to delete account");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Profile...</div>;
  if (!student) return <div className="p-8 text-center text-red-500">Student record not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* Header Profile Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start gap-6 relative overflow-hidden">
        <div className="flex gap-6 items-center z-10">
            
            {/* Photo Section with Hover Upload */}
            <div className="relative group w-28 h-28 shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate-100 shadow-md relative bg-slate-200">
                    {student.photoUrl ? (
                        <Image 
                          src={student.photoUrl} 
                          alt="Official" 
                          fill
                          className="object-cover" 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-400">
                            {student.user.name?.[0]}
                        </div>
                    )}
                </div>
                
                {/* Upload Overlay */}
                <div className="absolute inset-0 bg-slate-900/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer overflow-hidden">
                     <div className="absolute inset-0 flex items-center justify-center">
                        <UploadButton
                            endpoint="adminStudentPhoto"
                            onClientUploadComplete={handlePhotoUpload}
                            onUploadError={(error: Error) => {
                                toast.error(`Upload Failed: ${error.message}`);
                            }}
                            appearance={{
                                button: "w-full h-full bg-transparent text-transparent absolute inset-0 cursor-pointer",
                                container: "w-full h-full",
                                allowedContent: "hidden"
                            }}
                        />
                        <span className="text-white text-[10px] font-black uppercase pointer-events-none relative z-10 text-center px-2">Update Photo</span>
                     </div>
                </div>
            </div>

            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{student.user.name}</h1>
                <p className="text-slate-500 font-medium">{student.user.email}</p>
                <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student ID</span>
                    <span className="font-mono text-blue-600 font-black bg-blue-50 px-3 py-1 rounded-lg text-sm border border-blue-100">
                        {student.studentId || "UNASSIGNED"}
                    </span>
                    <button onClick={() => setIsEditIdOpen(true)} className="text-[10px] font-bold text-aerojet-sky hover:underline uppercase tracking-tighter">Modify ID</button>
                </div>
            </div>
        </div>
        
        {/* Status Area */}
        <div className="text-left md:text-right w-full md:w-auto border-t md:border-0 pt-4 md:pt-0 z-10">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Academic Standing</span>
            <div className="flex flex-col gap-3 md:items-end">
                <span className={`font-black text-sm uppercase px-3 py-1 rounded-full border ${student.enrollmentStatus === 'ENROLLED' ? 'text-green-600 border-green-200 bg-green-50' : 'text-orange-500 border-orange-200 bg-orange-50'}`}>
                    {student.enrollmentStatus}
                </span>
                
                <div className="flex gap-2">
                    {student.enrollmentStatus !== 'ENROLLED' && (
                        <button 
                            onClick={handleEnroll}
                            className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-black px-4 py-2 rounded-lg shadow-sm transition-all uppercase tracking-widest"
                        >
                            Confirm Enrollment
                        </button>
                    )}
                    <button 
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="bg-white hover:bg-red-50 text-red-500 border border-red-100 text-[10px] font-black px-4 py-2 rounded-lg shadow-sm transition-all uppercase tracking-widest"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Applications */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-black text-slate-900 mb-6 border-b border-slate-50 pb-4 text-xs uppercase tracking-[0.2em]">Active Applications</h3>
            {student.applications.length === 0 ? <p className="text-sm text-slate-400 italic">No course applications on record.</p> : (
                <div className="space-y-3">
                    {student.applications.map((app: any) => (
                        <div key={app.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <p className="font-black text-slate-800 text-sm">{app.course.code}</p>
                                <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">{app.course.title}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${app.status === 'APPROVED' ? 'bg-green-500 text-white' : 'bg-orange-400 text-white'}`}>
                                {app.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Financials */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-black text-slate-900 mb-6 border-b border-slate-50 pb-4 text-xs uppercase tracking-[0.2em]">Financial Ledger</h3>
            {student.fees.length === 0 ? <p className="text-sm text-slate-400 italic">No financial transactions found.</p> : (
                <div className="space-y-3">
                    {student.fees.map((fee: any) => (
                        <div key={fee.id} className="flex justify-between items-center p-4 border-b border-slate-50 last:border-0">
                            <div className="max-w-[60%]">
                                <p className="font-bold text-slate-700 text-sm truncate">{fee.description}</p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Due: {new Date(fee.dueDate).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-slate-900 text-sm font-mono">€{fee.amount.toFixed(2)}</p>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${fee.status === 'PAID' ? 'text-green-600' : 'text-red-500'}`}>
                                    {fee.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* --- MODALS --- */}
      <InputModal 
        isOpen={isEditIdOpen}
        onClose={() => setIsEditIdOpen(false)}
        onConfirm={handleUpdateId}
        title="Assign Student ID"
        message="Enter the official Student ID format. This will be used for all certificates and exams."
        defaultValue={student.studentId || ""}
        placeholder="AATA000#"
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Student Account"
        message={`Are you sure you want to permanently delete ${student.user.name}? This will remove all their applications, grades, and financial records. This action cannot be reversed.`}
      />
    </div>
  );
}
