import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  scenarios: {
    // 30 concurrent students starting exams simultaneously
    exam_start_burst: {
      executor: 'constant-vus',
      vus: 30,
      duration: '30s',
      exec: 'examStartBurst',
    },
    // Heartbeat stability test: 30 students pinging for 30 minutes
    heartbeat_stability: {
      executor: 'constant-vus',
      vus: 30,
      duration: '30m',
      exec: 'heartbeatPulse',
    },
    // Monitor polling: instructor dashboard polling every 15s
    monitor_polling: {
      executor: 'constant-vus',
      vus: 1,
      duration: '10m',
      exec: 'monitorPoll',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95th percentile < 2s
    'exam_start_burst{status:::success}': ['rate>0.95'], // >95% success on burst
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const CRON_SECRET = __ENV.CRON_SECRET || ''
const STUDENT_TOKEN = __ENV.STUDENT_TOKEN || ''
const INSTRUCTOR_TOKEN = __ENV.INSTRUCTOR_TOKEN || ''

function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
}

// Scenario 1: 30 students start exams simultaneously
export function examStartBurst() {
  // Each VU represents one student starting their exam
  const res = http.post(
    `${BASE_URL}/api/student/exams/internal/start`,
    JSON.stringify({ bankId: __ENV.TEST_BANK_ID }),
    authHeaders(STUDENT_TOKEN)
  )

  check(res, {
    'start status is 200 or 409': (r) => r.status === 200 || r.status === 409,
    'start response time < 2s': (r) => r.timings.duration < 2000,
  })

  sleep(1)
}

// Scenario 2: Heartbeat stability
export function heartbeatPulse() {
  const sessionId = __ENV.TEST_SESSION_ID
  if (!sessionId) return

  for (let i = 0; i < 60; i++) {
    const res = http.post(
      `${BASE_URL}/api/student/exams/internal/heartbeat`,
      JSON.stringify({ sessionId }),
      authHeaders(STUDENT_TOKEN)
    )

    check(res, {
      'heartbeat accepted': (r) => r.status === 200,
      'heartbeat response time < 500ms': (r) => r.timings.duration < 500,
    })

    sleep(30) // ping every 30s
  }
}

// Scenario 3: Instructor monitor polling
export function monitorPoll() {
  const classId = __ENV.TEST_CLASS_ID
  if (!classId) return

  for (let i = 0; i < 40; i++) {
    const res = http.get(
      `${BASE_URL}/api/instructor/exams/classes/${classId}/sessions`,
      authHeaders(INSTRUCTOR_TOKEN)
    )

    check(res, {
      'monitor status is 200': (r) => r.status === 200,
      'monitor response time < 2s': (r) => r.timings.duration < 2000,
    })

    sleep(15) // poll every 15s
  }
}

// Cleanup: verify cron auto-submits expired sessions
export function teardown() {
  if (!CRON_SECRET) return

  const res = http.get(`${BASE_URL}/api/cron/exam-timeout`, {
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  })

  check(res, {
    'cron auto-submit success': (r) => r.status === 200,
  })
}
