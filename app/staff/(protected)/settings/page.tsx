"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function StaffSettingsPage() {
  const [activeTab, setActiveTab] = useState<'rooms' | 'modules' | 'email'>('rooms');
  const [rooms, setRooms] = useState<any[]>([]); 
  const [modules, setModules] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Form States
  const [roomForm, setRoomForm] = useState({ id: '', name: '', code: '', capacity: '28' });
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [modForm, setModForm] = useState({ id: '', code: 'MOD-', title: '', price: '520' });
  const [isEditingMod, setIsEditingMod] = useState(false);

  const fetchData = async () => {
    try {
        const [resRooms, resModules, resSettings] = await Promise.all([
            fetch('/api/staff/settings'),
            fetch('/api/staff/courses'),
            fetch('/api/staff/settings/system')
        ]);
        const rData = await resRooms.json();
        const mData = await resModules.json();
        const sData = await resSettings.json();
        setRooms(rData.rooms || []);
        setModules(mData.courses || []);
        const settingsMap: Record<string, string> = {};
        sData.settings?.forEach((s: any) => settingsMap[s.key] = s.value);
        setSystemSettings(settingsMap);
    } catch (e) { toast.error("Failed to load settings"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- MISSING FUNCTIONS ADDED HERE ---
  const handleEditRoom = (room: any) => {
    setRoomForm({ id: room.id, name: room.name, code: room.code, capacity: room.capacity.toString() });
    setIsEditingRoom(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditMod = (mod: any) => {
    setModForm({ id: mod.id, code: mod.code, title: mod.title, price: mod.price.toString() });
    setIsEditingMod(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRoomSubmit = async () => {
    const method = isEditingRoom ? 'PATCH' : 'POST';
    const res = await fetch('/api/staff/settings', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...roomForm, type: 'room' })
    });
    if (res.ok) {
        toast.success("Room saved");
        setRoomForm({ id: '', name: '', code: '', capacity: '28' });
        setIsEditingRoom(false);
        fetchData();
    }
  };

  const handleModuleSubmit = async () => {
    const method = isEditingMod ? 'PATCH' : 'POST';
    const res = await fetch('/api/staff/courses', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modForm)
    });
    if (res.ok) {
        toast.success("Module saved");
        setModForm({ id: '', code: 'MOD-', title: '', price: '520' });
        setIsEditingMod(false);
        fetchData();
    }
  };

  const handleSaveSystemSetting = async (key: string, value: string) => {
    await fetch('/api/staff/settings/system', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
    });
    toast.success("Email setting updated");
  };

  if (loading) return <div className="p-8 animate-pulse">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <h1 className="text-2xl font-bold text-slate-800">System Configuration</h1>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {['rooms', 'modules', 'email'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-3 font-bold text-xs uppercase tracking-widest ${activeTab === tab ? 'border-b-4 border-aerojet-sky text-aerojet-sky' : 'text-gray-400'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'rooms' && (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-bold mb-4">{isEditingRoom ? 'Edit Room' : 'Add Room'}</h2>
                <div className="grid grid-cols-3 gap-4">
                    <input type="text" value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} className="border rounded p-2 text-sm" placeholder="Room Name" />
                    <input type="text" value={roomForm.code} onChange={e => setRoomForm({...roomForm, code: e.target.value})} className="border rounded p-2 text-sm uppercase" placeholder="Code" />
                    <input type="number" value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: e.target.value})} className="border rounded p-2 text-sm" placeholder="Capacity" />
                </div>
                <button onClick={handleRoomSubmit} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded font-bold text-xs uppercase tracking-widest">Save Room</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-sm min-w-150">
                        <thead className="bg-slate-50 border-b font-bold"><tr><th className="p-4">Name</th><th className="p-4">Code</th><th className="p-4">Capacity</th><th className="p-4 text-right">Action</th></tr></thead>
                        <tbody className="divide-y">
                            {rooms.map(r => (
                                <tr key={r.id}>
                                    <td className="p-4">{r.name}</td>
                                    <td className="p-4 font-mono">{r.code}</td>
                                    <td className="p-4">{r.capacity}</td>
                                    <td className="p-4 text-right"><button onClick={() => handleEditRoom(r)} className="text-blue-600 font-bold">Edit</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'modules' && (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-bold mb-4">{isEditingMod ? 'Edit Module' : 'Add Module'}</h2>
                <div className="grid grid-cols-3 gap-4">
                    <input type="text" value={modForm.code} onChange={e => setModForm({...modForm, code: e.target.value})} className="border rounded p-2 text-sm uppercase" />
                    <input type="text" value={modForm.title} onChange={e => setModForm({...modForm, title: e.target.value})} className="border rounded p-2 text-sm" placeholder="Title" />
                    <input type="number" value={modForm.price} onChange={e => setModForm({...modForm, price: e.target.value})} className="border rounded p-2 text-sm" />
                </div>
                <button onClick={handleModuleSubmit} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded font-bold text-xs uppercase tracking-widest">Save Module</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-sm min-w-150">
                        <thead className="bg-slate-50 border-b font-bold"><tr><th className="p-4">Code</th><th className="p-4">Title</th><th className="p-4">Price</th><th className="p-4 text-right">Action</th></tr></thead>
                        <tbody className="divide-y">
                            {modules.map(m => (
                                <tr key={m.id}>
                                    <td className="p-4 font-mono">{m.code}</td>
                                    <td className="p-4">{m.title}</td>
                                    <td className="p-4">€{m.price}</td>
                                    <td className="p-4 text-right"><button onClick={() => handleEditMod(m)} className="text-blue-600 font-bold">Edit</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'email' && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-2xl">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Notification Routing</h2>
            <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Contact Form Recipient</label>
                    <input type="email" className="w-full border rounded-lg p-3 text-sm" defaultValue={systemSettings['CONTACT_FORM_RECIPIENT'] || ''} onBlur={(e) => handleSaveSystemSetting('CONTACT_FORM_RECIPIENT', e.target.value)} />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Admissions Recipient</label>
                    <input type="email" className="w-full border rounded-lg p-3 text-sm" defaultValue={systemSettings['ADMISSIONS_RECIPIENT'] || ''} onBlur={(e) => handleSaveSystemSetting('ADMISSIONS_RECIPIENT', e.target.value)} />
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
