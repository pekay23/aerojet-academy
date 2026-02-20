export const mockPool = {
  id: 'pool-1',
  eventId: 'event-1',
  name: 'March 2026 Exam Pool - Session A',
  examDate: new Date('2026-03-15'),
  status: 'OPEN',
  minCandidates: 25,
  maxCandidates: 28,
  currentMemberCount: 10,
  moduleDiversityCap: 4,
}

export const mockNearFullPool = {
  ...mockPool,
  id: 'pool-2',
  name: 'March 2026 - Session B',
  status: 'NEAR_FULL',
  currentMemberCount: 24,
}

export const mockConfirmedPool = {
  ...mockPool,
  id: 'pool-3',
  name: 'April 2026 Pool',
  status: 'CONFIRMED',
  currentMemberCount: 26,
}

export const mockMembership = {
  id: 'membership-1',
  poolId: 'pool-1',
  userId: 'student-1',
  selectedModule: 'M1',
  status: 'RESERVED',
  amountReserved: 300,
  amountPaid: 0,
}
