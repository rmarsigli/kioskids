import { describe, it, expect } from 'vitest'
import { IPC_CHANNELS } from '../types/ipc'

describe('IPC channel constants', () => {
  it('defines db:get-tariffs', () => {
    expect(IPC_CHANNELS.DB_GET_TARIFFS).toBe('db:get-tariffs')
  })

  it('defines db:check-in', () => {
    expect(IPC_CHANNELS.DB_CHECK_IN).toBe('db:check-in')
  })

  it('defines db:check-out', () => {
    expect(IPC_CHANNELS.DB_CHECK_OUT).toBe('db:check-out')
  })

  it('defines db:get-sessions', () => {
    expect(IPC_CHANNELS.DB_GET_SESSIONS).toBe('db:get-sessions')
  })

  it('defines hw:print-receipt', () => {
    expect(IPC_CHANNELS.HW_PRINT_RECEIPT).toBe('hw:print-receipt')
  })
})

describe('IpcResult type narrowing', () => {
  it('narrows to success branch', () => {
    const result = { success: true as const, data: 42 }
    expect(result.success).toBe(true)
    expect(result.data).toBe(42)
  })

  it('narrows to error branch', () => {
    const result = { success: false as const, error: 'not found', code: 'NOT_FOUND' }
    expect(result.success).toBe(false)
    expect(result.error).toBe('not found')
    expect(result.code).toBe('NOT_FOUND')
  })
})
