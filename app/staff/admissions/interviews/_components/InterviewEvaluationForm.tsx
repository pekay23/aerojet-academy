'use client'
import { formatDate } from '@/lib/utils/formatters'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  X,
  MessageSquare,
  Wrench,
  Target,
  Lightbulb,
  Users,
  Shield,
  Star,
  Send,
  Loader2,
  ChevronDown,
} from 'lucide-react'

type Recommendation = 'STRONG_YES' | 'YES' | 'MAYBE' | 'NO' | 'STRONG_NO'

interface EvaluationFormData {
  communicationScore: number
  technicalScore: number
  motivationScore: number
  problemSolvingScore: number
  teamworkScore: number
  professionalismScore: number
  overallImpression: number
  personalScore: number
  recommendation: Recommendation
  communicationNotes: string
  technicalNotes: string
  motivationNotes: string
  problemSolvingNotes: string
  teamworkNotes: string
  professionalismNotes: string
  generalRemarks: string
}

interface Evaluation {
  id: string
  evaluator: {
    id: string
    email: string
    profile: { firstName: string; lastName: string } | null
  }
  communicationScore: number
  technicalScore: number
  motivationScore: number
  problemSolvingScore: number
  teamworkScore: number
  professionalismScore: number
  overallImpression: number
  personalScore: number
  recommendation: Recommendation
  generalRemarks: string | null
  createdAt: string
}

interface Averages {
  communicationScore: number
  technicalScore: number
  motivationScore: number
  problemSolvingScore: number
  teamworkScore: number
  professionalismScore: number
  overallImpression: number
  personalScore: number
  evaluatorCount: number
  compositeScore: number
}

const RUBRIC_DIMENSIONS = [
  {
    key: 'communicationScore' as const,
    notesKey: 'communicationNotes' as const,
    label: 'Communication',
    icon: MessageSquare,
    description: 'Verbal clarity, confidence, articulation, listening skills',
  },
  {
    key: 'technicalScore' as const,
    notesKey: 'technicalNotes' as const,
    label: 'Technical Aptitude',
    icon: Wrench,
    description: 'Aviation knowledge, technical understanding, learning potential',
  },
  {
    key: 'motivationScore' as const,
    notesKey: 'motivationNotes' as const,
    label: 'Motivation & Drive',
    icon: Target,
    description: 'Career goals, commitment to aviation, enthusiasm',
  },
  {
    key: 'problemSolvingScore' as const,
    notesKey: 'problemSolvingNotes' as const,
    label: 'Problem Solving',
    icon: Lightbulb,
    description: 'Analytical thinking, situational responses, critical reasoning',
  },
  {
    key: 'teamworkScore' as const,
    notesKey: 'teamworkNotes' as const,
    label: 'Teamwork',
    icon: Users,
    description: 'Collaboration ability, interpersonal skills, conflict resolution',
  },
  {
    key: 'professionalismScore' as const,
    notesKey: 'professionalismNotes' as const,
    label: 'Professionalism',
    icon: Shield,
    description: 'Presentation, punctuality, demeanor, maturity',
  },
]

const RECOMMENDATIONS: { value: Recommendation; label: string; color: string }[] = [
  { value: 'STRONG_YES', label: 'Strong Yes', color: 'bg-green-600 hover:bg-green-700' },
  { value: 'YES', label: 'Yes', color: 'bg-green-500 hover:bg-green-600' },
  { value: 'MAYBE', label: 'Maybe', color: 'bg-amber-500 hover:bg-amber-600' },
  { value: 'NO', label: 'No', color: 'bg-red-500 hover:bg-red-600' },
  { value: 'STRONG_NO', label: 'Strong No', color: 'bg-red-700 hover:bg-red-800' },
]

