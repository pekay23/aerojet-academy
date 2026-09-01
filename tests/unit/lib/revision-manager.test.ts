import { describe, it, expect } from 'vitest'
import { createRevision, updateRevision, publishRevision, archiveRevision, getLatestRevision, getRevisionHistory, canEditRevision, REVISION_STATUS, REVISION_TYPES } from '@/lib/revision/manager'

describe('lib/revision/manager', () => {
  describe('REVISION_STATUS', () => {
    it('has all status values', () => {
      expect(REVISION_STATUS.DRAFT).toBe('DRAFT')
      expect(REVISION_STATUS.PUBLISHED).toBe('PUBLISHED')
      expect(REVISION_STATUS.ARCHIVED).toBe('ARCHIVED')
    })
  })

  describe('REVISION_TYPES', () => {
    it('has all type values', () => {
      expect(REVISION_TYPES.COURSE).toBe('COURSE')
      expect(REVISION_TYPES.MATERIAL).toBe('MATERIAL')
      expect(REVISION_TYPES.EXAM).toBe('EXAM')
    })
  })

  describe('createRevision', () => {
    it('returns object with id and status', () => {
      const revision = createRevision({ type: 'COURSE', entityId: '123' })
      expect(revision.id).toBeDefined()
      expect(revision.status).toBe('DRAFT')
    })

    it('sets createdAt timestamp', () => {
      const revision = createRevision({ type: 'COURSE', entityId: '123' })
      expect(revision.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('updateRevision', () => {
    it('updates revision fields', () => {
      const revision = createRevision({ type: 'COURSE', entityId: '123' })
      const updated = updateRevision(revision.id, { title: 'New Title' })
      expect(updated.title).toBe('New Title')
    })

    it('preserves original fields', () => {
      const revision = createRevision({ type: 'COURSE', entityId: '123' })
      const updated = updateRevision(revision.id, { title: 'New Title' })
      expect(updated.type).toBe('COURSE')
      expect(updated.entityId).toBe('123')
    })
  })

  describe('publishRevision', () => {
    it('changes status to PUBLISHED', () => {
      const revision = createRevision({ type: 'COURSE', entityId: '123' })
      const published = publishRevision(revision.id)
      expect(published.status).toBe('PUBLISHED')
    })
  })

  describe('archiveRevision', () => {
    it('changes status to ARCHIVED', () => {
      const revision = createRevision({ type: 'COURSE', entityId: '123' })
      publishRevision(revision.id)
      const archived = archiveRevision(revision.id)
      expect(archived.status).toBe('ARCHIVED')
    })
  })

  describe('getLatestRevision', () => {
    it('returns null for no revisions', () => {
      expect(getLatestRevision('nonexistent')).toBeNull()
    })

    it('returns revision after creation', () => {
      const revision = createRevision({ type: 'COURSE', entityId: '123' })
      const latest = getLatestRevision('123')
      expect(latest?.id).toBe(revision.id)
    })
  })

  describe('getRevisionHistory', () => {
    it('returns empty array for no revisions', () => {
      expect(getRevisionHistory('nonexistent')).toEqual([])
    })

    it('returns array of revisions', () => {
      createRevision({ type: 'COURSE', entityId: '456' })
      createRevision({ type: 'COURSE', entityId: '456' })
      const history = getRevisionHistory('456')
      expect(history.length).toBe(2)
    })
  })

  describe('canEditRevision', () => {
    it('returns true for DRAFT revision', () => {
      const revision = createRevision({ type: 'COURSE', entityId: '123' })
      expect(canEditRevision(revision.id, 'user-1')).toBe(true)
    })

    it('returns false for PUBLISHED revision', () => {
      const revision = createRevision({ type: 'COURSE', entityId: '123' })
      publishRevision(revision.id)
      expect(canEditRevision(revision.id, 'user-1')).toBe(false)
    })
  })
})
