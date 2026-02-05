import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, FileText, CreditCard, GraduationCap, Clock } from 'lucide-react';

export default function PortalDashboard() {
  // MOCK DATA - Replace with database call from useSession()
  const student = {
    name: "Ama Serwaa",
    status: "enquiry", // OPTIONS: 'enquiry', 'fee_paid', 'applicant', 'approved', 'enrolled'
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'enquiry':
        return { progress: 10, actionTitle: "Activate Your Application", actionDesc: "A non-refundable registration fee is required to unlock the official application form.", cta: "Pay Registration Fee", icon: CreditCard };
      case 'fee_paid':
        return { progress: 25, actionTitle: "Complete Application", actionDesc: "Your registration fee is confirmed. Please complete your student profile and upload documents.", cta: "Go to Application Form", icon: FileText };
      case 'applicant':
        return { progress: 50, actionTitle: "Application Under Review", actionDesc: "Our admissions team is reviewing your documents. You will be notified via email shortly.", cta: "View Application", icon: Clock, disabled: true };
      case 'approved':
        return { progress: 75, actionTitle: "Secure Your Seat", actionDesc: "Congratulations! You have been approved. Pay the 40% tuition deposit to confirm your seat.", cta: "Pay Seat Deposit", icon: CreditCard };
      case 'enrolled':
        return { progress: 100, actionTitle: "Welcome to Aerojet", actionDesc: "You are fully enrolled. Access your learning materials and schedule below.", cta: "Go to My Courses", icon: GraduationCap };
      default:
        return { progress: 0, actionTitle: "Welcome", actionDesc: "Loading your status...", cta: "Loading...", icon: Clock };
    }
  };

  const config = getStatusConfig(student.status);
  const ActionIcon = config.icon;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Welcome back, {student.name}</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-200">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          Status: {student.status.toUpperCase().replace('_', ' ')}
        </div>
      </div>

      <Card className="border-blue-200 bg-white shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl text-blue-900">
            <ActionIcon className="w-6 h-6" />
            {config.actionTitle}
          </CardTitle>
          <CardDescription className="text-slate-600 text-base pt-1">
            {config.actionDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-500 uppercase tracking-wider">
                <span>Application Progress</span>
                <span>{config.progress}%</span>
              </div>
              <Progress value={config.progress} />
            </div>
            <Button size="lg" className="w-full md:w-auto gap-2" disabled={config.disabled}>
              {config.cta} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