function ScoreSlider({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  const color =
    value >= 8
      ? 'text-green-600'
      : value >= 6
        ? 'text-blue-600'
        : value >= 4
          ? 'text-amber-600'
          : 'text-red-600'
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="accent-aerojet-blue h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 dark:bg-slate-700"
        aria-label={label}
      />
      <span className={`w-8 text-center text-lg font-black ${color}`}>{value}</span>
    </div>
  )
}

export default function InterviewEvaluationForm({
  applicationId,
  candidateName,
  onClose,
}: {
  applicationId: string
  candidateName: string
  onClose: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingEvals, setExistingEvals] = useState<Evaluation[]>([])
  const [averages, setAverages] = useState<Averages | null>(null)
  const [showOtherEvals, setShowOtherEvals] = useState(false)

  const [form, setForm] = useState<EvaluationFormData>({
    communicationScore: 5,
    technicalScore: 5,
    motivationScore: 5,
    problemSolvingScore: 5,
    teamworkScore: 5,
    professionalismScore: 5,
    overallImpression: 5,
    personalScore: 50,
    recommendation: 'MAYBE',
    communicationNotes: '',
    technicalNotes: '',
    motivationNotes: '',
    problemSolvingNotes: '',
    teamworkNotes: '',
    professionalismNotes: '',
    generalRemarks: '',
  })

  useEffect(() => {
    fetch(`/api/staff/admissions/interviews/${applicationId}/evaluations`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setExistingEvals(data.data.evaluations || [])
          setAverages(data.data.averages)
        }
      })
      .finally(() => setLoading(false))
  }, [applicationId])

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/staff/admissions/interviews/${applicationId}/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Interview evaluation submitted')
        router.refresh()
        onClose()
      } else {
        toast.error(data.error || 'Failed to submit evaluation')
      }
    } catch {
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  // Calculate running composite from form inputs
  const dimensionAvg =
    (form.communicationScore +
      form.technicalScore +
      form.motivationScore +
      form.problemSolvingScore +
      form.teamworkScore +
      form.professionalismScore +
      form.overallImpression) /
    7
  const formComposite = Math.round(dimensionAvg * 10 * 10) / 10

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Interview Evaluation
            </h2>
            <p className="text-sm text-slate-500">Candidate: {candidateName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="text-aerojet-blue h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
            {/* Existing evaluations summary */}
            {existingEvals.length > 0 && averages && (
              <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-900/10">
                <button
                  onClick={() => setShowOtherEvals(!showOtherEvals)}
                  className="flex w-full items-center justify-between"
                >
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                    {averages.evaluatorCount} evaluation{averages.evaluatorCount > 1 ? 's' : ''}{' '}
                    submitted — Avg Score: {averages.personalScore}/100 — Composite:{' '}
                    {averages.compositeScore}/100
                  </p>
                  <ChevronDown
                    className={`h-4 w-4 text-blue-600 transition-transform ${showOtherEvals ? 'rotate-180' : ''}`}
                  />
                </button>
                {showOtherEvals && (
                  <div className="mt-3 space-y-2">
                    {existingEvals.map((ev) => {
                      const name = ev.evaluator.profile
                        ? `${ev.evaluator.profile.firstName} ${ev.evaluator.profile.lastName}`
                        : ev.evaluator.email
                      return (
                        <div
                          key={ev.id}
                          className="rounded-lg border border-blue-100 bg-white p-3 text-sm dark:border-blue-800 dark:bg-slate-800"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                              {name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatDate(ev.createdAt)}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs">
                            <span>
                              Score: <b>{ev.personalScore}/100</b>
                            </span>
                            <span>
                              Rec: <b>{ev.recommendation.replace('_', ' ')}</b>
                            </span>
                            <span>Comm: {ev.communicationScore}</span>
                            <span>Tech: {ev.technicalScore}</span>
                            <span>Motiv: {ev.motivationScore}</span>
                            <span>Problem: {ev.problemSolvingScore}</span>
                            <span>Team: {ev.teamworkScore}</span>
                            <span>Prof: {ev.professionalismScore}</span>
                          </div>
                          {ev.generalRemarks && (
                            <p className="mt-1 text-xs text-slate-500 italic">
                              &ldquo;{ev.generalRemarks}&rdquo;
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Rubric Dimensions */}
            <div className="space-y-5">
              {RUBRIC_DIMENSIONS.map((dim) => {
                const Icon = dim.icon
                return (
                  <div
                    key={dim.key}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className="text-aerojet-blue dark:text-aerojet-sky h-4 w-4" />
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {dim.label}
                      </span>
                      <span className="text-xs text-slate-400">— {dim.description}</span>
                    </div>
                    <ScoreSlider
                      value={form[dim.key]}
                      onChange={(v) => setForm((prev) => ({ ...prev, [dim.key]: v }))}
                      label={dim.label}
                    />
                    <textarea
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                      rows={2}
                      placeholder={`Remarks on ${dim.label.toLowerCase()}...`}
                      value={form[dim.notesKey]}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, [dim.notesKey]: e.target.value }))
                      }
                    />
                  </div>
                )
              })}
            </div>

            {/* Overall Impression */}
            <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800/50 dark:bg-indigo-900/10">
              <div className="mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                  Overall Impression
                </span>
              </div>
              <ScoreSlider
                value={form.overallImpression}
                onChange={(v) => setForm((prev) => ({ ...prev, overallImpression: v }))}
                label="Overall Impression"
              />
            </div>

            {/* Personal Score */}
            <div className="mt-5 rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-800/50 dark:bg-purple-900/10">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-bold text-purple-900 dark:text-purple-200">
                    Personal Score (0–100)
                  </span>
                </div>
                <span className="text-2xl font-black text-purple-700 dark:text-purple-300">
                  {form.personalScore}
                </span>
              </div>
              <p className="mb-2 text-xs text-purple-600 dark:text-purple-400">
                Your overall assessment of this candidate, considering all factors. This score is
                averaged with other evaluators for the final shortlisting decision.
              </p>
              <input
                type="range"
                min={0}
                max={100}
                value={form.personalScore}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, personalScore: parseInt(e.target.value) }))
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-purple-200 accent-purple-600 dark:bg-purple-800"
              />
              <div className="mt-1 flex justify-between text-xs text-purple-500">
                <span>Not suitable</span>
                <span>Average</span>
                <span>Exceptional</span>
              </div>
            </div>

            {/* Running composite */}
            <div className="mt-3 text-center text-sm text-slate-500">
              Dimension composite:{' '}
              <b className="text-slate-700 dark:text-slate-200">{formComposite}/100</b>
            </div>

            {/* Recommendation */}
            <div className="mt-5">
              <p className="mb-2 text-sm font-bold text-slate-900 dark:text-white">
                Recommendation
              </p>
              <div className="flex flex-wrap gap-2">
                {RECOMMENDATIONS.map((rec) => (
                  <button
                    key={rec.value}
                    onClick={() => setForm((prev) => ({ ...prev, recommendation: rec.value }))}
                    className={`rounded-lg px-4 py-2 text-sm font-bold text-white transition-all ${
                      form.recommendation === rec.value
                        ? `${rec.color} ring-2 ring-slate-400 ring-offset-2`
                        : 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-600'
                    }`}
                  >
                    {rec.label}
                  </button>
                ))}
              </div>
            </div>

            {/* General Remarks */}
            <div className="mt-5">
              <label className="mb-1 block text-sm font-bold text-slate-900 dark:text-white">
                General Remarks
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                rows={3}
                placeholder="Overall observations, concerns, strengths, or anything noteworthy about this candidate..."
                value={form.generalRemarks}
                onChange={(e) => setForm((prev) => ({ ...prev, generalRemarks: e.target.value }))}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || loading}
            className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit Evaluation
          </button>
        </div>
      </div>
    </div>
  )
}
