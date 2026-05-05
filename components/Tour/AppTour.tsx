'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { EventData, STATUS, Step } from 'react-joyride'
import { markTourAsCompleted } from '@/app/(portal)/_actions/user'
import { useRouter } from 'next/navigation'

const Joyride = dynamic(() => import('react-joyride').then(m => m.Joyride), { ssr: false })

interface Props {
  hasCompletedTour: boolean
  userRole?: string
}

export default function AppTour({ hasCompletedTour, userRole }: Props) {
  const [run, setRun] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    
    const handleStartTour = () => setRun(true)
    window.addEventListener('start-app-tour', handleStartTour)

    if (!hasCompletedTour) {
      // Delay slightly to ensure layout is ready
      const timer = setTimeout(() => setRun(true), 1500)
      return () => clearTimeout(timer)
    }

    return () => window.removeEventListener('start-app-tour', handleStartTour)
  }, [hasCompletedTour])

  if (!mounted) return null

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="space-y-2 text-left">
          <p className="text-lg font-bold text-aerojet-blue">Welcome to Aerojet Academy!</p>
          <p className="text-sm text-slate-600">Let's take a quick tour of your new portal to help you get started.</p>
        </div>
      ),
      placement: 'center',
      skipBeacon: true,
    },
    {
      target: '#welcome-banner',
      content: 'This banner will show you personalized messages and important academy updates.',
      placement: 'bottom',
    },
    {
      target: '#sidebar-nav',
      content: 'Navigate through your courses, exams, and financial wallet using this sidebar.',
      placement: 'right',
    },
    {
      target: '#sidebar-user-menu',
      content: 'Manage your profile settings, switch themes, or sign out from your account here.',
      placement: 'right',
    },
  ]

  const handleJoyrideCallback = async (data: EventData) => {
    const { status } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      setRun(false)
      await markTourAsCompleted()
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
