export const mockAdmin = {
  id: 'admin-1',
  email: 'admin@aerojet-academy.com',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  mustChangePassword: false,
  profile: { firstName: 'Super', lastName: 'Admin' },
}

export const mockStudent = {
  id: 'student-1',
  email: 'student@aerojet-academy.com',
  academyEmail: 'k.owusu@aerojet-academy.com',
  role: 'STUDENT',
  status: 'ACTIVE',
  studentId: 'AJA-2026-0001',
  mustChangePassword: false,
  profile: { firstName: 'Kwame', lastName: 'Owusu' },
}

export const mockApplicant = {
  id: 'applicant-1',
  email: 'applicant@example.com',
  role: 'APPLICANT',
  status: 'PAYMENT_PENDING',
  registrationCode: 'AERO-2026-DEMO01',
  mustChangePassword: false,
  profile: { firstName: 'Ama', lastName: 'Adjei' },
}

export const mockInstructor = {
  id: 'instructor-1',
  email: 'instructor@aerojet-academy.com',
  role: 'INSTRUCTOR',
  status: 'ACTIVE',
  mustChangePassword: false,
  profile: { firstName: 'Captain', lastName: 'Mensah' },
}
