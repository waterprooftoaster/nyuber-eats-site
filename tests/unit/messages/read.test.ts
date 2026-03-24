import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockGetAuthenticatedUser, mockFrom } = vi.hoisted(() => ({
  mockGetAuthenticatedUser: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/api/helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/helpers')>()
  return { ...actual, getAuthenticatedUser: mockGetAuthenticatedUser }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}))

import { PATCH } from '@/app/api/messages/[orderId]/read/route'

const VALID_ORDER_ID = '00000000-0000-4000-8000-000000000001'
const INVALID_ORDER_ID = 'not-a-uuid'
const MOCK_USER = { id: 'user-123' }
const MOCK_CONVERSATION = { id: 'conv-456' }

function makeRequest(orderId: string): NextRequest {
  return new NextRequest(`http://localhost/api/messages/${orderId}/read`, { method: 'PATCH' })
}

function makeParams(orderId: string) {
  return { params: Promise.resolve({ orderId }) }
}

function setupConversationMock(conversation: typeof MOCK_CONVERSATION | null) {
  const mockConvSingle = vi.fn().mockResolvedValue({ data: conversation, error: null })
  return mockConvSingle
}

function setupReadMocks(conversation: typeof MOCK_CONVERSATION | null, updatedRows: { id: string }[]) {
  const mockConvSingle = setupConversationMock(conversation)

  const mockSelect = vi.fn().mockResolvedValue({ data: updatedRows, error: null })
  const mockIs = vi.fn().mockReturnValue({ select: mockSelect })
  const mockNeq = vi.fn().mockReturnValue({ is: mockIs })
  const mockUpdateEq = vi.fn().mockReturnValue({ neq: mockNeq })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

  mockFrom.mockImplementation((table: string) => {
    if (table === 'conversations') {
      return { select: () => ({ eq: () => ({ single: mockConvSingle }) }) }
    }
    return { update: mockUpdate }
  })

  return { mockUpdate, mockNeq, mockIs }
}

describe('PATCH /api/messages/[orderId]/read', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null)
    const res = await PATCH(makeRequest(VALID_ORDER_ID), makeParams(VALID_ORDER_ID))
    expect(res.status).toBe(401)
  })

  it('returns 400 when orderId is not a UUID', async () => {
    mockGetAuthenticatedUser.mockResolvedValue(MOCK_USER)
    const res = await PATCH(makeRequest(INVALID_ORDER_ID), makeParams(INVALID_ORDER_ID))
    expect(res.status).toBe(400)
  })

  it('returns 404 when conversation not found', async () => {
    mockGetAuthenticatedUser.mockResolvedValue(MOCK_USER)
    setupReadMocks(null, [])
    const res = await PATCH(makeRequest(VALID_ORDER_ID), makeParams(VALID_ORDER_ID))
    expect(res.status).toBe(404)
  })

  it('returns 200 with count when messages are marked read', async () => {
    mockGetAuthenticatedUser.mockResolvedValue(MOCK_USER)
    setupReadMocks(MOCK_CONVERSATION, [{ id: 'msg-1' }, { id: 'msg-2' }])
    const res = await PATCH(makeRequest(VALID_ORDER_ID), makeParams(VALID_ORDER_ID))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ count: 2 })
  })

  it('returns 200 with count 0 when no unread messages', async () => {
    mockGetAuthenticatedUser.mockResolvedValue(MOCK_USER)
    setupReadMocks(MOCK_CONVERSATION, [])
    const res = await PATCH(makeRequest(VALID_ORDER_ID), makeParams(VALID_ORDER_ID))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ count: 0 })
  })
})
