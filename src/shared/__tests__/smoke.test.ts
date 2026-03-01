import { describe, it, expect } from 'vitest'
import { IPC } from '../constants/ipc-channels'

describe('IPC channel constants', () => {
  it('defines IPC.DB.GET_TARIFFS', () => {
    expect(IPC.DB.GET_TARIFFS).toBe('db:get-tariffs')
  })

  it('defines IPC.DB.CHECK_IN', () => {
    expect(IPC.DB.CHECK_IN).toBe('db:check-in')
  })

  it('defines IPC.DB.CHECK_OUT', () => {
    expect(IPC.DB.CHECK_OUT).toBe('db:check-out')
  })

  it('defines IPC.DB.GET_SESSIONS', () => {
    expect(IPC.DB.GET_SESSIONS).toBe('db:get-sessions')
  })

  it('defines IPC.HW.PRINT_RECEIPT', () => {
    expect(IPC.HW.PRINT_RECEIPT).toBe('hw:print-receipt')
  })

  it('defines IPC.APP.GET_VERSION', () => {
    expect(IPC.APP.GET_VERSION).toBe('app:get-version')
  })

  it('defines IPC.APP.GET_CONFIG', () => {
    expect(IPC.APP.GET_CONFIG).toBe('app:get-config')
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
