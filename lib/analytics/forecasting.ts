import { prismaUnfiltered as prisma } from '@/lib/prisma/client'

// ============================================================================
// REVENUE FORECASTING
// ============================================================================

type MonthlyDataPoint = { month: number; year: number; value: number }

/**
 * Simple linear regression: finds the line y = slope * x + intercept
 * that best fits the data points.
 */
function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 }

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
  for (const p of points) {
    sumX += p.x
    sumY += p.y
    sumXY += p.x * p.y
    sumXX += p.x * p.x
  }

  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return { slope: 0, intercept: sumY / n }

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

/**
 * Exponential moving average — gives more weight to recent data.
 */
function exponentialMovingAverage(values: number[], alpha = 0.3): number {
  if (values.length === 0) return 0
  let ema = values[0]
  for (let i = 1; i < values.length; i++) {
    ema = alpha * values[i] + (1 - alpha) * ema
  }
  return ema
}

/**
 * Forecasts revenue for the next N months using a hybrid of
 * linear regression (trend) and exponential moving average (smoothing).
 * Uses 24 months of historical data for the model.
 */
export async function getRevenueForecast(forecastMonths = 6) {
  const now = new Date()
  const lookbackStart = new Date(now.getFullYear() - 2, now.getMonth(), 1)

  const payments = await prisma.payment.findMany({
    where: {
      status: 'APPROVED',
      approvedAt: { gte: lookbackStart },
    },
    select: { amount: true, approvedAt: true },
  })

  // Build monthly aggregates
  const monthlyMap = new Map<string, number>()
  for (const p of payments) {
    if (!p.approvedAt) continue
    const d = new Date(p.approvedAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(p.amount))
  }

  // Convert to ordered time series
  const historical: MonthlyDataPoint[] = []
  const current = new Date(lookbackStart)
  while (current <= now) {
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
    historical.push({
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      value: monthlyMap.get(key) || 0,
    })
    current.setMonth(current.getMonth() + 1)
  }

  // Linear regression for trend
  const regressionPoints = historical.map((d, i) => ({ x: i, y: d.value }))
  const { slope, intercept } = linearRegression(regressionPoints)

  // EMA for smoothed baseline
  const emaValue = exponentialMovingAverage(historical.map(d => d.value))

  // Generate forecasts
  const forecasted: Array<{
    month: number
    year: number
    label: string
    predicted: number
    lower: number
    upper: number
  }> = []

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const baseIndex = historical.length

  for (let i = 0; i < forecastMonths; i++) {
    const futureDate = new Date(now)
    futureDate.setMonth(futureDate.getMonth() + i + 1)

    // Blend linear trend with EMA (70% trend, 30% EMA)
    const trendValue = slope * (baseIndex + i) + intercept
    const predicted = Math.max(0, Math.round(0.7 * trendValue + 0.3 * emaValue))

    // Confidence interval widens with distance (±15% base, growing)
    const marginPct = 0.15 + i * 0.05
    const lower = Math.max(0, Math.round(predicted * (1 - marginPct)))
    const upper = Math.round(predicted * (1 + marginPct))

    forecasted.push({
      month: futureDate.getMonth() + 1,
      year: futureDate.getFullYear(),
      label: `${monthNames[futureDate.getMonth()]} ${futureDate.getFullYear()}`,
      predicted,
      lower,
      upper,
    })
  }

  return {
    historical: historical.map(d => ({
      label: `${monthNames[d.month - 1]} ${d.year}`,
      value: Math.round(d.value),
    })),
    forecasted,
    model: {
      slope: Math.round(slope * 100) / 100,
      intercept: Math.round(intercept),
      ema: Math.round(emaValue),
      dataPoints: historical.length,
    },
  }
}

// ============================================================================
// ENROLLMENT PIPELINE PREDICTIONS
// ============================================================================

/**
 * Analyzes the applicant-to-student conversion pipeline.
 * Tracks how applicants move through stages: Applied → Approved → Enrolled → Active.
 */
