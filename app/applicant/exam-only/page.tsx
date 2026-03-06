'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Wallet,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Loader2,
  RefreshCw,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import TransactionHistory from './_components/TransactionHistory'

interface ExamComponent {
  id: string
  code: string
  name: string
  type: string
  duration: number
  individualPrice: number
  poolPrice: number
  course: {
    code: string
    name: string
  }
}

interface ExamPool {
  id: string
  name: string
  examDate: string
  examStartTime: string
  examEndTime: string
  status: string
  currentMemberCount: number
  maxCandidates: number
  seatPrice: number
  allowedModules: string[]
  event: {
    name: string
  }
  modules: string[]
}

interface WalletInfo {
  balance: number
  reservedBalance: number
  availableBalance: number
}

interface PoolMembership {
  id: string
  status: string
  amountReserved: number
  pool: {
    name: string
    examDate: string
  }
  examComponent?: {
    course: {
      code: string
    }
  }
}

interface ExamBooking {
  id: string
  status: string
  amountPaid: number
  examDate: string
  examComponent?: {
    course: {
      code: string
      name: string
    }
  }
}

interface WalletTransaction {
  id: string
  amount: number
  type: string
  status: string
  createdAt: string
  referenceType?: string
  referenceId?: string
  description?: string
}

interface WalletPayment {
  id: string
  amount: number
  status: string
  paymentMethod?: string
  createdAt: string
  rejectionReason?: string
}

interface ExamBundle {
  id: string
  bundleType: string
  totalSeats: number
  usedSeats: number
  amountPaid: number
  validUntil: string
  status: string
}

type TabType = 'dashboard' | 'packages' | 'pools'

const poolStatusLabel: Record<string, string> = {
  DRAFT: 'Upcoming',
  OPEN: 'Open',
  NEAR_FULL: 'Nearly Full',
  CONFIRMED: 'Confirmed',
  LOCKED: 'In Progress',
  FAILED: 'Cancelled',
}

const poolStatusColor: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  OPEN: 'bg-green-100 text-green-700',
  NEAR_FULL: 'bg-orange-100 text-orange-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  LOCKED: 'bg-purple-100 text-purple-700',
  FAILED: 'bg-red-100 text-red-700',
}

