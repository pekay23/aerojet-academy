"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [formData, setFormData] = useState({
    phone: '',
    dob: '',
    address: '',
    city: '',
    region: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: ''
  });

  useEffect(() => {
    async function fetchProfile() {
      if (status !== 'authenticated') return;
      try {
        const res = await fetch('/api/portal/profile');
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        if (data.student) {
          setFormData({
            phone: data.student.phone || '',
            dob: data.student.dob ? new Date(data.student.dob).toISOString().split('T')[0] : '',
            address: data.student.address || '',
            city: data.student.city || '',
            region: data.student.region || '',
            emergencyName: data.student.emergencyName || '',
            emergencyRelation: data.student.emergencyRelation || '',
            emergencyPhone: data.student.emergencyPhone || ''
          });
        }
      } catch (error) {
        console.error("Failed to load profile", error);
        toast.error("Could not load your profile data.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const promise = fetch('/api/portal/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    }).then(res => {
      if (!res.ok) throw new Error('Failed to save.');
      return res.json();
    });

    toast.promise(promise, {
      loading: 'Saving profile...',
      success: 'Profile updated successfully!',
      error: 'An error occurred while saving.',
    });
    
    setIsSaving(false);
  };

  if (status === 'loading' || loading) {
    return <div className="p-8 text-center text-gray-500">Loading Profile...</div>;
  }
  
  if (status === 'unauthenticated') {
    return <div className="p-8 text-center text-red-500">Access Denied. Please sign in.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-aerojet-blue">My Profile</h1>
        <p className="text-gray-600 mt-1">Keep your personal and contact information up to date.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-10">
        
        {/* --- Personal Details Card --- */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <header className="flex items-center gap-4 bg-gray-50 p-4 border-b border-gray-200">
            <div className="w-8 h-8 flex items-center justify-center bg-aerojet-sky/10 text-aerojet-sky rounded-lg">👤</div>
            <h2 className="text-lg font-bold text-aerojet-blue">Personal Details</h2>
          </header>
          <div className="p-6 grid md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" disabled value={session?.user?.name || ''} className="mt-1 w-full px-4 py-2 border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input type="email" disabled value={session?.user?.email || ''} className="mt-1 w-full px-4 py-2 border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
            </div>
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input id="dob" type="date" name="dob" value={formData.dob} onChange={handleChange} className="mt-1 w-full px-4 py-2 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-aerojet-sky" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full px-4 py-2 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-aerojet-sky" placeholder="+233..." />
            </div>
          </div>
        </section>

        {/* --- Address Card --- */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <header className="flex items-center gap-4 bg-gray-50 p-4 border-b border-gray-200">
            <div className="w-8 h-8 flex items-center justify-center bg-aerojet-sky/10 text-aerojet-sky rounded-lg">📍</div>
            <h2 className="text-lg font-bold text-aerojet-blue">Address Details</h2>
          </header>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Residential Address</label>
              <textarea id="address" name="address" rows={3} value={formData.address} onChange={handleChange} className="mt-1 w-full px-4 py-2 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-aerojet-sky" placeholder="House No, Street Name..."></textarea>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">City / Town</label>
                <input id="city" type="text" name="city" value={formData.city} onChange={handleChange} className="mt-1 w-full px-4 py-2 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-aerojet-sky" />
              </div>
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700">Region / State</label>
                <input id="region" type="text" name="region" value={formData.region} onChange={handleChange} className="mt-1 w-full px-4 py-2 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-aerojet-sky" />
              </div>
            </div>
          </div>
        </section>

        {/* --- Emergency Contact Card --- */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <header className="flex items-center gap-4 bg-red-50 p-4 border-b border-red-200">
            <div className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-lg">📞</div>
            <h2 className="text-lg font-bold text-red-800">Emergency Contact</h2>
          </header>
          <div className="p-6 grid md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="emergencyName" className="block text-sm font-medium text-gray-700">Contact's Full Name</label>
              <input id="emergencyName" type="text" name="emergencyName" value={formData.emergencyName} onChange={handleChange} className="mt-1 w-full px-4 py-2 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-aerojet-sky" />
            </div>
            <div>
              <label htmlFor="emergencyRelation" className="block text-sm font-medium text-gray-700">Relationship to You</label>
              <input id="emergencyRelation" type="text" name="emergencyRelation" value={formData.emergencyRelation} onChange={handleChange} className="mt-1 w-full px-4 py-2 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-aerojet-sky" placeholder="e.g., Mother, Spouse, Friend" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700">Contact's Phone Number</label>
              <input id="emergencyPhone" type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} className="mt-1 w-full px-4 py-2 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-aerojet-sky" />
            </div>
          </div>
        </section>
        
        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={isSaving} className="bg-aerojet-sky text-white px-10 py-3 rounded-lg font-bold hover:bg-aerojet-soft-blue transition shadow-md disabled:opacity-70 disabled:cursor-wait">
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
