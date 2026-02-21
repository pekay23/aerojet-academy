import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/app/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Award } from 'lucide-react';

export default async function ApplicantProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return <div>Please log in to view your profile.</div>;
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    include: { studentProfile: true }
  });

  if (!user) {
    return <div>User not found.</div>;
  }

  const student = user.studentProfile;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between pb-6 border-b border-border">
        <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 border-4 border-background shadow-xl">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {user.name?.[0] || 'U'}
                </AvatarFallback>
            </Avatar>
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{user.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="font-normal text-muted-foreground">
                        {user.role === 'STUDENT' ? (student?.studentId ? `Applicant ID: ${student.studentId}` : 'Applicant') : user.role}
                    </Badge>
                     <Badge className={user.isActive ? "bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 shadow-none border-green-200 dark:border-green-800" : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"}>
                        {user.isActive ? 'Active Account' : 'Pending Verification'}
                    </Badge>
                </div>
            </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
      
        {/* Personal Information Card */}
        <Card className="shadow-sm border-border/60">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-5 h-5 text-primary" />
                    Personal Information
                </CardTitle>
                <CardDescription>Your basic account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-muted-foreground">Full Name</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input readOnly value={user.name || ''} className="pl-9 bg-muted/50" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-muted-foreground">Email Address</Label>
                     <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input readOnly value={user.email || ''} className="pl-9 bg-muted/50" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Contact support to change your email address.
                    </p>
                </div>
            </CardContent>
        </Card>

        {/* Account Security Card */}
        <Card className="shadow-sm border-border/60">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="w-5 h-5 text-primary" />
                    Account Security
                </CardTitle>
                <CardDescription>Manage your password and security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-muted-foreground">Password</Label>
                    <Input type="password" readOnly value="******************" className="bg-muted/50 font-mono text-xs tracking-widest" />
                     <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Shield className="w-3 h-3" />
                        Password changes are disabled for security reasons.
                    </p>
                </div>
                
                <div className="pt-4 border-t border-border/50">
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-100 dark:border-blue-900/50">
                        <div className="flex gap-3">
                            <Award className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-200">Institutional Access</h4>
                                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                    Once enrolled, you will receive an official institutional email (@aerojet-academy.com). 
                                    Your account will be automatically migrated to this new identity.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
