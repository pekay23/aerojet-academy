"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { UploadButton } from "@/app/utils/uploadthing";

export default function CompleteApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    educationLevel: '',
    institutionName: '',
    graduationYear: '',
    idDocumentUrl: '',
    certificateUrl: '',
    transcriptUrl: ''
  });

  useEffect(() => {
    fetch(`/api/portal/applications/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setApp(data.application);
        if (data.application) {
            setFormData({
                educationLevel: data.application.educationLevel || '',
                institutionName: data.application.institutionName || '',
                graduationYear: data.application.graduationYear || '',
                idDocumentUrl: data.application.idDocumentUrl || '',
                certificateUrl: data.application.certificateUrl || '',
                transcriptUrl: data.application.transcriptUrl || ''
            });
        }
        setLoading(false);
      });
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/portal/applications/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });

    if (res.ok) {
        toast.success("Application submitted for review!");
        router.push('/portal/courses');
    } else {
        const err = await res.json();
        toast.error(err.error || "Submission failed.");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading application form...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-aerojet-blue tracking-tight uppercase">Complete Your Application</h1>
        <p className="text-slate-500">Course: <span className="font-bold">{app?.course?.title}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Academic Details */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 border-b pb-2">Academic Background</h2>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Education Level</label>
                    <select className="w-full border border-slate-300 rounded-lg p-2 bg-white" value={formData.educationLevel} onChange={e => setFormData({...formData, educationLevel: e.target.value})} required>
                        <option value="">Select Level...</option>
                        <option value="High School">High School / WASSCE</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Degree">Bachelor's Degree</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Institution Name</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg p-2" value={formData.institutionName} onChange={e => setFormData({...formData, institutionName: e.target.value})} required />
                </div>
            </div>
        </section>

        {/* Document Uploads */}
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 border-b pb-2">Required Documents (PDF or Image)</h2>
            <div className="space-y-6">
                
                {/* ID Upload */}
                <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-50 rounded-xl gap-4">
                    <div>
                        <p className="font-bold text-slate-800">Passport or National ID</p>
                        <p className="text-xs text-slate-500">{formData.idDocumentUrl ? '✅ File Uploaded' : '❌ Missing'}</p>
                    </div>
                    <UploadButton 
                        endpoint="paymentProof"
                        onClientUploadComplete={(res) => setFormData({...formData, idDocumentUrl: res[0].url})}
                        // FIX: Wrapped in braces to return void
                        onUploadError={(e) => { toast.error(e.message); }}
                    />
                </div>

                {/* Certificate Upload */}
                <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-50 rounded-xl gap-4">
                    <div>
                        <p className="font-bold text-slate-800">High School Certificate</p>
                        <p className="text-xs text-slate-500">{formData.certificateUrl ? '✅ File Uploaded' : '❌ Missing'}</p>
                    </div>
                    <UploadButton 
                        endpoint="paymentProof"
                        onClientUploadComplete={(res) => setFormData({...formData, certificateUrl: res[0].url})}
                        // FIX: Wrapped in braces to return void
                        onUploadError={(e) => { toast.error(e.message); }}
                    />
                </div>

            </div>
        </section>

        <div className="flex justify-end pt-4">
            <button type="submit" className="bg-aerojet-sky text-white px-12 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-aerojet-blue shadow-lg transition-all">
                Submit Full Application
            </button>
        </div>
      </form>
    </div>
  );
}
