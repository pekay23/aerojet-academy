"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form State
  const [formData, setFormData] = useState({
    phone: '', 
    dob: '', 
    gender: '', // Added for Admin Demographics
    address: '', 
    city: '', 
    region: '',
    emergencyName: '', 
    emergencyRelation: '', 
    emergencyPhone: ''
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });

  // High-contrast input styling
  const inputClasses = "mt-1 block w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 shadow-sm focus:outline-none focus:border-aerojet-sky focus:ring-1 focus:ring-aerojet-sky transition-all placeholder:text-slate-400";

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
            gender: data.student.gender || '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const promise = fetch('/api/portal/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    }).then(async (res) => {
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error("Passwords do not match.");
        return;
    }
    if (passwordForm.newPassword.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
    }

    setIsSaving(true);
    const promise = fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: passwordForm.newPassword })
    }).then(async (res) => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
    });

    toast.promise(promise, {
        loading: 'Updating password...',
        success: 'Password updated successfully!',
        error: 'Failed to update password.',
    });
    
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setIsSaving(false);
  };

  if (status === 'loading' || loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Account Settings...</div>;
  if (status === 'unauthenticated') return <div className="p-8 text-center text-red-500 font-bold">Access Denied.</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-extrabold text-aerojet-blue uppercase tracking-tight">Account Settings</h1>
            <p className="text-slate-500 mt-1">Manage your personal details and login security.</p>
        </div>
        
        <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
          <button onClick={() => setActiveTab('profile')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? "bg-aerojet-sky text-white shadow-md" : "text-slate-400 hover:text-aerojet-blue"}`}>
            Profile
          </button>
          <button onClick={() => setActiveTab('security')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'security' ? "bg-aerojet-sky text-white shadow-md" : "text-slate-400 hover:text-aerojet-blue"}`}>
            Security
          </button>
        </div>
      </div>
      
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="space-y-10">
            
            {/* --- Personal Details --- */}
            <section className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <header className="flex items-center gap-4 bg-slate-50 p-4 border-b border-slate-200">
                    <div className="w-8 h-8 flex items-center justify-center bg-aerojet-sky text-white rounded-lg shadow-sm text-sm">👤</div>
                    <h2 className="text-lg font-bold text-aerojet-blue uppercase tracking-tight">Personal Information</h2>
                </header>
                <div className="p-6 bg-slate-50/30 grid md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
                            <input type="text" disabled value={session?.user?.name || ''} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed font-bold" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</label>
                            <input type="email" disabled value={session?.user?.email || ''} className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed font-bold" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="dob" className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Date of Birth</label>
                        <input id="dob" type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="gender" className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Gender</label>
                        <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className={inputClasses}>
                            <option value="">Select Gender...</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="phone" className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Phone Number (WhatsApp)</label>
                        <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClasses} placeholder="+233 XX XXX XXXX" />
                    </div>
                </div>
            </section>

            {/* --- Address --- */}
            <section className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <header className="flex items-center gap-4 bg-slate-50 p-4 border-b border-slate-200">
                    <div className="w-8 h-8 flex items-center justify-center bg-aerojet-sky text-white rounded-lg shadow-sm text-sm">📍</div>
                    <h2 className="text-lg font-bold text-aerojet-blue uppercase tracking-tight">Residential Address</h2>
                </header>
                <div className="p-6 bg-slate-50/30 space-y-6">
                    <div>
                        <label htmlFor="address" className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Street Address / House No.</label>
                        <textarea id="address" name="address" rows={2} value={formData.address} onChange={handleChange} className={inputClasses} placeholder="Enter your full street address..."></textarea>
                    </div>
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                        <div>
                            <label htmlFor="city" className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">City / Town</label>
                            <input id="city" type="text" name="city" value={formData.city} onChange={handleChange} className={inputClasses} />
                        </div>
                        <div>
                            <label htmlFor="region" className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Region / State</label>
                            <input id="region" type="text" name="region" value={formData.region} onChange={handleChange} className={inputClasses} />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Emergency --- */}
            <section className="bg-white rounded-xl shadow-md border border-red-200 overflow-hidden">
                <header className="flex items-center gap-4 bg-red-50 p-4 border-b border-red-100">
                    <div className="w-8 h-8 flex items-center justify-center bg-red-600 text-white rounded-lg shadow-sm text-sm">📞</div>
                    <h2 className="text-lg font-bold text-red-800 uppercase tracking-tight">Emergency Contact</h2>
                </header>
                <div className="p-6 bg-red-50/10 grid md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <label htmlFor="emergencyName" className="block text-[10px] font-black text-red-900 uppercase tracking-widest mb-1">Contact's Full Name</label>
                        <input id="emergencyName" type="text" name="emergencyName" value={formData.emergencyName} onChange={handleChange} className={`${inputClasses} border-red-200 focus:border-red-500 focus:ring-red-500`} />
                    </div>
                    <div>
                        <label htmlFor="emergencyRelation" className="block text-[10px] font-black text-red-900 uppercase tracking-widest mb-1">Relationship</label>
                        <input id="emergencyRelation" type="text" name="emergencyRelation" value={formData.emergencyRelation} onChange={handleChange} className={`${inputClasses} border-red-200 focus:border-red-500 focus:ring-red-500`} placeholder="e.g., Parent, Sibling, Spouse" />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="emergencyPhone" className="block text-[10px] font-black text-red-900 uppercase tracking-widest mb-1">Emergency Phone Number</label>
                        <input id="emergencyPhone" type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} className={`${inputClasses} border-red-200 focus:border-red-500 focus:ring-red-500`} />
                    </div>
                </div>
            </section>

            <div className="pt-6 flex justify-end">
                <button type="submit" disabled={isSaving} className="bg-aerojet-sky text-white px-12 py-4 rounded-xl font-black uppercase tracking-[0.2em] text-sm hover:bg-aerojet-blue transition-all shadow-lg active:scale-95 disabled:opacity-50">
                    {isSaving ? 'Processing...' : 'Update My Profile'}
                </button>
            </div>
        </form>
      )}

      {activeTab === 'security' && (
        <div className="max-w-2xl mx-auto py-10">
            <section className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <header className="flex items-center gap-4 bg-slate-50 p-4 border-b border-slate-200">
                    <div className="w-8 h-8 flex items-center justify-center bg-slate-800 text-white rounded-lg shadow-sm text-sm">🔒</div>
                    <div>
                        <h2 className="text-lg font-bold text-aerojet-blue uppercase tracking-tight">Security Credentials</h2>
                        <p className="text-xs text-slate-500 font-medium">Set a password to enable email/password login.</p>
                    </div>
                </header>
                <form onSubmit={handlePasswordSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">New Password</label>
                        <input type="password" required className={inputClasses} value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Confirm Password</label>
                        <input type="password" required className={inputClasses} value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
                    </div>
                    <button type="submit" disabled={isSaving} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-black transition-all active:scale-95">
                        {isSaving ? 'Updating...' : 'Set My Password'}
                    </button>
                </form>
            </section>
        </div>
      )}
    </div>
  );
}
