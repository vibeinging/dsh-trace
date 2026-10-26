import z from '@deepseek-ai/schemastery'
import { describe, expect, it } from 'vitest'
import { Config } from '../src/index.js'
import { DEFAULT_TRACE_SETTINGS, validateTraceSettings } from '../src/management.js'

/** Reproduce the Host-to-browser schema transport without keeping module closures. */
function browserSchema(): z<Config> {
  return new z(JSON.parse(JSON.stringify(Config.toJSON())))
}

describe('transported Trace settings schema', () => {
  it('uses only serializable data schemas in settings descriptors', () => {
    const wire = JSON.parse(JSON.stringify(Config.toJSON())) as { refs: Record<string, { type: string }> }
    expect(Object.values(wire.refs).map(node => node.type)).not.toContain('transform')
    expect(JSON.stringify(wire)).not.toContain('callback')
  })

  it('resolves defaults after a real JSON round trip', () => {
    expect(browserSchema()({}).settings.get()).toEqual(DEFAULT_TRACE_SETTINGS)
  })

  it('accepts a valid configuration without its original module closure', () => {
    const settings = {
      ...DEFAULT_TRACE_SETTINGS,
      captureEnabled: true,
      points: { models: false, tools: true, errors: false, compaction: false },
      retentionDays: null,
      cleanupIntervalHours: 1,
    }
    expect(browserSchema()({ settings }).settings.get()).toEqual(settings)
  })

  it('defaults the full settings object without changing unlimited retention', () => {
    expect(browserSchema()({}).settings.get().retentionDays).toBe(30)
    expect(browserSchema()({ settings: { ...DEFAULT_TRACE_SETTINGS, retentionDays: null } }).settings.get().retentionDays).toBeNull()
  })

  it('keeps cross-field validation at the Host use and UI write boundaries', () => {
    const settings = {
      ...DEFAULT_TRACE_SETTINGS,
      captureEnabled: true,
      points: { models: false, tools: false, errors: false, compaction: false },
    }
    const transported = browserSchema()({ settings }).settings.get()
    expect(() => validateTraceSettings(transported)).toThrow('Choose at least one capture point')
    expect(validateTraceSettings({ ...transported, captureEnabled: false }).captureEnabled).toBe(false)
  })

  it.each([
    ['retentionDays', 0],
    ['retentionDays', 3651],
    ['retentionDays', 1.5],
    ['cleanupIntervalHours', 0],
    ['cleanupIntervalHours', 169],
    ['cleanupIntervalHours', 1.5],
  ])('rejects %s outside its supported integer range: %s', (field, value) => {
    expect(() => browserSchema()({ settings: { ...DEFAULT_TRACE_SETTINGS, [field]: value } })).toThrow()
  })
})