export async function getEnrollmentPipeline() {
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)

  const [
    totalApplicants,
    activeStudents,
    applicantsThisYear,
    convertedThisYear,
    pendingApplications,
    monthlyApplicants,
    monthlyConversions,
  ] = await Promise.all([
    // All-time applicant count (users who ever had APPLICANT role or have applications)
    prisma.user.count({
      where: { OR: [{ role: 'APPLICANT' }, { role: 'STUDENT' }] },
    }),
    prisma.user.count({
      where: { role: 'STUDENT', status: 'ACTIVE' },
    }),
    prisma.user.count({
      where: {
        createdAt: { gte: yearStart },
        OR: [{ role: 'APPLICANT' }, { role: 'STUDENT' }],
      },
    }),
    // Students created this year (converted from applicant)
    prisma.studentProfile.count({
      where: { createdAt: { gte: yearStart } },
    }),
    prisma.user.count({
      where: { role: 'APPLICANT', status: 'PENDING' },
    }),
    // Monthly breakdown for trend (last 12 months)
    prisma.user.findMany({
      where: {
        createdAt: { gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) },
        OR: [{ role: 'APPLICANT' }, { role: 'STUDENT' }],
      },
      select: { createdAt: true },
    }),
    prisma.studentProfile.findMany({
      where: {
        createdAt: { gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) },
      },
      select: { createdAt: true },
    }),
  ])

  // Build monthly conversion rate data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyData: Array<{ label: string; applicants: number; conversions: number; rate: number }> = []

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1)

    const applicants = monthlyApplicants.filter(
      a => a.createdAt >= d && a.createdAt < nextMonth
    ).length

    const conversions = monthlyConversions.filter(
      c => c.createdAt >= d && c.createdAt < nextMonth
    ).length

    monthlyData.push({
      label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
      applicants,
      conversions,
      rate: applicants > 0 ? Math.round((conversions / applicants) * 100) : 0,
    })
  }

  // Predict next month's conversions based on recent rate
  const recentRates = monthlyData.slice(-3).map(d => d.rate).filter(r => r > 0)
  const avgRecentRate = recentRates.length > 0
    ? Math.round(recentRates.reduce((s, r) => s + r, 0) / recentRates.length)
    : 0

  const overallConversionRate = totalApplicants > 0
    ? Math.round((activeStudents / totalApplicants) * 100)
    : 0

  return {
    summary: {
      totalApplicants,
      activeStudents,
      pendingApplications,
      overallConversionRate,
      ytdApplicants: applicantsThisYear,
      ytdConversions: convertedThisYear,
      ytdConversionRate: applicantsThisYear > 0
        ? Math.round((convertedThisYear / applicantsThisYear) * 100)
        : 0,
    },
    monthlyData,
    prediction: {
      predictedConversionRate: avgRecentRate,
      estimatedNextMonthConversions: pendingApplications > 0
        ? Math.round((pendingApplications * avgRecentRate) / 100)
        : 0,
    },
  }
}

// ============================================================================
// TREND DETECTION & ANOMALY HIGHLIGHTING
// ============================================================================

type AnomalyLevel = 'INFO' | 'WARNING' | 'CRITICAL'

type TrendAnomaly = {
  metric: string
  level: AnomalyLevel
  message: string
  currentValue: number
  expectedValue: number
  deviationPct: number
}

/**
 * Z-score based anomaly detection.
 * Flags data points that deviate significantly from the rolling mean.
 */
function detectAnomalies(
  values: number[],
  metricName: string,
  latestLabel: string
): TrendAnomaly | null {
  if (values.length < 4) return null // Need enough data

  const latest = values[values.length - 1]
  const history = values.slice(0, -1)

  const mean = history.reduce((s, v) => s + v, 0) / history.length
  const variance = history.reduce((s, v) => s + (v - mean) ** 2, 0) / history.length
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) return null // All values identical

  const zScore = (latest - mean) / stdDev
  const deviationPct = mean !== 0 ? Math.round(((latest - mean) / mean) * 100) : 0

  // Thresholds: |z| > 2 = warning, |z| > 3 = critical
  if (Math.abs(zScore) < 1.5) return null

  const direction = zScore > 0 ? 'above' : 'below'
  const level: AnomalyLevel = Math.abs(zScore) > 3 ? 'CRITICAL' : Math.abs(zScore) > 2 ? 'WARNING' : 'INFO'

  return {
    metric: metricName,
    level,
    message: `${metricName} in ${latestLabel} is ${Math.abs(deviationPct)}% ${direction} the historical average`,
    currentValue: Math.round(latest),
    expectedValue: Math.round(mean),
    deviationPct,
  }
}

