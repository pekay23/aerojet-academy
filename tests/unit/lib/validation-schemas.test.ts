import { describe, it, expect } from 'vitest'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  createUserSchema,
  updateUserSchema,
  createCourseSchema,
  updateCourseSchema,
  createClassSchema,
  updateClassSchema,
  createExamEventSchema,
  updateExamEventSchema,
  createExamPoolSchema,
  updateExamPoolSchema,
  studentCreatePoolSchema,
  joinPoolSchema,
  walletTopUpSchema,
  approveTopUpSchema,
  approvePaymentSchema,
  rejectPaymentSchema,
  createEnrollmentSchema,
  approveEnrollmentSchema,
  takeAttendanceSchema,
  enterGradeSchema,
  updateProfileSchema,
  contactSchema,
  newsArticleSchema,
  updateNewsArticleSchema,
  charterBookingSchema,
  mergePoolsSchema,
  attachProofSchema,
  staffBookExamSchema,
  updateSettingSchema,
  payMilestoneSchema,
  validateBody,
} from '@/lib/validation/schemas'

const cuid = (prefix: string) => `c${prefix}abc1234567890abcdefg`

describe('lib/validation/schemas', () => {
  describe('validateBody', () => {
    it('returns success with data for valid input', () => {
      const result = validateBody(loginSchema, { email: 'test@example.com', password: 'secret' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ email: 'test@example.com', password: 'secret' })
      }
    })

    it('returns error string for invalid input', () => {
      const result = validateBody(loginSchema, { email: 'not-an-email' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('email')
      }
    })
  })

  describe('registerSchema', () => {
    it('accepts valid registration data', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        nationality: 'Ghanaian',
        dateOfBirth: '2000-01-01',
        phoneCountryCode: '+233',
        phone: '241234567',
        selectedProgramme: 'FULL_TIME_4YEAR' as const,
        licenseCategories: ['B1.1'],
        acknowledgeFeeDeletion: true,
      }
      const result = registerSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('rejects firstName shorter than 2 characters', () => {
      const result = registerSchema.safeParse({
        firstName: 'J',
        lastName: 'Doe',
        email: 'john@example.com',
        nationality: 'Ghanaian',
        dateOfBirth: '2000-01-01',
        phoneCountryCode: '+233',
        phone: '241234567',
        selectedProgramme: 'FULL_TIME_4YEAR',
        licenseCategories: ['B1.1'],
        acknowledgeFeeDeletion: true,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((e: any) => e.path.includes('firstName'))).toBe(true)
      }
    })

    it('rejects invalid email', () => {
      const result = registerSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        nationality: 'Ghanaian',
        dateOfBirth: '2000-01-01',
        phoneCountryCode: '+233',
        phone: '241234567',
        selectedProgramme: 'FULL_TIME_4YEAR',
        licenseCategories: ['B1.1'],
        acknowledgeFeeDeletion: true,
      })
      expect(result.success).toBe(false)
    })

    it('rejects future date of birth', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]
      const result = registerSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        nationality: 'Ghanaian',
        dateOfBirth: futureDate,
        phoneCountryCode: '+233',
        phone: '241234567',
        selectedProgramme: 'FULL_TIME_4YEAR',
        licenseCategories: ['B1.1'],
        acknowledgeFeeDeletion: true,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((e: any) => e.message.includes('future'))).toBe(true)
      }
    })

    it('rejects applicants under 16 years old', () => {
      const youngDate = new Date(Date.now() - 15 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const result = registerSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        nationality: 'Ghanaian',
        dateOfBirth: youngDate,
        phoneCountryCode: '+233',
        phone: '241234567',
        selectedProgramme: 'FULL_TIME_4YEAR',
        licenseCategories: ['B1.1'],
        acknowledgeFeeDeletion: true,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((e: any) => e.message.includes('16'))).toBe(true)
      }
    })

    it('requires license categories for full-time programmes', () => {
      const result = registerSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        nationality: 'Ghanaian',
        dateOfBirth: '2000-01-01',
        phoneCountryCode: '+233',
        phone: '241234567',
        selectedProgramme: 'FULL_TIME_4YEAR',
        acknowledgeFeeDeletion: true,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((e: any) => e.message.includes('License'))).toBe(true)
      }
    })

    it('allows modular programme without license categories', () => {
      const result = registerSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        nationality: 'Ghanaian',
        dateOfBirth: '2000-01-01',
        phoneCountryCode: '+233',
        phone: '241234567',
        selectedProgramme: 'MODULAR',
        acknowledgeFeeDeletion: true,
      })
      expect(result.success).toBe(true)
    })

    it('rejects when fee acknowledgement is not true', () => {
      const result = registerSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        nationality: 'Ghanaian',
        dateOfBirth: '2000-01-01',
        phoneCountryCode: '+233',
        phone: '241234567',
        selectedProgramme: 'MODULAR',
        acknowledgeFeeDeletion: false,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((e: any) => e.message.includes('acknowledge'))).toBe(true)
      }
    })

    it('rejects phone shorter than 7 characters', () => {
      const result = registerSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        nationality: 'Ghanaian',
        dateOfBirth: '2000-01-01',
        phoneCountryCode: '+233',
        phone: '123',
        selectedProgramme: 'MODULAR',
        acknowledgeFeeDeletion: true,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((e: any) => e.path.includes('phone'))).toBe(true)
      }
    })
  })

  describe('loginSchema', () => {
    it('accepts valid credentials', () => {
      const result = loginSchema.safeParse({ email: 'user@test.com', password: 'password123' })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({ email: 'bad-email', password: 'password123' })
      expect(result.success).toBe(false)
    })

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({ email: 'user@test.com', password: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('forgotPasswordSchema', () => {
    it('accepts valid email', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'user@test.com' }).success).toBe(true)
    })

    it('rejects invalid email', () => {
      expect(forgotPasswordSchema.safeParse({ email: 'bad' }).success).toBe(false)
    })
  })

  describe('resetPasswordSchema', () => {
    it('accepts matching passwords with token', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'abc123',
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      })
      expect(result.success).toBe(true)
    })

    it('rejects mismatched passwords', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'abc123',
        password: 'newpassword123',
        confirmPassword: 'different',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((e: any) => e.message.includes('match'))).toBe(true)
      }
    })

    it('rejects password shorter than 8 characters', () => {
      const result = resetPasswordSchema.safeParse({
        token: 'abc123',
        password: 'short',
        confirmPassword: 'short',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('changePasswordSchema', () => {
    it('accepts matching new passwords', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpass',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      })
      expect(result.success).toBe(true)
    })

    it('rejects mismatched new passwords', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpass',
        newPassword: 'newpassword123',
        confirmPassword: 'different',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createUserSchema', () => {
    it('accepts valid user data', () => {
      const result = createUserSchema.safeParse({
        email: 'new@test.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'STUDENT',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid role', () => {
      const result = createUserSchema.safeParse({
        email: 'new@test.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'SUPER_USER',
      })
      expect(result.success).toBe(false)
    })

    it('rejects firstName shorter than 2 characters', () => {
      const result = createUserSchema.safeParse({
        email: 'new@test.com',
        firstName: 'J',
        lastName: 'Doe',
        role: 'STUDENT',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateUserSchema', () => {
    it('accepts partial updates', () => {
      const result = updateUserSchema.safeParse({ firstName: 'Jane' })
      expect(result.success).toBe(true)
    })

    it('rejects invalid status value', () => {
      const result = updateUserSchema.safeParse({ status: 'UNKNOWN' })
      expect(result.success).toBe(false)
    })

    it('accepts empty profilePhotoUrl', () => {
      const result = updateUserSchema.safeParse({ profilePhotoUrl: '' })
      expect(result.success).toBe(true)
    })
  })

  describe('createCourseSchema', () => {
    it('accepts valid course data', () => {
      const result = createCourseSchema.safeParse({
        code: 'MTH101',
        name: 'Mathematics',
        description: 'Basic math',
        categoryId: cuid('cat'),
        price: 500,
        currency: 'EUR',
        isActive: true,
        requiresPrerequisite: false,
      })
      expect(result.success).toBe(true)
    })

    it('strips whitespace from code', () => {
      const result = createCourseSchema.safeParse({
        code: 'MTH 101',
        name: 'Mathematics',
        categoryId: cuid('cat'),
        price: 500,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.code).toBe('MTH101')
      }
    })

    it('rejects negative price', () => {
      const result = createCourseSchema.safeParse({
        code: 'MTH101',
        name: 'Mathematics',
        categoryId: cuid('cat'),
        price: -100,
      })
      expect(result.success).toBe(false)
    })

    it('rejects code longer than 20 characters', () => {
      const result = createCourseSchema.safeParse({
        code: 'A'.repeat(21),
        name: 'Mathematics',
        categoryId: cuid('cat'),
        price: 500,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createClassSchema', () => {
    it('accepts valid class data', () => {
      const result = createClassSchema.safeParse({
        courseId: cuid('cour'),
        name: 'Morning Batch',
        startDate: '2024-01-15T00:00:00Z',
        endDate: '2024-06-01T00:00:00Z',
        maxStudents: 28,
        recurrenceType: 'NONE',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid start date', () => {
      const result = createClassSchema.safeParse({
        courseId: cuid('cour'),
        name: 'Morning Batch',
        startDate: 'not-a-date',
        endDate: '2024-06-01T00:00:00Z',
        maxStudents: 28,
      })
      expect(result.success).toBe(false)
    })

    it('defaults maxStudents to 28', () => {
      const result = createClassSchema.safeParse({
        courseId: cuid('cour'),
        name: 'Morning Batch',
        startDate: '2024-01-15T00:00:00Z',
        endDate: '2024-06-01T00:00:00Z',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.maxStudents).toBe(28)
      }
    })
  })

  describe('createExamEventSchema', () => {
    it('accepts valid exam event data', () => {
      const result = createExamEventSchema.safeParse({
        name: 'Jan 2024 Exam',
        startDate: '2024-01-15',
        endDate: '2024-01-20',
        paymentDeadline: '2024-01-10',
        minRevenueTarget: 25000,
        resitFee: 480,
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid start date', () => {
      const result = createExamEventSchema.safeParse({
        name: 'Exam',
        startDate: 'not-a-date',
        endDate: '2024-01-20',
        paymentDeadline: '2024-01-10',
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative resitFee', () => {
      const result = createExamEventSchema.safeParse({
        name: 'Exam',
        startDate: '2024-01-15',
        endDate: '2024-01-20',
        paymentDeadline: '2024-01-10',
        resitFee: -100,
      })
      expect(result.success).toBe(false)
    })

    it('accepts valid optional joinDeadline', () => {
      const result = createExamEventSchema.safeParse({
        name: 'Exam',
        startDate: '2024-01-15',
        endDate: '2024-01-20',
        joinDeadline: '2024-01-12',
        paymentDeadline: '2024-01-10',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('createExamPoolSchema', () => {
    it('accepts valid pool data', () => {
      const result = createExamPoolSchema.safeParse({
        eventId: cuid('even'),
        name: 'Pool A',
        examDate: '2024-01-15',
        examStartTime: '2024-01-15T08:00:00Z',
        examEndTime: '2024-01-15T12:00:00Z',
        allowedModules: ['B1.1'],
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty allowedModules', () => {
      const result = createExamPoolSchema.safeParse({
        eventId: cuid('even'),
        name: 'Pool A',
        examDate: '2024-01-15',
        examStartTime: '2024-01-15T08:00:00Z',
        examEndTime: '2024-01-15T12:00:00Z',
        allowedModules: [],
      })
      expect(result.success).toBe(false)
    })

    it('rejects more than 4 allowed modules', () => {
      const result = createExamPoolSchema.safeParse({
        eventId: cuid('even'),
        name: 'Pool A',
        examDate: '2024-01-15',
        examStartTime: '2024-01-15T08:00:00Z',
        examEndTime: '2024-01-15T12:00:00Z',
        allowedModules: ['B1.1', 'B1.2', 'B2', 'B3', 'B4'],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('studentCreatePoolSchema', () => {
    it('accepts valid student pool booking', () => {
      const result = studentCreatePoolSchema.safeParse({
        eventId: cuid('even'),
        moduleCode: 'B1.1',
        examDate: '2024-01-15',
        examTimeSlot: 'MORNING',
        bookingType: 'INDIVIDUAL_POOL',
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing moduleCode', () => {
      const result = studentCreatePoolSchema.safeParse({
        eventId: cuid('even'),
        examDate: '2024-01-15',
        examTimeSlot: 'MORNING',
      })
      expect(result.success).toBe(false)
    })

    it('rejects seats exceeding max of 28', () => {
      const result = studentCreatePoolSchema.safeParse({
        eventId: cuid('even'),
        moduleCode: 'B1.1',
        examDate: '2024-01-15',
        examTimeSlot: 'MORNING',
        seats: 30,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('joinPoolSchema', () => {
    it('accepts valid module selection', () => {
      expect(joinPoolSchema.safeParse({ selectedModule: 'B1.1' }).success).toBe(true)
    })

    it('rejects empty module selection', () => {
      expect(joinPoolSchema.safeParse({ selectedModule: '' }).success).toBe(false)
    })
  })

  describe('walletTopUpSchema', () => {
    it('accepts valid top-up data', () => {
      const result = walletTopUpSchema.safeParse({
        amount: 1000,
        proofUrl: 'https://example.com/proof.jpg',
        reference: 'REF-001',
        notes: 'Bank transfer',
      })
      expect(result.success).toBe(true)
    })

    it('rejects zero amount', () => {
      const result = walletTopUpSchema.safeParse({
        amount: 0,
        proofUrl: 'https://example.com/proof.jpg',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid proofUrl', () => {
      const result = walletTopUpSchema.safeParse({
        amount: 1000,
        proofUrl: 'not-a-url',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('rejectPaymentSchema', () => {
    it('accepts valid rejection reason', () => {
      expect(rejectPaymentSchema.safeParse({ reason: 'Invalid amount' }).success).toBe(true)
    })

    it('rejects empty rejection reason', () => {
      expect(rejectPaymentSchema.safeParse({ reason: '' }).success).toBe(false)
    })
  })

  describe('createEnrollmentSchema', () => {
    it('accepts valid enrollment data', () => {
      const result = createEnrollmentSchema.safeParse({
        courseId: cuid('cour'),
        paymentProofUrl: 'https://example.com/proof.pdf',
      })
      expect(result.success).toBe(true)
    })

    it('accepts enrollment without payment proof', () => {
      expect(createEnrollmentSchema.safeParse({ courseId: cuid('cour') }).success).toBe(true)
    })
  })

  describe('takeAttendanceSchema', () => {
    it('accepts valid attendance records', () => {
      const result = takeAttendanceSchema.safeParse({
        date: '2024-01-15T00:00:00.000Z',
        records: [
          { userId: cuid('user'), present: true, lateMinutes: 0 },
          { userId: cuid('user'), present: false, lateMinutes: 15, notes: 'Late' },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('rejects negative lateMinutes', () => {
      const result = takeAttendanceSchema.safeParse({
        date: '2024-01-15T00:00:00.000Z',
        records: [{ userId: cuid('user'), present: true, lateMinutes: -5 }],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('enterGradeSchema', () => {
    it('accepts valid grade entry', () => {
      const result = enterGradeSchema.safeParse({
        enrollmentId: cuid('enro'),
        type: 'MID_TERM',
        title: 'Mid-term Exam',
        grades: [
          {
            userId: cuid('user'),
            score: 85,
            maxScore: 100,
            feedback: 'Good work',
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('rejects zero maxScore', () => {
      const result = enterGradeSchema.safeParse({
        enrollmentId: cuid('enro'),
        type: 'MID_TERM',
        title: 'Mid-term',
        grades: [{ userId: cuid('user'), score: 85, maxScore: 0 }],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateProfileSchema', () => {
    it('accepts partial profile updates', () => {
      expect(updateProfileSchema.safeParse({ firstName: 'Jane' }).success).toBe(true)
    })

    it('rejects firstName shorter than 2 characters', () => {
      expect(updateProfileSchema.safeParse({ firstName: 'J' }).success).toBe(false)
    })
  })

  describe('contactSchema', () => {
    it('accepts valid contact form', () => {
      const result = contactSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Inquiry',
        message: 'I have a question about the courses.',
      })
      expect(result.success).toBe(true)
    })

    it('rejects message shorter than 10 characters', () => {
      const result = contactSchema.safeParse({
        name: 'John',
        email: 'john@example.com',
        subject: 'Hi',
        message: 'Short',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('newsArticleSchema', () => {
    it('accepts valid article data', () => {
      const result = newsArticleSchema.safeParse({
        title: 'New Course Launch',
        slug: 'new-course-launch',
        content: 'This is the full article content with more than ten characters.',
        authorId: cuid('auth'),
      })
      expect(result.success).toBe(true)
    })

    it('rejects slug shorter than 3 characters', () => {
      const result = newsArticleSchema.safeParse({
        title: 'Article',
        slug: 'ab',
        content: 'Content here.',
        authorId: cuid('auth'),
      })
      expect(result.success).toBe(false)
    })

    it('rejects content shorter than 10 characters', () => {
      const result = newsArticleSchema.safeParse({
        title: 'Article',
        slug: 'article-slug',
        content: 'Short',
        authorId: cuid('auth'),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('charterBookingSchema', () => {
    it('accepts valid charter booking', () => {
      const result = charterBookingSchema.safeParse({
        repUserId: cuid('user'),
        eventId: cuid('even'),
        groupName: 'Aviation Club',
        memberCount: 10,
        modules: ['B1.1', 'B2'],
      })
      expect(result.success).toBe(true)
    })

    it('rejects memberCount exceeding 28', () => {
      const result = charterBookingSchema.safeParse({
        repUserId: cuid('user'),
        eventId: cuid('even'),
        groupName: 'Aviation Club',
        memberCount: 30,
        modules: ['B1.1'],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('mergePoolsSchema', () => {
    it('accepts valid pool merge request', () => {
      expect(mergePoolsSchema.safeParse({ poolAId: cuid('pool'), poolBId: cuid('pool') }).success).toBe(true)
    })
  })

  describe('attachProofSchema', () => {
    it('accepts valid proof URL', () => {
      expect(attachProofSchema.safeParse({ proofUrl: 'https://example.com/proof.pdf' }).success).toBe(true)
    })

    it('rejects invalid proof URL', () => {
      expect(attachProofSchema.safeParse({ proofUrl: 'not-a-url' }).success).toBe(false)
    })
  })

  describe('staffBookExamSchema', () => {
    it('accepts valid booking', () => {
      const result = staffBookExamSchema.safeParse({
        bookingType: 'INDIVIDUAL',
        moduleIds: [cuid('modu')],
        paymentMethod: 'AUTO_DEBIT',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty moduleIds', () => {
      const result = staffBookExamSchema.safeParse({
        bookingType: 'INDIVIDUAL',
        moduleIds: [],
        paymentMethod: 'AUTO_DEBIT',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateSettingSchema', () => {
    it('accepts any value', () => {
      expect(updateSettingSchema.safeParse({ value: 'hello' }).success).toBe(true)
      expect(updateSettingSchema.safeParse({ value: 42 }).success).toBe(true)
      expect(updateSettingSchema.safeParse({ value: null }).success).toBe(true)
    })
  })

  describe('payMilestoneSchema', () => {
    it('accepts valid milestoneId', () => {
      expect(payMilestoneSchema.safeParse({ milestoneId: cuid('mile') }).success).toBe(true)
    })

    it('rejects empty milestoneId', () => {
      expect(payMilestoneSchema.safeParse({ milestoneId: '' }).success).toBe(false)
    })
  })
})
