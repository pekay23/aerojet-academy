"use client";

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// FIX 1: Updated import path to match your structure
import { UploadButton } from '@/app/utils/uploadthing'; 
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

export default function StaffProfileClient() {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const [name, setName] = useState(session?.user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveName = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      if (!res.ok) throw new Error();

      await update({ name });
      router.refresh();
      toast.success("Name updated successfully!");
    } catch {
      toast.error("Failed to update name.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (url: string) => {
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: url })
      });

      await update({ image: url });
      router.refresh();
      toast.success("Profile picture updated!");
    } catch {
      toast.error("Failed to update picture.");
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      
      {/* Profile Picture Card */}
      <Card>
        <CardHeader><CardTitle>Profile Picture</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <Avatar className="w-32 h-32 border-4 border-slate-100 shadow-sm">
            <AvatarImage src={session?.user?.image || ''} />
            <AvatarFallback className="text-2xl">{session?.user?.name?.[0]}</AvatarFallback>
          </Avatar>
          
          <div className="w-full max-w-xs text-center">
            <UploadButton
              endpoint="userProfileImage"
              // FIX 2: Added explicit type or 'any' to fix the error
              onClientUploadComplete={(res: any) => {
                if (res?.[0]) handleImageUpload(res[0].url);
              }}
              onUploadError={(error: Error) => {
                toast.error(`Upload failed: ${error.message}`);
              }}
              appearance={{
                button: "bg-aerojet-sky text-white w-full",
                allowedContent: "hidden"
              }}
            />
            <p className="text-xs text-slate-400 mt-2">Max 4MB. PNG/JPG.</p>
          </div>
        </CardContent>
      </Card>

      {/* Account Details Card */}
      <Card>
        <CardHeader><CardTitle>Account Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input value={session?.user?.email || ''} disabled className="bg-slate-50 text-slate-500 cursor-not-allowed" />
            <p className="text-[10px] text-slate-400">Email cannot be changed.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="pt-4">
            <Button onClick={handleSaveName} disabled={isSaving} className="w-full bg-aerojet-blue">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
