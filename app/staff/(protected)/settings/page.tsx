"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function StaffSettingsPage() {
  const [activeTab, setActiveTab] = useState<'rooms' | 'modules' | 'email'>('rooms');
  
  const [rooms, setRooms] = useState<any[]>([]); 
  const [modules, setModules] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Room Form State
  const [roomForm, setRoomForm] = useState({ id: '', name: '', code: '', capacity: '28' });
  const [isEditingRoom, setIsEditingRoom] = useState(false);

  // Module Form State
  const [modForm, setModForm] = useState({ id: '', code: 'MOD-', title: '', price: '520' });
  const [isEditingMod, setIsEditingMod] = useState(false);

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
        const [resRooms, resModules, resSettings] = await Promise.all([
            fetch('/api/staff/settings'),
            fetch('/api/staff/courses'),
            fetch('/api/staff/settings/system')
        ]);

        const roomsData = await resRooms.json();
        const modulesData = await resModules.json();
        const settingsData = await resSettings.json();

        setRooms(roomsData.rooms || []);
        setModules(modulesData.courses || []);
        
        // Convert settings array to key-value object
        const settingsMap: Record<string, string> = {};
        settingsData.settings?.forEach((s: any) => settingsMap[s.key] = s.value);
        setSystemSettings(settingsMap);

    } catch (e) {
        toast.error("Failed to load settings data");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ROOM HANDLERS ---
  const handleRoomSubmit = async () => {
    const method = isEditingRoom ? 'PATCH' : 'POST';
    const res = await fetch('/api/staff/settings', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...roomForm, type: 'room' })
    });

    if (res.ok) {
        toast.success(isEditingRoom ? "Room Updated" : "Room Created");
        setRoomForm({ id: '', name: '', code: '', capacity: '28' });
        setIsEditingRoom(false);
        fetchData();
    }
  };

  const handleDeleteRoom = async (id: string) => {
      if(!confirm("Delete this room?")) return;
      const res = await fetch('/api/staff/settings', { 
          method: 'DELETE', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }) 
      });
      if (res.ok) { toast.success("Room Deleted"); fetchData(); }
  };

  // --- MODULE HANDLERS ---
  const handleModuleSubmit = async () => {
    const method = isEditingMod ? 'PATCH' : 'POST';
    const res = await fetch('/api/staff/courses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modForm)
    });

    if (res.ok) {
        toast.success(isEditingMod ? "Module Updated" : "Module Created");
        setModForm({ id: '', code: 'MOD-', title: '', price: '520' });
        setIsEditingMod(false);
        fetchData();
    }
  };

  const handleDeleteMod = async (id: string) => {
      if(!confirm("Delete this module?")) return;
      const res = await fetch('/api/staff/courses', { 
          method: 'DELETE', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }) 
      });
      if (res.ok) { toast.success("Module Deleted"); fetchData(); }
  };

  // --- SYSTEM SETTINGS HANDLERS ---
  const handleSaveSystemSetting = async (key: string, value: string) => {
    const res = await fetch('/api/staff/settings/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
    });
    if (res.ok) {
        toast.success(`Updated: ${key.replace(/_/g, ' ')}`);
        setSystemSettings({ ...systemSettings, [key]: value });
    }
  };

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading Configuration...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">System Configuration</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
            onClick={() => setActiveTab('rooms')}
            className={`px-6 py-3 font-bold text-xs uppercase tracking-widest ${activeTab === 'rooms' ? 'border-b-4 border-aerojet-sky text-aerojet-sky' : 'text-gray-400 hover:text-gray-700'}`}
        >
            Exam Rooms
        </button>
        <button 
            onClick={() => setActiveTab('modules')}
            className={`px-6 py-3 font-bold text-xs uppercase tracking-widest ${activeTab === 'modules' ? 'border-b-4 border-aerojet-sky text-aerojet-sky' : 'text-gray-400 hover:text-gray-700'}`}
        >
            Course Modules
        </button>
        <button 
            onClick={() => setActiveTab('email')}
            className={`px-6 py-3 font-bold text-xs uppercase tracking-widest ${activeTab === 'email' ? 'border-b-4 border-aerojet-sky text-aerojet-sky' : 'text-gray-400 hover:text-gray-700'}`}
        >
            Email Routing
        </button>
      </div>

      {/* --- ROOMS TAB --- */}
      {activeTab === 'rooms' && (
        <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4">{isEditingRoom ? 'Edit Exam Hall' : 'Add New Exam Hall'}</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Room Name</label><input type="text" value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-aerojet-sky outline-none" placeholder="e.g. Hall C" /></div>
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Room Code</label><input type="text" value={roomForm.code} onChange={e => setRoomForm({...roomForm, code: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm uppercase focus:border-aerojet-sky outline-none" placeholder="ROOM-C" /></div>
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Capacity</label><input type="number" value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-aerojet-sky outline-none" /></div>
                </div>
                <div className="mt-6 flex gap-2">
                    <button onClick={handleRoomSubmit} className="bg-aerojet-sky text-white px-8 py-2 rounded-lg font-bold text-sm hover:bg-aerojet-blue transition-all">{isEditingRoom ? 'Update Room' : 'Create Room'}</button>
                    {isEditingRoom && <button onClick={() => { setIsEditingRoom(false); setRoomForm({ id: '', name: '', code: '', capacity: '28' }); }} className="text-gray-500 font-bold text-sm hover:underline px-4">Cancel</button>}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-sm min-w-150">
                        <thead className="bg-slate-50 border-b font-black text-slate-400 text-[10px] uppercase">
                            <tr><th className="p-4">Name</th><th className="p-4">Code</th><th className="p-4">Capacity</th><th className="p-4 text-right">Action</th></tr>
                        </thead>
                        <tbody className="divide-y">
                            {rooms.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-gray-400">No rooms configured.</td></tr> : 
                            rooms.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 font-bold text-slate-800">{r.name}</td>
                                    <td className="p-4 font-mono text-slate-500">{r.code}</td>
                                    <td className="p-4">{r.capacity} Seats</td>
                                    <td className="p-4 text-right space-x-3">
                                        <button onClick={() => handleEditRoom(r)} className="text-blue-600 font-bold hover:underline text-xs">Edit</button>
                                        <button onClick={() => handleDeleteRoom(r.id)} className="text-red-500 font-bold hover:underline text-xs">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* --- MODULES TAB --- */}
      {activeTab === 'modules' && (
        <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4">{isEditingMod ? 'Edit EASA Module' : 'Add New EASA Module'}</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Module Code</label><input type="text" value={modForm.code} onChange={e => setModForm({...modForm, code: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm uppercase focus:border-aerojet-sky outline-none" /></div>
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Module Title</label><input type="text" value={modForm.title} onChange={e => setModForm({...modForm, title: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-aerojet-sky outline-none" /></div>
                    <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Price (€)</label><input type="number" value={modForm.price} onChange={e => setModForm({...modForm, price: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-aerojet-sky outline-none" /></div>
                </div>
                <div className="mt-6 flex gap-2">
                    <button onClick={handleModuleSubmit} className="bg-aerojet-sky text-white px-8 py-2 rounded-lg font-bold text-sm hover:bg-aerojet-blue transition-all">{isEditingMod ? 'Update Module' : 'Create Module'}</button>
                    {isEditingMod && <button onClick={() => { setIsEditingMod(false); setModForm({ id: '', code: 'MOD-', title: '', price: '520' }); }} className="text-gray-500 font-bold text-sm hover:underline px-4">Cancel</button>}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-sm min-w-150">
                        <thead className="bg-slate-50 border-b font-black text-slate-400 text-[10px] uppercase">
                            <tr><th className="p-4">Code</th><th className="p-4">Title</th><th className="p-4">Price</th><th className="p-4 text-right">Action</th></tr>
                        </thead>
                        <tbody className="divide-y">
                            {modules.map(m => (
                                <tr key={m.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 font-mono font-bold text-aerojet-sky">{m.code}</td>
                                    <td className="p-4 font-bold text-slate-800">{m.title}</td>
                                    <td className="p-4">€{m.price}</td>
                                    <td className="p-4 text-right space-x-3">
                                        <button onClick={() => handleEditMod(m)} className="text-blue-600 font-bold hover:underline text-xs">Edit</button>
                                        <button onClick={() => handleDeleteMod(m.id)} className="text-red-500 font-bold hover:underline text-xs">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* --- EMAIL ROUTING TAB --- */}
      {activeTab === 'email' && (
        <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-2xl">
                <h2 className="text-lg font-bold text-slate-800 mb-2">Notification Routing</h2>
                <p className="text-sm text-slate-500 mb-8">Define which internal email addresses receive website enquiries and system alerts.</p>
                
                <div className="space-y-6">
                    <div className="group">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Main Contact Form Recipient</label>
                        <div className="flex gap-2">
                            <input 
                                type="email" 
                                className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:border-aerojet-sky outline-none" 
                                defaultValue={systemSettings['CONTACT_FORM_RECIPIENT'] || 'floowdis1@gmail.com'}
                                onBlur={(e) => handleSaveSystemSetting('CONTACT_FORM_RECIPIENT', e.target.value)}
                            />
                            <div className="bg-slate-50 px-3 py-3 rounded-lg border border-slate-200 text-xs text-slate-400 font-bold flex items-center">Auto-Save</div>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400 italic">This email will receive all general enquiries from the Contact page.</p>
                    </div>

                    <div className="group">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Admissions & New Registrations</label>
                        <div className="flex gap-2">
                            <input 
                                type="email" 
                                className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:border-aerojet-sky outline-none" 
                                defaultValue={systemSettings['ADMISSIONS_RECIPIENT'] || 'admissions@aerojet-academy.com'}
                                onBlur={(e) => handleSaveSystemSetting('ADMISSIONS_RECIPIENT', e.target.value)}
                            />
                            <div className="bg-slate-50 px-3 py-3 rounded-lg border border-slate-200 text-xs text-slate-400 font-bold flex items-center">Auto-Save</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
