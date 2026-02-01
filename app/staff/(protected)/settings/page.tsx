"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function StaffSettingsPage() {
  const [activeTab, setActiveTab] = useState<'rooms' | 'modules'>('rooms');
  
  const [rooms, setRooms] = useState<any[]>([]); 
  const [modules, setModules] = useState<any[]>([]);
  
  // Room State
  const [roomForm, setRoomForm] = useState({ id: '', name: '', code: '', capacity: '28' });
  const [isEditingRoom, setIsEditingRoom] = useState(false);

  // Module State
  const [modForm, setModForm] = useState({ id: '', code: 'MOD-', title: '', price: '520' });
  const [isEditingMod, setIsEditingMod] = useState(false);

  // --- FETCH DATA ---
  const fetchRooms = () => {
    fetch('/api/staff/settings').then(res => res.json()).then(data => setRooms(data.rooms || []));
  };

  const fetchModules = () => {
    fetch('/api/staff/courses').then(res => res.json()).then(data => setModules(data.courses || []));
  };

  useEffect(() => {
    if (activeTab === 'rooms') fetchRooms();
    if (activeTab === 'modules') fetchModules();
  }, [activeTab]);

  // --- ROOM HANDLERS ---
  const handleRoomSubmit = async () => {
    const method = isEditingRoom ? 'PATCH' : 'POST';
    const payload = { ...roomForm, type: 'room' };
    
    const res = await fetch('/api/staff/settings', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        toast.success(isEditingRoom ? "Room Updated" : "Room Created");
        setRoomForm({ id: '', name: '', code: '', capacity: '28' });
        setIsEditingRoom(false);
        fetchRooms();
    } else {
        toast.error("Failed. Code must be unique.");
    }
  };

  const handleEditRoom = (room: any) => {
      setRoomForm({ id: room.id, name: room.name, code: room.code, capacity: room.capacity.toString() });
      setIsEditingRoom(true);
  };

  const handleDeleteRoom = async (id: string) => {
      if(!confirm("Delete this room?")) return;
      const res = await fetch('/api/staff/settings', { 
          method: 'DELETE', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }) 
      });
      if (res.ok) { toast.success("Room Deleted"); fetchRooms(); }
      else { toast.error("Failed to delete."); }
  };

  // --- MODULE HANDLERS ---
  const handleModuleSubmit = async () => {
    const method = isEditingMod ? 'PATCH' : 'POST';
    // We now use the /api/staff/courses endpoint which handles CRUD for modules
    const res = await fetch('/api/staff/courses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modForm)
    });

    if (res.ok) {
        toast.success(isEditingMod ? "Module Updated" : "Module Created");
        setModForm({ id: '', code: 'MOD-', title: '', price: '520' });
        setIsEditingMod(false);
        fetchModules();
    } else {
        toast.error("Failed. Code must be unique.");
    }
  };

  const handleEditMod = (mod: any) => {
      setModForm({ id: mod.id, code: mod.code, title: mod.title, price: mod.price.toString() });
      setIsEditingMod(true);
  };

  const handleDeleteMod = async (id: string) => {
      if(!confirm("Delete this module? This may affect exam history.")) return;
      const res = await fetch('/api/staff/courses', { 
          method: 'DELETE', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }) 
      });
      if (res.ok) { toast.success("Module Deleted"); fetchModules(); }
      else { toast.error("Failed. Module likely has associated applications or exams."); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">System Configuration</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
            onClick={() => setActiveTab('rooms')}
            className={`px-6 py-3 font-bold text-sm ${activeTab === 'rooms' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
            Exam Rooms
        </button>
        <button 
            onClick={() => setActiveTab('modules')}
            className={`px-6 py-3 font-bold text-sm ${activeTab === 'modules' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
            Course Modules
        </button>
      </div>

      {/* --- ROOMS TAB --- */}
      {activeTab === 'rooms' && (
        <div className="space-y-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-slate-700 mb-4">{isEditingRoom ? 'Edit Exam Hall' : 'Add New Exam Hall'}</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Room Name</label><input type="text" value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} className="w-full border rounded p-2 text-sm" placeholder="e.g. Hall C" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Room Code</label><input type="text" value={roomForm.code} onChange={e => setRoomForm({...roomForm, code: e.target.value})} className="w-full border rounded p-2 text-sm uppercase" placeholder="ROOM-C" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Capacity</label><input type="number" value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: e.target.value})} className="w-full border rounded p-2 text-sm" /></div>
                </div>
                <div className="mt-6 flex gap-2">
                    <button onClick={handleRoomSubmit} className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold text-sm hover:bg-blue-700">{isEditingRoom ? 'Update' : 'Create'}</button>
                    {isEditingRoom && <button onClick={() => { setIsEditingRoom(false); setRoomForm({ id: '', name: '', code: '', capacity: '28' }); }} className="text-gray-500 font-bold text-sm hover:underline px-4">Cancel</button>}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-sm min-w-150">
                        <thead className="bg-slate-50 border-b font-bold text-slate-700">
                            <tr><th className="p-4">Name</th><th className="p-4">Code</th><th className="p-4">Capacity</th><th className="p-4 text-right">Action</th></tr>
                        </thead>
                        <tbody className="divide-y">
                            {rooms.length === 0 ? (
                                <tr><td colSpan={4} className="p-6 text-center text-gray-400">No rooms found.</td></tr>
                            ) : (
                                rooms.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50">
                                        <td className="p-4 font-medium text-slate-800">{r.name}</td>
                                        <td className="p-4 font-mono text-slate-500">{r.code}</td>
                                        <td className="p-4">{r.capacity} Seats</td>
                                        <td className="p-4 text-right space-x-3">
                                            <button onClick={() => handleEditRoom(r)} className="text-blue-600 font-bold hover:underline">Edit</button>
                                            <button onClick={() => handleDeleteRoom(r.id)} className="text-red-500 font-bold hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>
      )}

      {/* --- MODULES TAB --- */}
      {activeTab === 'modules' && (
        <div className="space-y-8">
            {/* Module Form */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-slate-700 mb-4">{isEditingMod ? 'Edit EASA Module' : 'Add New EASA Module'}</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Module Code</label><input type="text" value={modForm.code} onChange={e => setModForm({...modForm, code: e.target.value})} className="w-full border rounded p-2 text-sm uppercase" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Module Title</label><input type="text" value={modForm.title} onChange={e => setModForm({...modForm, title: e.target.value})} className="w-full border rounded p-2 text-sm" placeholder="e.g. M11 - Turbine" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">Price (€)</label><input type="number" value={modForm.price} onChange={e => setModForm({...modForm, price: e.target.value})} className="w-full border rounded p-2 text-sm" /></div>
                </div>
                <div className="mt-6 flex gap-2">
                    <button onClick={handleModuleSubmit} className="bg-blue-600 text-white px-6 py-2 rounded-md font-bold text-sm hover:bg-blue-700">{isEditingMod ? 'Update' : 'Create'}</button>
                    {isEditingMod && <button onClick={() => { setIsEditingMod(false); setModForm({ id: '', code: 'MOD-', title: '', price: '520' }); }} className="text-gray-500 font-bold text-sm hover:underline px-4">Cancel</button>}
                </div>
            </div>

            {/* Module List */}
            <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-sm min-w-150">
                        <thead className="bg-slate-50 border-b font-bold"><tr><th className="p-4">Code</th><th className="p-4">Title</th><th className="p-4">Price</th><th className="p-4 text-right">Action</th></tr></thead>
                        <tbody className="divide-y">
                            {modules.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-gray-400">No modules found.</td></tr> : 
                            modules.map(m => (
                                <tr key={m.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono font-bold text-slate-700">{m.code}</td>
                                    <td className="p-4">{m.title}</td>
                                    <td className="p-4">€{m.price}</td>
                                    <td className="p-4 text-right space-x-3">
                                        <button onClick={() => handleEditMod(m)} className="text-blue-600 font-bold hover:underline">Edit</button>
                                        <button onClick={() => handleDeleteMod(m.id)} className="text-red-500 font-bold hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>
      )}
    </div>
  );
}
