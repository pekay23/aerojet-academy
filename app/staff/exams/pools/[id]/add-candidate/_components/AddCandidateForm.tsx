'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Loader2, Search, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  _FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'


interface AddCandidateFormProps {
  pool: any // Using any to key into complex include if needed. Wait, passing standard type + explicit props is better.
  // Actually, I fetched pool with details, so it has allowedModules.
  // Let's use `ExamPool` type and assume it's augmented or just use `any` temporarily for flexibility with Prisma includes.
}

const addCandidateSchema = z.object({
  userId: z.string().cuid('Please select a student'),
  selectedModule: z.string().min(1, 'Please select a module'),
})

type AddCandidateFormValues = z.infer<typeof addCandidateSchema>

export default function AddCandidateForm({ pool }: AddCandidateFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const form = useForm<AddCandidateFormValues>({
    resolver: zodResolver(addCandidateSchema),
    defaultValues: {
      userId: '',
      selectedModule: '',
    },
  })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        try {
          const res = await fetch(`/api/staff/users/search?q=${encodeURIComponent(searchQuery)}`)
          const data = await res.json()
          if (res.ok) {
            setSearchResults(data)
          }
        } catch (_error) {
          toast.error('Search failed')
        }
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSelectUser = (user: any) => {
    setSelectedUser(user)
    form.setValue('userId', user.id)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleClearUser = () => {
    setSelectedUser(null)
    form.setValue('userId', '')
  }

  async function onSubmit(values: AddCandidateFormValues) {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/staff/exam-pools/${pool.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add candidate')
      }

      toast.success('Candidate added successfully')
      router.push(`/staff/exams/pools/${pool.id}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add candidate')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* User Search / Selection */}
        <div className="space-y-2">
          <FormLabel>Student</FormLabel>

          {selectedUser ? (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-slate-900 font-bold text-aerojet-blue shadow-sm">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {selectedUser.profile?.firstName} {selectedUser.profile?.lastName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.email}</div>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={handleClearUser}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="candidate-search"
                placeholder="Search by name or email..."
                className="pl-10"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150 ease-out hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/60"
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:text-slate-400">
                        {user.profile?.firstName?.charAt(0)}
                        {user.profile?.lastName?.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {user.profile?.firstName} {user.profile?.lastName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <input type="hidden" {...form.register('userId')} />
          {form.formState.errors.userId && (
            <p className="text-sm font-medium text-red-500">
              {form.formState.errors.userId.message}
            </p>
          )}
        </div>

        <FormField
          control={form.control}
          name="selectedModule"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="candidate-module">Module</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger id="candidate-module">
                    <SelectValue placeholder="Select a module" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {pool.allowedModules.map((module: string) => (
                    <SelectItem key={module} value={module}>
                      {module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-aerojet-blue px-8 hover:bg-aerojet-blue/90"
            disabled={isLoading || !selectedUser}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Candidate'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