export default function ExamOnlyPathwayPage() {
  const { update } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [examComponents, setExamComponents] = useState<ExamComponent[]>([])
  const [pools, setPools] = useState<ExamPool[]>([])
  const [memberships, setMemberships] = useState<PoolMembership[]>([])
  const [bookings, setBookings] = useState<ExamBooking[]>([])
  const [topUpAmount, setTopUpAmount] = useState<number>(300)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [joiningPool, setJoiningPool] = useState<string | null>(null)
  const [joiningWaitlist, setJoiningWaitlist] = useState<string | null>(null)
  const [bookingExam, setBookingExam] = useState<string | null>(null)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const [selectedModules, setSelectedModules] = useState<Record<string, string>>({})
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([])
  const [walletPayments, setWalletPayments] = useState<WalletPayment[]>([])
  const [bundles, setBundles] = useState<ExamBundle[]>([])
  const [purchasingBundle, setPurchasingBundle] = useState<string | null>(null)
  const [selectedBundleType, setSelectedBundleType] = useState<'TWO_SEAT' | 'FOUR_SEAT' | null>(
    null
  )
  const [bundleSelectedModules, setBundleSelectedModules] = useState<string[]>([])
  const [confirmingBooking, setConfirmingBooking] = useState<{
    componentId: string
    type: 'POOL' | 'INDIVIDUAL'
    price: number
    moduleName: string
  } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [walletRes, componentsRes, poolsRes, membershipsRes, bookingsRes, txRes, bundlesRes] =
        await Promise.all([
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
            .then((res) => res.bundles || [])
            .catch(() => []),
        ])

      setWallet(walletRes)
      setExamComponents(componentsRes)
      setPools(poolsRes)
      setMemberships(membershipsRes)
      setBookings(bookingsRes)
      setWalletTransactions(txRes.transactions || [])
      setWalletPayments(txRes.payments || [])
      setBundles(bundlesRes)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTopUp = async () => {
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
    } catch (error) {
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
        toast.error(data.error || 'Failed to join pool')
        return
      }

      if (data.promotedToStudent) {
        toast.success('Enrolled successfully! Updating your account...')
        await update() // Refresh NextAuth session

        setTimeout(() => {
          toast.success('Redirecting to Student Portal...')
          window.location.href = '/student'
        }, 1500)
        return
      }

      toast.success('Successfully joined pool! Funds have been reserved.')
      fetchData()
    } catch (error) {
      toast.error('Network error while joining pool')
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
    } catch (error) {
      toast.error('Network error while joining waitlist')
    } finally {
      setJoiningWaitlist(null)
    }
  }

  const handleBookExamClick = (componentId: string, bookingType: 'POOL' | 'INDIVIDUAL') => {
    const component = examComponents.find((c) => c.id === componentId)
    if (!component) return

    const requiredAmount = bookingType === 'POOL' ? 300 : 520

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
          window.location.href = '/student'
        }, 1500)
        return
      }

      if (type === 'POOL' && data.pool) {
        toast.success(`Joined ${data.pool.name}! (€300) - ${data.pool.memberCount}/28 candidates`)
      } else {
        toast.success(`Individual exam booked successfully! (€520)`)
      }
      fetchData()
    } catch (error) {
      toast.error('Network error while booking exam')
    } finally {
      setBookingExam(null)
    }
  }

  const handleBuyBundle = async (bundleType: 'TWO_SEAT' | 'FOUR_SEAT', componentIds: string[]) => {
    if (!wallet) return

    const requiredAmount = bundleType === 'TWO_SEAT' ? 980 : 1900
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
          window.location.href = '/student'
        }, 1500)
        return
      }

      toast.success(`${bundleType === 'TWO_SEAT' ? 'Twin Pack' : '4-Pack'} purchased successfully!`)
      fetchData()
    } catch (error) {
      toast.error('Network error while purchasing package')
    } finally {
      setPurchasingBundle(null)
    }
  }

  const getLowestExamPrice = (): number => {
    return 300
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
    {} as Record<string, { code: string; name: string; components: ExamComponent[] }>
  )

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          Exam Only Pathway
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Book individual exams or join exam pools using your wallet
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'packages', label: 'Exam Packages', icon: Package },
          { id: 'pools', label: 'Exam Pools', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-[#4c9ded] text-[#4c9ded]'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Wallet Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Wallet Balance</h3>
              <Wallet className="h-5 w-5 text-slate-400" />
            </div>

            {wallet ? (
              <div className="space-y-4">
                <div className="text-3xl font-black text-[#4c9ded]">
                  €{Number(wallet.balance).toFixed(2)}
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Available: </span>
                    <span className="font-semibold text-green-600">
                      €{Number(wallet.availableBalance).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Reserved: </span>
                    <span className="font-semibold text-orange-600">
                      €{Number(wallet.reservedBalance).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Top Up Section */}
                <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Top up your wallet (min €{getLowestExamPrice()})
                  </p>
                  <div className="flex gap-2">
                    {[300, 500, 1000, 2000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setTopUpAmount(amount)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          topUpAmount === amount
                            ? 'bg-[#4c9ded] text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        €{amount}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleTopUp}
                    disabled={processingPayment}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#002a5c] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#003875] disabled:opacity-50"
                  >
                    {processingPayment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    Top Up €{topUpAmount}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500">
                <p>No wallet found. Please contact support.</p>
              </div>
            )}
          </div>

          {/* My Bookings Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">My Exam Bookings</h3>
              <Clock className="h-5 w-5 text-slate-400" />
            </div>

            {/* Pool Memberships */}
            {memberships.length > 0 && (
              <div className="mb-4">
                <h4 className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Pool Reservations
                </h4>
                <div className="space-y-2">
                  {memberships.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {m.pool.name}
                          {m.examComponent && (
                            <span className="ml-2 text-sm text-slate-500">
                              - {m.examComponent.course.code}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(m.pool.examDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          m.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-700'
                            : m.status === 'RESERVED'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Bookings */}
            {bookings.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  Individual Exams
                </h4>
                <div className="space-y-2">
                  {bookings.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {b.examComponent?.course.code} - {b.examComponent?.course.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {b.examDate ? new Date(b.examDate).toLocaleDateString() : 'Date TBD'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          b.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : b.status === 'APPROVED'
                              ? 'bg-blue-100 text-blue-700'
                              : b.status === 'PENDING'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {memberships.length === 0 && bookings.length === 0 && (
              <div className="text-center text-slate-500">
                <BookOpen className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p>No exam bookings yet</p>
                <p className="text-xs">Browse courses or pools to book your exams</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">Quick Actions</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setActiveTab('packages')}
                className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition-all hover:border-[#4c9ded] hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-blue-900/20"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    Book Individual Exam
                  </p>
                  <p className="text-sm text-slate-500">Browse available exam components</p>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveTab('pools')}
                className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition-all hover:border-[#4c9ded] hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-blue-900/20"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 dark:text-slate-100">Join Exam Pool</p>
                  <p className="text-sm text-slate-500">Join a pool for discounted rates</p>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-2">
            <TransactionHistory transactions={walletTransactions} payments={walletPayments} />
          </div>
        </div>
      )}
      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Individual Seat Option */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Individual Seat
                </h3>
                <p className="mb-4 text-sm text-slate-500">
                  Book a single, guaranteed individual exam seat at your preferred time.
                </p>
                <div className="mb-6 text-3xl font-black text-slate-900 dark:text-white">€520</div>
              </div>
              <button
                onClick={() =>
                  document
                    .getElementById('individual-exams')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Select Module Below
              </button>
            </div>

            {/* Pool Seat Option */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Exam Pool Seat
                </h3>
                <p className="mb-4 text-sm text-slate-500">
                  Join an existing exam pool to save money on your exam seating. Best for flexible
                  schedules.
                </p>
                <div className="mb-6 text-3xl font-black text-[#4c9ded]">€300</div>
              </div>
              <button
                onClick={() => setActiveTab('pools')}
                className="w-full rounded-xl border border-[#4c9ded] bg-[#4c9ded]/10 py-3 text-sm font-bold text-[#4c9ded] transition-all hover:bg-[#4c9ded]/20"
              >
                Join an Exam Pool
              </button>
            </div>

            {/* Twin Pack Option */}
            <div className="flex flex-col justify-between rounded-2xl border-2 border-indigo-500 bg-white p-6 shadow-lg shadow-indigo-100 dark:border-indigo-600 dark:bg-slate-900 dark:shadow-none">
              <div className="relative">
                <span className="absolute -top-2 -right-2 rounded-full bg-indigo-500 px-3 py-1 text-xs font-bold text-white">
                  Save €60
                </span>
                <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Twin Pack
                </h3>
                <p className="mb-4 text-sm text-slate-500">
                  Buy 2 individual exam seats upfront. Guaranteed seating whenever you are ready.
                  Valid for 12 months.
                </p>
                <div className="mb-1 text-3xl font-black text-indigo-600 dark:text-indigo-400">
                  €980
                </div>
                <div className="mb-6 text-xs text-slate-400 line-through">€1040 (2x €520)</div>
              </div>
              <button
                onClick={() => setSelectedBundleType('TWO_SEAT')}
                disabled={purchasingBundle !== null}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
              >
                {purchasingBundle === 'TWO_SEAT' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Package className="h-4 w-4" />
                )}
                Select Twin Pack Modules
              </button>
            </div>

            {/* 4-Pack Option */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white bg-linear-to-br from-white to-amber-50 p-6 dark:border-slate-800 dark:bg-slate-900 dark:from-slate-900 dark:to-slate-800">
              <div className="relative">
                <span className="absolute -top-2 -right-2 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
                  Save €180 + 1 Free Change
                </span>
                <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  4-Pack
                </h3>
                <p className="mb-4 text-sm text-slate-500">
                  The ultimate individual seating package. Secure 4 guaranteed seats + 1 free module
                  change. Valid for 12 months.
                </p>
                <div className="mb-1 text-3xl font-black text-amber-600">€1900</div>
                <div className="mb-6 text-xs text-slate-400 line-through">€2080 (4x €520)</div>
              </div>
              <button
                onClick={() => setSelectedBundleType('FOUR_SEAT')}
                disabled={purchasingBundle !== null}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white transition-all hover:bg-amber-600 disabled:opacity-50"
              >
                {purchasingBundle === 'FOUR_SEAT' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Package className="h-4 w-4" />
                )}
                Select 4-Pack Modules
              </button>
            </div>
          </div>

          {/* Show Active Bundles if any */}
          {bundles.length > 0 && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">
                My Exam Packages
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {bundle.bundleType === 'TWO_SEAT' ? 'Twin Pack' : '4-Pack'}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${bundle.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}
                      >
                        {bundle.status}
                      </span>
                    </div>
                    <div className="mb-3 text-sm text-slate-500">
                      Seats Remaining: <strong>{bundle.totalSeats - bundle.usedSeats}</strong> /{' '}
                      {bundle.totalSeats}
                    </div>
                    <div className="text-xs text-slate-400">
                      Valid until {new Date(bundle.validUntil).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            id="individual-exams"
            className="mt-12 space-y-4 border-t border-slate-100 pt-12 dark:border-slate-800"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Individual Exam Modules
              </h2>
              <p className="text-sm text-slate-500">
                Select a module to book an individual seat (€520)
              </p>
            </div>

            {Object.values(groupedComponents)
              .sort((a, b) =>
                a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' })
              )
              .map((course) => (
                <div
                  key={course.code}
                  className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <button
                    onClick={() =>
                      setExpandedCourse(expandedCourse === course.code ? null : course.code)
                    }
                    className="flex w-full items-center justify-between p-6 text-left"
                  >
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100">
                        {course.code}: {course.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {course.components.length} exam component(s) available
                      </p>
                    </div>
                    {expandedCourse === course.code ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </button>

                  {expandedCourse === course.code && (
                    <div className="border-t border-slate-100 px-6 pb-6 dark:border-slate-800">
                      <div className="mt-4 space-y-3">
                        {course.components
                          .sort((a, b) =>
                            a.code.localeCompare(b.code, undefined, {
                              numeric: true,
                              sensitivity: 'base',
                            })
                          )
                          .map((component) => (
                            <div
                              key={component.id}
                              className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 dark:text-slate-100">
                                    {component.code} - {component.name}
                                  </span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                      component.type === 'MCQ'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-purple-100 text-purple-700'
                                    }`}
                                  >
                                    {component.type}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-slate-500">
                                  Duration: {component.duration} minutes
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="font-bold text-slate-900 dark:text-slate-100">
                                    €{Number(component.individualPrice).toFixed(2)}
                                  </p>
                                  <p className="text-xs text-slate-500">Individual Fee</p>
                                </div>
                                <button
                                  onClick={() => handleBookExamClick(component.id, 'INDIVIDUAL')}
                                  disabled={bookingExam === component.id || !wallet}
                                  className="rounded-lg bg-[#002a5c] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#003875] disabled:opacity-50"
                                >
                                  {bookingExam === component.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Book Seat'
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

            {Object.keys(groupedComponents).length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <p className="text-slate-500">No exam components available at this time</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pools Tab */}
      {activeTab === 'pools' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Exam Pools</h2>
            <p className="text-sm text-slate-500">
              Join a pool for €
              {pools.length > 0 ? Math.min(...pools.map((p) => Number(p.seatPrice))) : '300'} per
              seat
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pools.map((pool) => (
              <div
                key={pool.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{pool.name}</h3>
                    <p className="text-sm text-slate-500">{pool.event.name}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${poolStatusColor[pool.status]}`}
                  >
                    {poolStatusLabel[pool.status]}
                  </span>
                </div>

                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(pool.examDate).toLocaleDateString()} at{' '}
                      {new Date(pool.examStartTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Users className="h-4 w-4" />
                    <span>
                      {pool.currentMemberCount}/{pool.maxCandidates} candidates
                    </span>
                  </div>
                </div>

                {/* Pool Fill Rate Bar */}
                {(() => {
                  const fillPct =
                    pool.maxCandidates > 0
                      ? Math.round((pool.currentMemberCount / pool.maxCandidates) * 100)
                      : 0
                  return (
                    <div className="mb-4">
                      <div className="mb-1 flex justify-between text-[10px] font-medium">
                        <span
                          className={
                            fillPct >= 90
                              ? 'font-bold text-red-500'
                              : fillPct >= 70
                                ? 'font-bold text-orange-500'
                                : fillPct >= 50
                                  ? 'text-yellow-600'
                                  : 'text-slate-400'
                          }
                        >
                          {fillPct >= 90
                            ? '🔴 Almost Full!'
                            : fillPct >= 70
                              ? '🟠 Filling Fast'
                              : fillPct >= 50
                                ? '🟡 Half Full'
                                : '🟢 Seats Available'}
                        </span>
                        <span className="text-slate-400">{fillPct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${fillPct >= 90 ? 'bg-red-500' : fillPct >= 70 ? 'bg-orange-400' : fillPct >= 50 ? 'bg-yellow-400' : 'bg-green-400'}`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>
                  )
                })()}

                {/* Module Selection */}
                {pool.allowedModules && pool.allowedModules.length > 0 && (
                  <div className="mb-4">
                    <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Select Module
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#002a5c] focus:ring-1 focus:ring-[#002a5c] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      value={selectedModules[pool.id] || pool.allowedModules[0] || 'M1'}
                      onChange={(e) =>
                        setSelectedModules({ ...selectedModules, [pool.id]: e.target.value })
                      }
                    >
                      {(pool.allowedModules.length > 0
                        ? pool.allowedModules
                        : ['M1', 'M7', 'M8', 'M15']
                      ).map((mod) => (
                        <option key={mod} value={mod}>
                          Module {mod}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      €{Number(pool.seatPrice).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">per seat</p>
                  </div>
                  <button
                    onClick={() => {
                      const module = selectedModules[pool.id] || pool.allowedModules?.[0] || 'M1'
                      if (pool.currentMemberCount >= pool.maxCandidates) {
                        handleJoinWaitlist(pool.id, module)
                      } else {
                        handleJoinPool(pool.id, module)
                      }
                    }}
                    disabled={
                      joiningPool === pool.id ||
                      !wallet ||
                      pool.status === 'LOCKED' ||
                      pool.status === 'FAILED' ||
                      pool.status === 'CONFIRMED'
                    }
                    className="rounded-lg bg-[#002a5c] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#003875] disabled:opacity-50"
                  >
                    {joiningPool === pool.id || joiningWaitlist === pool.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : pool.status === 'LOCKED' ? (
                      'Locked'
                    ) : pool.status === 'FAILED' ? (
                      'Cancelled'
                    ) : pool.currentMemberCount >= pool.maxCandidates ? (
                      'Join Waitlist'
                    ) : (
                      'Join Pool'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pools.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <p className="text-slate-500">No exam pools available at this time</p>
            </div>
          )}
        </div>
      )}

      {/* Module Selection Modal for Bundles */}
      {selectedBundleType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900">
            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Select {selectedBundleType === 'TWO_SEAT' ? '2' : '4'} Modules
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Choose the modules you want to be booked into exam pools for this package.
              </p>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-6">
              <div className="space-y-3">
                {Object.values(groupedComponents)
                  .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
                  .flatMap((course) => course.components)
                  .map((component) => {
                    const isSelected = bundleSelectedModules.includes(component.id)
                    const requiredSeats = selectedBundleType === 'TWO_SEAT' ? 2 : 4
                    const isMaxSelected = bundleSelectedModules.length >= requiredSeats

                    return (
                      <label
                        key={component.id}
                        className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-900/20'
                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                        } ${isMaxSelected && !isSelected ? 'cursor-not-allowed opacity-50 grayscale' : ''}`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={isSelected}
                          disabled={isMaxSelected && !isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (!isMaxSelected) {
                                setBundleSelectedModules([...bundleSelectedModules, component.id])
                              }
                            } else {
                              setBundleSelectedModules(
                                bundleSelectedModules.filter((id) => id !== component.id)
                              )
                            }
                          }}
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {component.course.code} - {component.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {component.type} • {component.duration}m
                          </p>
                        </div>
                      </label>
                    )
                  })}
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
              <button
                onClick={() => {
                  setSelectedBundleType(null)
                  setBundleSelectedModules([])
                }}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-3 pr-2 pl-2 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBuyBundle(selectedBundleType, bundleSelectedModules)}
                disabled={
                  bundleSelectedModules.length !== (selectedBundleType === 'TWO_SEAT' ? 2 : 4)
                }
                className="flex-1 rounded-xl bg-indigo-600 py-3 pr-2 pl-2 text-center text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Confirm & Purchase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Individual / Pool Bookings */}
      {confirmingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setConfirmingBooking(null)}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900">
            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Confirm Booking
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Are you sure you want to book this exam seat?
              </p>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Module</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {confirmingBooking.moduleName}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900 dark:text-blue-100">
                    {confirmingBooking.type === 'POOL' ? 'Pool Seat' : 'Individual Seat'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Fee</p>
                  <p className="text-lg font-black text-blue-700 dark:text-blue-400">
                    €{confirmingBooking.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
              <button
                onClick={() => setConfirmingBooking(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={submitBooking}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
