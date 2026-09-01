'use client'

import React, { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { EventData, STATUS, Step } from 'react-joyride'
import { markTourAsCompleted } from '@/app/(portal)/_actions/user'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const Joyride = dynamic(() => import('react-joyride').then(m => m.Joyride), { ssr: false })

interface Props {
  hasCompletedTour: boolean
  userRole?: string
}

function getSteps(role?: string): Step[] {
  const commonStart: Step[] = [
    {
      target: 'body',
      content: (
        <div className="space-y-2 text-left">
          <p className="text-lg font-bold text-aerojet-blue">Welcome to Aerojet Academy!</p>
          <p className="text-sm text-slate-600">
            Let&apos;s take a quick tour of your portal to help you find everything you need.
          </p>
        </div>
      ),
      placement: 'center',
      skipBeacon: true,
    },
    {
      target: '#welcome-banner',
      content: 'This banner shows personalized messages and important academy updates. Keep an eye on it for announcements.',
      placement: 'bottom',
    },
    {
      target: '#sidebar-nav',
      content: 'This is your main navigation. All features are organized here — click any item to explore that section.',
      placement: 'right',
    },
    {
      target: '#sidebar-user-menu',
      content: 'Access your profile settings, switch between light and dark themes, or sign out from here.',
      placement: 'right',
    },
  ]

  if (role === 'STUDENT') {
    return [
      ...commonStart,
      {
        target: 'a[href="/student/wallet"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Wallet</p>
            <p className="text-sm text-slate-600">Your financial hub. Top up your balance, view transactions, and pay for courses and exams — all payments go through your wallet.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: 'a[href="/student/courses"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">My Courses</p>
            <p className="text-sm text-slate-600">View your enrolled courses, access study materials, and track your progress. You can also enroll in new modules here.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: 'a[href*="/student/exams"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Exams</p>
            <p className="text-sm text-slate-600">Book exam seats, join pools for shared pricing, view your exam history, and check results. Look for available exam events and bundles here.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: 'a[href="/student/grades"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Grades</p>
            <p className="text-sm text-slate-600">Check your assessment scores and grades for all courses. Track your academic performance across semesters.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: 'a[href="/student/classmates"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Classmates</p>
            <p className="text-sm text-slate-600">Browse your batch-mates and classmates. Filter by academic year, semester, pathway, or specific class to find peers.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: 'a[href="/student/seating"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">My Seating</p>
            <p className="text-sm text-slate-600">View your assigned seats in classrooms and exam halls. See the floor plan and exactly where you&apos;ll sit.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: 'a[href="/student/attendance"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Attendance</p>
            <p className="text-sm text-slate-600">Track your class attendance records. Stay on top of attendance requirements to maintain your enrollment status.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: 'a[href="/student/notifications"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Notifications & Messages</p>
            <p className="text-sm text-slate-600">Stay updated with payment confirmations, exam reminders, and academy announcements. You can also message staff directly.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: 'body',
        content: (
          <div className="space-y-2 text-left">
            <p className="text-lg font-bold text-aerojet-blue">You&apos;re all set!</p>
            <p className="text-sm text-slate-600">
              Explore your portal at your own pace. You can restart this tour anytime from your profile menu. Good luck with your studies!
            </p>
          </div>
        ),
        placement: 'center',
      },
    ]
  }

  if (['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(role || '')) {
    return [
      ...commonStart,
      {
        target: 'a[href="/staff/students"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Student Management</p>
            <p className="text-sm text-slate-600">View all students, manage profiles, approve registrations, and track their academic journey. Use filters to quickly find any student.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: 'a[href="/staff/classes"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Classes</p>
            <p className="text-sm text-slate-600">Create and manage classes, assign instructors, manage rosters, and set up seating arrangements. Each class links to a course and classroom.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: 'a[href="/staff/classrooms"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Facilities</p>
            <p className="text-sm text-slate-600">Manage physical rooms and labs. Design interactive floor plans with the grid builder — mark desks, aisles, and obstacles. Seats are auto-labeled.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: 'a[href="/staff/exams"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Exam Management</p>
            <p className="text-sm text-slate-600">Create exam events, manage pools, generate sittings, and assign seats. Track bookings, results, and attendance all in one place.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: 'a[href="/staff/finance"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Finance</p>
            <p className="text-sm text-slate-600">Approve payments, manage wallets, reconcile transactions, and track revenue. Supports multiple currencies with automatic exchange rates.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: 'a[href*="/staff/settings"]',
        content: (
          <div className="space-y-1 text-left">
            <p className="font-bold">Settings</p>
            <p className="text-sm text-slate-600">Configure academy settings, payment methods, email templates, and academic calendars. The Security tab lets you enable two-factor authentication for your account.</p>
          </div>
        ),
        placement: 'right',
      },
      {
        target: 'body',
        content: (
          <div className="space-y-2 text-left">
            <p className="text-lg font-bold text-aerojet-blue">Ready to go!</p>
            <p className="text-sm text-slate-600">
              You can restart this tour anytime from your profile menu. For a detailed look at any feature, click through and explore.
            </p>
          </div>
        ),
        placement: 'center',
      },
    ]
  }

  // Applicant / default
  return [
    ...commonStart,
    {
      target: 'body',
      content: (
        <div className="space-y-2 text-left">
          <p className="text-lg font-bold text-aerojet-blue">Get Started</p>
          <p className="text-sm text-slate-600">
            Complete your profile, upload required documents, and pay your registration fee to proceed with enrollment. Check the sidebar for each step.
          </p>
        </div>
      ),
      placement: 'center',
    },
  ]
}

export default function AppTour({ hasCompletedTour, userRole }: Props) {
  const { data: session } = useSession()
  const [run, setRun] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const tourStartedRef = useRef(false)

  useEffect(() => {
    setMounted(true)

    const trackTourStart = () => {
      if (tourStartedRef.current) return
      tourStartedRef.current = true
      setRun(true)
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'TOUR_STARTED', data: { tourName: 'app_tour' }, userId: session?.user?.id }),
      }).catch(() => {})
    }

    const handleStartTour = () => {
      trackTourStart()
    }
    window.addEventListener('start-app-tour', handleStartTour)

    if (!hasCompletedTour) {
      const timer = setTimeout(() => {
        trackTourStart()
      }, 1500)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('start-app-tour', handleStartTour)
      }
    }

    return () => window.removeEventListener('start-app-tour', handleStartTour)
  }, [hasCompletedTour, session?.user?.id])

  if (!mounted) return null

  const steps = getSteps(userRole)

  const handleJoyrideCallback = async (data: EventData) => {
    const { status } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      setRun(false)
      await markTourAsCompleted()
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'TOUR_COMPLETED', data: { tourName: 'app_tour' }, userId: session?.user?.id }),
      }).catch(() => {})
      router.refresh()
    }
  }

  return (
    <Joyride
      onEvent={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      steps={steps}
      options={{
        primaryColor: '#0055D4',
        zIndex: 10000,
        backgroundColor: '#ffffff',
        arrowColor: '#ffffff',
        textColor: '#334155',
        showProgress: true,
        buttons: ['back', 'primary', 'skip'],
      }}
      styles={{
        tooltipContainer: {
          textAlign: 'left',
          borderRadius: '16px',
          padding: '10px',
        },
        buttonPrimary: {
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
        buttonBack: {
          fontSize: '12px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginRight: '10px',
          color: '#64748b',
        },
        buttonSkip: {
          fontSize: '12px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#94a3b8',
        },
      }}
      locale={{
        last: 'Finish',
        skip: 'Skip Tour',
      }}
    />
  )
}