/**
 * Detects trend direction using linear regression slope.
 */
function detectTrendDirection(values: number[]): 'rising' | 'falling' | 'stable' {
  if (values.length < 3) return 'stable'
  const points = values.map((y, x) => ({ x, y }))
  const { slope } = linearRegression(points)
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  if (mean === 0) return 'stable'
  const normalizedSlope = slope / mean
  if (normalizedSlope > 0.05) return 'rising'
  if (normalizedSlope < -0.05) return 'falling'
  return 'stable'
}

/**
 * Runs anomaly detection across key business metrics.
 * Returns flagged anomalies and overall trend indicators.
 */
export async function detectTrends() {
  const now = new Date()
  const lookbackStart = new Date(now.getFullYear() - 1, now.getMonth(), 1)

  const [payments, enrollments, examResults] = await Promise.all([
    prisma.payment.findMany({
      where: {
        status: 'APPROVED',
        approvedAt: { gte: lookbackStart },
      },
      select: { amount: true, approvedAt: true },
    }),
    prisma.enrollment.findMany({
      where: {
        enrolledAt: { gte: lookbackStart },
        deletedAt: null,
      },
      select: { enrolledAt: true },
    }),
    prisma.examResult.findMany({
      where: { createdAt: { gte: lookbackStart } },
      select: { passed: true, createdAt: true },
    }),
  ])

  // Build monthly time series for each metric
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const revenueByMonth: number[] = []
  const enrollmentsByMonth: number[] = []
  const passRateByMonth: number[] = []
  const labels: string[] = []

  for (let i = 12; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`
    labels.push(label)

    const monthRevenue = payments
      .filter(p => p.approvedAt && p.approvedAt >= d && p.approvedAt < nextMonth)
      .reduce((s, p) => s + Number(p.amount), 0)
    revenueByMonth.push(monthRevenue)

    const monthEnrollments = enrollments
      .filter(e => e.enrolledAt >= d && e.enrolledAt < nextMonth).length
    enrollmentsByMonth.push(monthEnrollments)

    const monthResults = examResults.filter(r => r.createdAt >= d && r.createdAt < nextMonth)
    const monthPassRate = monthResults.length > 0
      ? Math.round((monthResults.filter(r => r.passed).length / monthResults.length) * 100)
      : 0
    passRateByMonth.push(monthPassRate)
  }

  const latestLabel = labels[labels.length - 1]

  // Detect anomalies
  const anomalies: TrendAnomaly[] = []
  const revenueAnomaly = detectAnomalies(revenueByMonth, 'Revenue', latestLabel)
  if (revenueAnomaly) anomalies.push(revenueAnomaly)

  const enrollmentAnomaly = detectAnomalies(enrollmentsByMonth, 'Enrollments', latestLabel)
  if (enrollmentAnomaly) anomalies.push(enrollmentAnomaly)

  const passRateAnomaly = detectAnomalies(passRateByMonth, 'Exam Pass Rate', latestLabel)
  if (passRateAnomaly) anomalies.push(passRateAnomaly)

  return {
    trends: {
      revenue: {
        direction: detectTrendDirection(revenueByMonth),
        data: labels.map((label, i) => ({ label, value: Math.round(revenueByMonth[i]) })),
      },
      enrollments: {
        direction: detectTrendDirection(enrollmentsByMonth),
        data: labels.map((label, i) => ({ label, value: enrollmentsByMonth[i] })),
      },
      passRate: {
        direction: detectTrendDirection(passRateByMonth),
        data: labels.map((label, i) => ({ label, value: passRateByMonth[i] })),
      },
    },
    anomalies: anomalies.sort((a, b) => {
      const order = { CRITICAL: 0, WARNING: 1, INFO: 2 }
      return order[a.level] - order[b.level]
    }),
  }
}
