'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Package, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useCurrencyRates } from '@/components/shared/CurrencyDisplay'
const PackagesTab = dynamic(() => import('./_components/PackagesTab'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[200px] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  ),
})
const PoolsTab = dynamic(() => import('./_components/PoolsTab'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[200px] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  ),
})
import {
  ExamComponent,
  ExamPool,
  WalletInfo,
  PoolMembership,
  ExamBooking,
  WalletTransaction,
  WalletPayment,
  ExamBundle,
  TabType,
  ExamOnlyPrices,
  GroupedCourse,
} from './_components/examOnlyTypes'

const IndividualBookingModal = dynamic(() => import('./_components/IndividualBookingModal'), {
  ssr: false,
})
const BundleSelectionModal = dynamic(() => import('./_components/BundleSelectionModal'), {
  ssr: false,
})
import type { ConfirmationBooking } from './_components/ConfirmationModal'

const ConfirmationModal = dynamic(
  () => import('./_components/ConfirmationModal').then((m) => ({ default: m.default })),
  { ssr: false }
)

type TabTypeAlias = TabType

const DEFAULT_PRICES: ExamOnlyPrices = {
  pool: 300,
  individual: 520,
  twoSeat: 980,
  fourSeat: 1900,
}

export default function ExamOnlyPathwayPage() {
  const { update } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabTypeAlias>('packages')
  const [showIndividualModal, setShowIndividualModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [examComponents, setExamComponents] = useState<ExamComponent[]>([])
  const [pools, setPools] = useState<ExamPool[]>([])
  const [_memberships, setMemberships] = useState<PoolMembership[]>([])
  const [_bookings, setBookings] = useState<ExamBooking[]>([])
  const [topUpAmount, _setTopUpAmount] = useState<number>(DEFAULT_PRICES.pool)
  const [_processingPayment, setProcessingPayment] = useState(false)
  const [joiningPool, setJoiningPool] = useState<string | null>(null)
  const [joiningWaitlist, setJoiningWaitlist] = useState<string | null>(null)
  const [bookingExam, setBookingExam] = useState<string | null>(null)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const [selectedModules, setSelectedModules] = useState<Record<string, string>>({})
  const [_walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([])
  const [_walletPayments, setWalletPayments] = useState<WalletPayment[]>([])
  const [bundles, setBundles] = useState<ExamBundle[]>([])
  const [purchasingBundle, setPurchasingBundle] = useState<string | null>(null)
  const [selectedBundleType, setSelectedBundleType] = useState<'TWO_SEAT' | 'FOUR_SEAT' | null>(
    null
  )
  const [bundleSelectedModules, setBundleSelectedModules] = useState<string[]>([])
  const [confirmingBooking, setConfirmingBooking] = useState<ConfirmationBooking | null>(null)
  const [prices, setPrices] = useState<ExamOnlyPrices>(DEFAULT_PRICES)
  const [displayCurrency, _setDisplayCurrency] = useState('EUR')
  const { convert, loading: _ratesLoading } = useCurrencyRates()

  const fmt = (eurAmount: number) => {
    if (displayCurrency === 'EUR') return `€${eurAmount.toFixed(2)}`
    const converted = convert(eurAmount, 'EUR', displayCurrency)
    const sym = displayCurrency === 'GHS' ? 'GH₵' : '$'
    return `${sym}${converted.toFixed(2)}`
  }

  const fetchData = useCallback(async () => {
    try {
      const [
        walletRes,
        componentsRes,
        poolsRes,
        membershipsRes,
        bookingsRes,
        txRes,
        bundlesRes,
        pricingRes,
      ] = await Promise.all([
        fetch('/api/applicant/exam-only/wallet')
          .then((r) => r.json())
          .catch(() => null),
        fetch('/api/applicant/exam-only/exam-components')
          .then((r) => r.json())
          .catch(() => []),
        fetch('/api/applicant/exam-only/pools')
          .then((r) => r.json())
          .catch(() => []),
        fetch('/api/applicant/exam-only/memberships')
          .then((r) => r.json())
          .catch(() => []),
        fetch('/api/applicant/exam-only/bookings')
          .then((r) => r.json())
          .catch(() => []),
        fetch('/api/applicant/exam-only/wallet/transactions')
          .then((r) => r.json())
          .catch(() => ({ transactions: [], payments: [] })),
        fetch('/api/applicant/exam-only/bundles')
          .then((r) => r.json())
          .then((res) => res?.bundles || [])
          .catch(() => []),
        fetch('/api/applicant/exam-only/pricing')
          .then((r) => r.json())
          .catch(() => null),
      ])

      setWallet(walletRes)
      setExamComponents(componentsRes)
      setPools(poolsRes)
      setMemberships(membershipsRes)
      setBookings(bookingsRes)
      setWalletTransactions(txRes.transactions || [])
      setWalletPayments(txRes.payments || [])
      setBundles(bundlesRes)

      if (pricingRes) {
        setPrices({
          pool: pricingRes?.pool?.standardPrice ?? DEFAULT_PRICES.pool,
          individual: pricingRes?.individual?.price ?? DEFAULT_PRICES.individual,
          twoSeat: pricingRes?.bundles?.twoSeat?.price ?? DEFAULT_PRICES.twoSeat,
          fourSeat: pricingRes?.bundles?.fourSeat?.price ?? DEFAULT_PRICES.fourSeat,
        })
      }
    } catch (_error) {
      toast.error('Failed to load exam data. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const _handleTopUp = async () => {
    if (!wallet || wallet.availableBalance === 0) {
      const lowestPrice = getLowestExamPrice()
      if (topUpAmount < lowestPrice) {
        toast.error(`Minimum top-up must be at least €${lowestPrice} (lowest exam fee)`)
        return
      }
    }

    setProcessingPayment(true)
    try {
      const res = await fetch('/api/applicant/exam-only/top-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: topUpAmount }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to process top-up')
        return
      }

      toast.success('Wallet top-up initiated. Upload your payment proof to complete.')
      router.push('/applicant/upload-proof?code=' + data.registrationCode)
    } catch (_error) {
      toast.error('Network error during top-up')
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleJoinPool = async (poolId: string, moduleCode: string) => {
    if (!wallet) return

    const pool = pools.find((p) => p.id === poolId)
    if (!pool) return

    const requiredAmount = Number(pool.seatPrice)
    if (wallet.availableBalance < requiredAmount) {
      toast.error(
        `Insufficient funds. You need €${requiredAmount} but have €${wallet.availableBalance.toFixed(2)} available.`,
        {
          action: {
            label: 'Top Up',
            onClick: () => router.push(`/applicant/exam-only/top-up?required=${requiredAmount}`),
          },
        }
      )
      return
    }

    setJoiningPool(poolId)
    try {
      const res = await fetch('/api/applicant/exam-only/join-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolId, moduleCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'INSUFFICIENT_BALANCE') {
          toast.error(
            `Insufficient funds. You need €${requiredAmount} but have €${wallet.availableBalance.toFixed(2)} available.`,
            {
              action: {
                label: 'Top Up',
                onClick: () =>
                  router.push(`/applicant/exam-only/top-up?required=${requiredAmount}`),
              },
            }
          )
          return
        }
        toast.error(data.error || 'Failed to join booking')
        return
      }

      if (data.promotedToStudent) {
        toast.success('Enrolled successfully! Updating your account...')
        await update() // Refresh NextAuth session

        setTimeout(() => {
          toast.success('Redirecting to Student Portal...')
          router.push('/student')
        }, 1500)
        return
      }

      toast.success('Successfully joined booking! Funds have been reserved.')
      fetchData()
    } catch (_error) {
      toast.error('Network error while joining booking')
    } finally {
      setJoiningPool(null)
    }
  }

  const handleJoinWaitlist = async (poolId: string, moduleCode: string) => {
    setJoiningWaitlist(poolId)
    try {
      const res = await fetch('/api/applicant/exam-only/join-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolId, moduleCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to join waitlist')
        return
      }

      toast.success('Added to waitlist! You will be auto-promoted if a seat opens.')
      fetchData()
    } catch (_error) {
      toast.error('Network error while joining waitlist')
    } finally {
      setJoiningWaitlist(null)
    }
  }

  const handleBookExamClick = (componentId: string, bookingType: 'POOL' | 'INDIVIDUAL') => {
    const component = examComponents.find((c) => c.id === componentId)
    if (!component) return

    const requiredAmount = bookingType === 'POOL' ? prices.pool : prices.individual

    if (!wallet || Number(wallet.availableBalance) < requiredAmount) {
      toast.error(
        `Insufficient funds. You need €${requiredAmount} but have €${Number(wallet?.availableBalance || 0).toFixed(2)} available.`,
        {
          action: {
            label: 'Top Up',
            onClick: () => router.push(`/applicant/exam-only/top-up?required=${requiredAmount}`),
          },
        }
      )
      return
    }

    setConfirmingBooking({
      componentId,
      type: bookingType,
      price: requiredAmount,
      moduleName: `${component.course.code} - ${component.name}`,
    })
  }

  const submitBooking = async () => {
    if (!confirmingBooking || !wallet) return
    const { componentId, type, price } = confirmingBooking

    setBookingExam(componentId)
    setConfirmingBooking(null)
    try {
      const res = await fetch('/api/applicant/exam-only/book-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examComponentId: componentId, bookingType: type }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'INSUFFICIENT_BALANCE') {
          toast.error(
            `Insufficient funds. You need €${data.required || price} but have €${Number(data.available || 0).toFixed(2)} available.`,
            {
              action: {
                label: 'Top Up',
                onClick: () =>
                  router.push(`/applicant/exam-only/top-up?required=${data.required || price}`),
              },
            }
          )
          return
        }
        toast.error(data.error || 'Failed to book exam')
        return
      }

      if (data.promotedToStudent) {
        toast.success('Enrolled successfully! Updating your account...')
        await update() // Refresh NextAuth session

        setTimeout(() => {
          toast.success('Redirecting to Student Portal...')
          router.push('/student')
        }, 1500)
        return
      }

      if (type === 'POOL' && data.pool) {
        toast.success(
          `Joined ${data.pool.name}! (€${prices.pool}) - ${data.pool.memberCount}/${data.pool.maxCandidates || 28} candidates`
        )
      } else {
        toast.success(`Individual exam booked successfully! (€${prices.individual})`)
      }
      fetchData()
    } catch (_error) {
      toast.error('Network error while booking exam')
    } finally {
      setBookingExam(null)
    }
  }

  const handleBuyBundle = async (bundleType: 'TWO_SEAT' | 'FOUR_SEAT', componentIds: string[]) => {
    if (!wallet) return

    const requiredAmount = bundleType === 'TWO_SEAT' ? prices.twoSeat : prices.fourSeat
    const requiredSeats = bundleType === 'TWO_SEAT' ? 2 : 4

    if (componentIds.length !== requiredSeats) {
      toast.error(`Please select exactly ${requiredSeats} modules for this package.`)
      return
    }

    if (wallet.availableBalance < requiredAmount) {
      toast.error(
        `Insufficient funds. You need €${requiredAmount} but have €${wallet.availableBalance.toFixed(2)} available.`,
        {
          action: {
            label: 'Top Up',
            onClick: () => router.push(`/applicant/exam-only/top-up?required=${requiredAmount}`),
          },
        }
      )
      return
    }

    setPurchasingBundle(bundleType)
    setSelectedBundleType(null)
    setBundleSelectedModules([])

    try {
      const res = await fetch('/api/applicant/exam-only/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleType, examComponentIds: componentIds }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to purchase Exam Package')
        return
      }

      if (data.promotedToStudent) {
        toast.success(`Exam Package purchased successfully! Updating your account...`)
        await update() // Refresh NextAuth session

        setTimeout(() => {
          toast.success('Redirecting to Student Portal...')
          router.push('/student')
        }, 1500)
        return
      }

      toast.success(`${bundleType === 'TWO_SEAT' ? 'Twin Pack' : '4-Pack'} purchased successfully!`)
      fetchData()
    } catch (_error) {
      toast.error('Network error while purchasing package')
    } finally {
      setPurchasingBundle(null)
    }
  }

  const getLowestExamPrice = (): number => {
    return Math.min(prices.pool, prices.individual)
  }

  const groupedComponents = examComponents.reduce(
    (acc, component) => {
      const courseCode = component.course.code
      if (!acc[courseCode]) {
        acc[courseCode] = {
          code: courseCode,
          name: component.course.name,
          components: [],
        }
      }
      acc[courseCode].components.push(component)
      return acc
    },
    {} as Record<string, GroupedCourse>
  )

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-700">
      {/* Header */}
      <div>
        <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
          Exam Only Pathway
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Book individual exams or join exam bookings using your wallet
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'packages', label: 'Exam Packages', icon: Package },
          { id: 'pools', label: 'Exam Bookings', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabTypeAlias)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-aerojet-sky text-aerojet-sky'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <PackagesTab
          bundles={bundles}
          purchasingBundle={purchasingBundle}
          onSelectIndividual={() => setShowIndividualModal(true)}
          onSelectPool={() => setActiveTab('pools')}
          onSelectBundle={(type) => setSelectedBundleType(type)}
          fmt={fmt}
          prices={prices}
        />
      )}

      {/* Pools Tab */}
      {activeTab === 'pools' && (
        <PoolsTab
          pools={pools}
          selectedModules={selectedModules}
          onSelectedModulesChange={setSelectedModules}
          wallet={wallet}
          joiningPool={joiningPool}
          joiningWaitlist={joiningWaitlist}
          onJoinPool={handleJoinPool}
          onJoinWaitlist={handleJoinWaitlist}
          fmt={fmt}
          poolPrice={prices.pool}
        />
      )}

      {/* Individual Module Selection Modal */}
      <IndividualBookingModal
        open={showIndividualModal}
        onClose={() => setShowIndividualModal(false)}
        groupedComponents={groupedComponents}
        expandedCourse={expandedCourse}
        setExpandedCourse={setExpandedCourse}
        wallet={wallet}
        bookingExam={bookingExam}
        onBook={(id) => handleBookExamClick(id, 'INDIVIDUAL')}
        fmt={fmt}
        individualPrice={prices.individual}
      />

      {/* Module Selection Modal for Bundles (grouped by course) */}
      <BundleSelectionModal
        bundleType={selectedBundleType}
        onCancel={() => {
          setSelectedBundleType(null)
          setBundleSelectedModules([])
          setExpandedCourse(null)
        }}
        selectedModules={bundleSelectedModules}
        setSelectedModules={setBundleSelectedModules}
        expandedCourse={expandedCourse}
        setExpandedCourse={setExpandedCourse}
        groupedComponents={groupedComponents}
        onConfirm={handleBuyBundle}
        fmt={fmt}
        twoSeatPrice={prices.twoSeat}
        fourSeatPrice={prices.fourSeat}
        purchasingBundle={purchasingBundle}
      />

      {/* Confirmation Modal for Individual / Pool Bookings */}
      <ConfirmationModal
        booking={confirmingBooking}
        onCancel={() => setConfirmingBooking(null)}
        onConfirm={submitBooking}
      />
    </div>
  )
}
