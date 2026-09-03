'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadButton } from '@/lib/uploads/uploadthing'
import { PROGRAMMES } from '@/lib/utils/constants'
import {
  internalExamRegistrationSchema,
  type InternalExamRegistrationInput,
} from '@/lib/validation/schemas'
import { format } from 'date-fns'

interface PreExamFormProps {
  sessionId: string
  examDate: Date | null
  examLocation: string
}

type FormValues = z.infer<typeof internalExamRegistrationSchema>

const ID_DOCUMENT_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID' },
  { value: 'driving_licence', label: 'Driving Licence' },
] as const

export default function PreExamForm({ sessionId, examDate, examLocation }: PreExamFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(internalExamRegistrationSchema),
    defaultValues: {
      sessionId,
      fullName: '',
      dateOfBirth: '',
      nationality: '',
      email: '',
      phone: '',
      licenceCategory: '',
      modules: [],
      examDate: examDate ? format(examDate, 'yyyy-MM-dd') : undefined,
      examLocation,
      candidatePhoto: null,
      idDocumentType: 'passport',
      idDocumentNumber: '',
      consentTruthfulness: false,
      consentMonitoring: false,
      consentIdentity: false,
      consentProcessing: false,
    },
  } as any)

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    try {
      const payload = {
        ...values,
        candidatePhoto: photoUrl,
      }

      const response = await fetch('/api/student/exams/internal/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit registration')
      }

      toast.success('Registration submitted successfully')
      router.push(`/student/exams/internal/${sessionId}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit registration')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-Exam Identity Form</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Full Legal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="As shown on passport / ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality / Country</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Germany" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="candidate@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+49 170 0000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licenceCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Licence Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROGRAMMES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modules"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Module(s)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Comma-separated, e.g. M1, M2, M3"
                        value={field.value?.join(', ') || ''}
                        onChange={(e) => {
                          const modules = e.target.value
                            .split(',')
                            .map((m) => m.trim())
                            .filter(Boolean)
                          field.onChange(modules)
                        }}
                      />
                    </FormControl>
                    <FormDescription>Enter module codes separated by commas.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="examDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Examination Date</FormLabel>
                    <FormControl>
                      <Input type="date" readOnly {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="examLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Examination Location</FormLabel>
                    <FormControl>
                      <Input readOnly {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormItem>
                <FormLabel>Candidate Photo</FormLabel>
                <div className="flex items-center gap-4">
                  {photoUrl && (
                    <img
                      src={photoUrl}
                      alt="Candidate preview"
                      className="h-16 w-16 rounded-full border object-cover"
                    />
                  )}
                  <UploadButton
                    endpoint="candidatePhoto"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]) {
                        const url = res[0].ufsUrl || res[0].url
                        setPhotoUrl(url)
                        form.setValue('candidatePhoto', url)
                        toast.success('Photo uploaded')
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Upload failed: ${error.message}`)
                    }}
                    appearance={{
                      button:
                        'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl',
                      allowedContent: 'text-slate-500 text-xs mt-1',
                    }}
                  />
                </div>
              </FormItem>

              <FormField
                control={form.control}
                name="idDocumentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Document Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ID_DOCUMENT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="idDocumentNumber"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>ID Document Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Document number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-bold text-slate-900">Declarations and Consents</p>

              <FormField
                control={form.control}
                name="consentTruthfulness"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        Declaration of truthfulness
                      </FormLabel>
                      <FormDescription className="text-xs">
                        I declare that the information provided is true and accurate.
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consentMonitoring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">Consent to monitoring</FormLabel>
                      <FormDescription className="text-xs">
                        I consent to being monitored during the examination for integrity purposes.
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consentIdentity"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        Consent to identity capture
                      </FormLabel>
                      <FormDescription className="text-xs">
                        I consent to the capture and processing of my identity data for exam
                        verification.
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consentProcessing"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        Consent to result processing
                      </FormLabel>
                      <FormDescription className="text-xs">
                        I consent to the processing of my exam results and related data.
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="min-w-[160px]">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Submit Registration
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
