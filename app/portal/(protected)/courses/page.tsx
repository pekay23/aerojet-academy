import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, BookOpen } from 'lucide-react';

// --- PRIVATE PRICING DATA (NOT FOR PUBLIC SITE) ---
const CORE_MODULES = [
  { code: 'M1', name: 'Mathematics', hours: 20, price: 1190 },
  { code: 'M2', name: 'Physics', hours: 20, price: 1190 },
  { code: 'M3', name: 'Basic Electricals', hours: 24, price: 1400 },
  { code: 'M4', name: 'Basic Electronics', hours: 20, price: 1190 },
  { code: 'M5', name: 'Digital Techniques', hours: 24, price: 1400 },
  { code: 'M6', name: 'Materials & Hardware', hours: 25, price: 1400 },
  { code: 'M7', name: 'Maintenance Practices (MCQ)', hours: 15, price: 1030 },
  { code: 'M8', name: 'Basic Aerodynamics', hours: 15, price: 1030 },
  { code: 'M9', name: 'Human Factors', hours: 15, price: 1030 },
  { code: 'M10', name: 'Aviation Legislation (MCQ)', hours: 15, price: 1030 },
  { code: 'MP-E', name: 'Maintenance Practices (Essay Only)', hours: 0, price: 340 },
];

const SPECIALIST_MODULES = [
  { code: 'M11', name: 'Turbine Aeroplane Aerodynamics', hours: 25, price: 1400 },
  { code: 'M15', name: 'Turbine Engines', hours: 25, price: 1400 },
  { code: 'M17', name: 'Propellers', hours: 15, price: 1090 },
  { code: 'M12', name: 'Helicopter Aerodynamics', hours: 25, price: 1400 },
  { code: 'M16', name: 'Piston Engine', hours: 25, price: 1400 },
];

const AVIONICS_MODULES = [
  { code: 'M13', name: 'Aircraft Aerodynamics (Avionics)', hours: 25, price: 1400 },
  { code: 'M14', name: 'Propulsion', hours: 15, price: 1090 },
];

const ALL_MODULES = {
  core: CORE_MODULES,
  specialist: SPECIALIST_MODULES,
  avionics: AVIONICS_MODULES
};

export default function PortalCoursesPage() {
  // Mock User Status - In real app, fetch from NextAuth session / DB
  // Statuses: 'enquiry', 'fee_paid', 'applicant', 'approved', 'enrolled'
  const userStatus = 'enrolled'; // CHANGE THIS TO TEST DIFFERENT VIEWS

  const canPurchase = ['approved', 'enrolled'].includes(userStatus);

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Course Catalog</h1>
        <p className="text-slate-600">
          Browse and book your EASA Part-66 training modules.
        </p>
      </div>

      {!canPurchase && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">Purchase Locked</h3>
            <p className="text-sm text-amber-800 mt-1">
              You must complete your application and be approved before you can purchase individual modules.
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="core" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-6">
          <TabsTrigger value="core">Core Modules (M1-M10)</TabsTrigger>
          <TabsTrigger value="specialist">Specialist (Mechanical)</TabsTrigger>
          <TabsTrigger value="avionics">Avionics (B2)</TabsTrigger>
        </TabsList>

        {Object.entries(ALL_MODULES).map(([key, modules]) => (
          <TabsContent key={key} value={key} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <Card key={module.code} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="font-mono text-slate-500">
                        {module.code}
                      </Badge>
                      {module.hours > 0 && (
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {module.hours} Hrs
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg leading-tight mt-2">{module.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="grow">
                    <p className="text-sm text-slate-600 mb-4">
                      Comprehensive tuition support, learning materials, and exam preparation included.
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900">€{module.price.toLocaleString()}</span>
                      <span className="text-sm text-slate-500">/ module</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      disabled={!canPurchase}
                      variant={canPurchase ? "default" : "secondary"}
                    >
                      {canPurchase ? "Select Module" : "Locked"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
