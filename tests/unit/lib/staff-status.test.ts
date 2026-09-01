import { describe, it, expect } from 'vitest'
import { getStaffStatus, updateStaffStatus, canAssignTasks, getStaffWorkload, STAFF_STATUS, STAFF_DEPARTMENTS } from '@/lib/staff/status'

describe('lib/staff/status', () => {
  describe('STAFF_STATUS', () => {
    it('has expected status values', () => {
      expect(STAFF_STATUS.ACTIVE).toBe('ACTIVE')
      expect(STAFF_STATUS.ON_LEAVE).toBe('ON_LEAVE')
      expect(STAFF_STATUS.TERMINATED).toBe('TERMINATED')
    })
  })

  describe('STAFF_DEPARTMENTS', () => {
    it('has expected departments', () => {
      expect(STAFF_DEPARTMENTS.ACADEMIC).toBeDefined()
      expect(STAFF_DEPARTMENTS.ADMINISTRATION).toBeDefined()
      expect(STAFF_DEPARTMENTS.FINANCE).toBeDefined()
    })
  })

  describe('getStaffStatus', () => {
    it('returns status for active staff', () => {
      expect(getStaffStatus({ status: 'ACTIVE' })).toBe('ACTIVE')
    })

    it('returns ON_LEAVE for staff with leave', () => {
      expect(getStaffStatus({ status: 'ACTIVE', onLeave: true })).toBe('ON_LEAVE')
    })
  })

  describe('updateStaffStatus', () => {
    it('updates status', () => {
      const updated = updateStaffStatus('staff-1', 'ON_LEAVE')
      expect(updated.status).toBe('ON_LEAVE')
    })

    it('preserves staff id', () => {
      const updated = updateStaffStatus('staff-1', 'ON_LEAVE')
      expect(updated.id).toBe('staff-1')
    })
  })

  describe('canAssignTasks', () => {
    it('returns true for active staff', () => {
      expect(canAssignTasks('staff-1')).toBe(true)
    })

    it('returns false for terminated staff', () => {
      expect(canAssignTasks('staff-terminated')).toBe(false)
    })
  })

  describe('getStaffWorkload', () => {
    it('returns workload percentage', () => {
      const workload = getStaffWorkload('staff-1')
      expect(workload).toBeGreaterThanOrEqual(0)
      expect(workload).toBeLessThanOrEqual(100)
    })

    it('returns 0 for no tasks', () => {
      expect(getStaffWorkload('staff-no-tasks')).toBe(0)
    })
  })
})
