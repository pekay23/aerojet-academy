'use client'

import React, { useState } from 'react'
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  ShieldAlert,
  Save,
  Globe,
  BadgeCheck,
  Building2,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { updateInstructorProfile } from '@/lib/actions/instructor'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ProfileData {
  id: string
  email: string
  academyEmail: string | null
  profile: {
    firstName: string
    middleName?: string | null
    lastName: string
    dateOfBirth?: string | null
    gender?: string | null
    nationality?: string | null
    phone?: string | null
    alternatePhone?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    country?: string | null
    postalCode?: string | null
    emergencyContactName?: string | null
    emergencyContactPhone?: string | null
    emergencyContactRelation?: string | null
    profilePhotoUrl?: string | null
  }
  instructorProfile: {
    employeeId: string
    department?: string | null
    specialization?: string | null
    qualifications?: string | null
    hireDate?: string | null
    modulesQualified: string[]
    classesInstructed: any[]
  }
}

export default function InstructorProfileView({ initialData }: { initialData: ProfileData }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState(initialData)

  const handleUpdate = async () => {
    setIsSubmitting(true)
    try {
      const result = await updateInstructorProfile({
        personal: {
          firstName: formData.profile.firstName,
          middleName: formData.profile.middleName ?? null,
          lastName: formData.profile.lastName,
          phone: formData.profile.phone ?? null,
          alternatePhone: formData.profile.alternatePhone ?? null,
          address: formData.profile.address ?? null,
          city: formData.profile.city ?? null,
          state: formData.profile.state ?? null,
          country: formData.profile.country ?? null,
          postalCode: formData.profile.postalCode ?? null,
          gender: formData.profile.gender ?? null,
          dateOfBirth: formData.profile.dateOfBirth ?? null,
          nationality: formData.profile.nationality ?? null,
        },
        emergency: {
          name: formData.profile.emergencyContactName ?? null,
          phone: formData.profile.emergencyContactPhone ?? null,
          relation: formData.profile.emergencyContactRelation ?? null,
        },
      })

      if (result.success) {
        toast.success('Profile updated successfully')
        setIsEditing(false)
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProfileChange = (field: string, value: string | number | boolean | null) => {
    setFormData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }))
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Header Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-aerojet-blue relative overflow-hidden rounded-4xl p-8 text-white shadow-2xl dark:bg-slate-900"
      >
        <div className="absolute top-0 right-0 h-64 w-64 translate-x-12 translate-y-[-12] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 translate-x-[-12] translate-y-12 rounded-full bg-blue-400/5 blur-3xl" />

        <div className="relative flex flex-col items-center gap-8 md:flex-row md:items-start">
          <div className="group relative">
            <div className="h-32 w-32 overflow-hidden rounded-3xl border-4 border-white/20 shadow-xl transition-transform hover:scale-105">
              <UserAvatar
                firstName={formData.profile.firstName}
                lastName={formData.profile.lastName}
                src={formData.profile.profilePhotoUrl}
                className="h-full w-full object-cover text-3xl font-black"
              />
            </div>
          </div>

          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <h1 className="text-3xl font-black tracking-tight">
                  {formData.profile.firstName} {formData.profile.lastName}
                </h1>
                <BadgeCheck className="h-6 w-6 text-blue-400" />
              </div>
              <p className="text-lg font-medium text-blue-200/80">
                {formData.instructorProfile.specialization || 'Academic Instructor'}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 md:justify-start">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur-sm">
                <Briefcase className="h-4 w-4 text-blue-300" />
                <span>ID: {formData.instructorProfile.employeeId}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur-sm">
                <Building2 className="h-4 w-4 text-blue-300" />
                <span>{formData.instructorProfile.department || 'Aviation Faculty'}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-3">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="text-aerojet-blue rounded-2xl bg-white text-sm font-black hover:bg-blue-50"
              >
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData(initialData)
                  }}
                  className="rounded-2xl font-bold text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={isSubmitting}
                  className="rounded-2xl bg-blue-500 text-sm font-black text-white hover:bg-blue-400"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          <TabsTrigger
            value="personal"
            className="rounded-xl font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-white"
          >
            Personal Info
          </TabsTrigger>
          <TabsTrigger
            value="professional"
            className="rounded-xl font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-white"
          >
            Professional
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="personal" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="rounded-4xl border-slate-100 shadow-sm dark:border-slate-800">
                <CardContent className="p-8">
                  <h3 className="text-aerojet-sky mb-6 flex items-center gap-2 text-sm font-black tracking-widest uppercase">
                    <UserIcon className="h-4 w-4" />
                    Basic Information
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 dark:text-slate-300">
                          First Name
                        </Label>
                        <Input
                          disabled={!isEditing}
                          value={formData.profile.firstName}
                          onChange={(e) => handleProfileChange('firstName', e.target.value)}
                          className="rounded-xl border-slate-100 font-bold dark:border-slate-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400">Last Name</Label>
                        <Input
                          disabled={!isEditing}
                          value={formData.profile.lastName}
                          onChange={(e) => handleProfileChange('lastName', e.target.value)}
                          className="rounded-xl border-slate-100 font-bold dark:border-slate-800"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400">Aerojet Email</Label>
                      <div className="relative">
                        <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-300" />
                        <Input
                          disabled
                          value={formData.academyEmail || ''}
                          className="rounded-xl border-slate-100 pl-10 font-bold text-slate-400 dark:border-slate-800"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400">Date of Birth</Label>
                        <div className="relative">
                          <Calendar className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-300" />
                          <Input
                            type="date"
                            disabled={!isEditing}
                            value={
                              formData.profile.dateOfBirth
                                ? format(new Date(formData.profile.dateOfBirth), 'yyyy-MM-dd')
                                : ''
                            }
                            onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                            className="rounded-xl border-slate-100 pl-10 font-bold dark:border-slate-800"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400">Nationality</Label>
                        <div className="relative">
                          <Globe className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-300" />
                          <Input
                            disabled={!isEditing}
                            value={formData.profile.nationality || ''}
                            onChange={(e) => handleProfileChange('nationality', e.target.value)}
                            className="rounded-xl border-slate-100 pl-10 font-bold dark:border-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-4xl border-slate-100 shadow-sm dark:border-slate-800">
                <CardContent className="p-8">
                  <h3 className="text-aerojet-sky mb-6 flex items-center gap-2 text-sm font-black tracking-widest uppercase">
                    <Phone className="h-4 w-4" />
                    Contact & Address
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400">Primary Phone</Label>
                      <Input
                        disabled={!isEditing}
                        value={formData.profile.phone || ''}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        className="rounded-xl border-slate-100 font-bold dark:border-slate-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400">
                        Residential Address
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute top-3 left-3 h-4 w-4 text-slate-300" />
                        <textarea
                          disabled={!isEditing}
                          value={formData.profile.address || ''}
                          onChange={(e) => handleProfileChange('address', e.target.value)}
                          className="w-full rounded-xl border border-slate-100 bg-white p-2 pl-10 text-sm font-bold focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400">City</Label>
                        <Input
                          disabled={!isEditing}
                          value={formData.profile.city || ''}
                          onChange={(e) => handleProfileChange('city', e.target.value)}
                          className="rounded-xl border-slate-100 font-bold dark:border-slate-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400">Postal Code</Label>
                        <Input
                          disabled={!isEditing}
                          value={formData.profile.postalCode || ''}
                          onChange={(e) => handleProfileChange('postalCode', e.target.value)}
                          className="rounded-xl border-slate-100 font-bold dark:border-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-4xl border-slate-100 shadow-sm dark:border-slate-800">
              <CardContent className="p-8">
                <h3 className="mb-6 flex items-center gap-2 text-sm font-black tracking-widest text-red-400 uppercase">
                  <ShieldAlert className="h-4 w-4" />
                  Emergency Contact
                </h3>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-400">Contact Name</Label>
                    <Input
                      disabled={!isEditing}
                      value={formData.profile.emergencyContactName || ''}
                      onChange={(e) => handleProfileChange('emergencyContactName', e.target.value)}
                      className="rounded-xl border-slate-100 font-bold dark:border-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-400">Relationship</Label>
                    <Input
                      disabled={!isEditing}
                      value={formData.profile.emergencyContactRelation || ''}
                      onChange={(e) =>
                        handleProfileChange('emergencyContactRelation', e.target.value)
                      }
                      className="rounded-xl border-slate-100 font-bold dark:border-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-400">Contact Phone</Label>
                    <Input
                      disabled={!isEditing}
                      value={formData.profile.emergencyContactPhone || ''}
                      onChange={(e) => handleProfileChange('emergencyContactPhone', e.target.value)}
                      className="rounded-xl border-slate-100 font-bold dark:border-slate-800"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="professional" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="rounded-4xl border-slate-100 shadow-sm dark:border-slate-800">
                <CardContent className="p-8">
                  <h3 className="text-aerojet-sky mb-6 flex items-center gap-2 text-sm font-black tracking-widest uppercase">
                    <BadgeCheck className="h-4 w-4" />
                    Qualifications
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400">
                        Academic Background
                      </Label>
                      <div className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
                        {formData.instructorProfile.qualifications || 'No qualifications listed.'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400">Specialization</Label>
                      <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                        <GraduationCap className="h-5 w-5 text-blue-500" />
                        {formData.instructorProfile.specialization || 'General Aviation'}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-slate-400">Qualified Modules</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.instructorProfile.modulesQualified.map((m) => (
                          <Badge
                            key={m}
                            className="rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
                          >
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-4xl border-slate-100 shadow-sm dark:border-slate-800">
                <CardContent className="p-8">
                  <h3 className="text-aerojet-sky mb-6 flex items-center gap-2 text-sm font-black tracking-widest uppercase">
                    <Clock className="h-4 w-4" />
                    Employment History
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800">
                        <Calendar className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400">Hire Date</p>
                        <p className="text-base font-black text-slate-900 dark:text-white">
                          {formData.instructorProfile.hireDate
                            ? format(new Date(formData.instructorProfile.hireDate), 'MMMM do, yyyy')
                            : 'Date not set'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-xs font-bold text-slate-400">Recent Assignments</Label>
                      <div className="space-y-3">
                        {formData.instructorProfile.classesInstructed
                          .slice(0, 3)
                          .map((c: { id: string; course: { code: string }; name: string }) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-black text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                                  {c.course.code}
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  {c.name}
                                </span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-slate-300" />
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
