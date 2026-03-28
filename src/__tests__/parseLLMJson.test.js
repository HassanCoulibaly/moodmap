import { describe, it, expect } from 'vitest'
import { parseLLMJson } from '../../lib/groq.js'

describe('parseLLMJson — robust LLM output parsing', () => {
  it('parses clean JSON', () => {
    const result = parseLLMJson('{"message": "hello", "action": "breathe"}')
    expect(result.message).toBe('hello')
    expect(result.action).toBe('breathe')
  })

  it('strips markdown code fences', () => {
    const result = parseLLMJson('```json\n{"message": "hey"}\n```')
    expect(result.message).toBe('hey')
  })

  it('extracts JSON from surrounding text', () => {
    const result = parseLLMJson('Here is the JSON:\n{"message": "found it"}\nThat is all.')
    expect(result.message).toBe('found it')
  })

  it('returns fallback on completely malformed input', () => {
    const result = parseLLMJson('This is not JSON at all')
    expect(result._parseError).toBe(true)
    expect(result.message).toBeTruthy()
  })

  it('returns fallback on empty input', () => {
    const result = parseLLMJson('')
    expect(result._parseError).toBe(true)
  })

  it('handles nested JSON objects', () => {
    const result = parseLLMJson('{"message": "hi", "nested": {"key": "val"}}')
    expect(result.message).toBe('hi')
    expect(result.nested.key).toBe('val')
  })

  it('handles JSON with extra whitespace', () => {
    const result = parseLLMJson('  \n\n  {"message": "spaced"}\n\n  ')
    expect(result.message).toBe('spaced')
  })
})
