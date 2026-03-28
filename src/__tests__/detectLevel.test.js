import { describe, it, expect } from 'vitest'
import { detectLevel } from '../utils'

describe('detectLevel — 3-level emergency detection', () => {
  // ── L0: Normal messages ──────────────────────────────────────────────────
  it('returns 0 for normal messages', () => {
    expect(detectLevel('I had a good day')).toBe(0)
    expect(detectLevel('Just studying for finals')).toBe(0)
    expect(detectLevel('lol this class is boring')).toBe(0)
    expect(detectLevel('')).toBe(0)
  })

  // ── L1: Emotional distress ───────────────────────────────────────────────
  it('returns 1 for emotional distress keywords', () => {
    expect(detectLevel('I feel really scared right now')).toBe(1)
    expect(detectLevel('im so nervous about tomorrow')).toBe(1)
    expect(detectLevel('feeling anxious about everything')).toBe(1)
    expect(detectLevel('I feel afraid and alone')).toBe(1)
    expect(detectLevel('this makes me uncomfortable')).toBe(1)
  })

  // ── L2: External threat signals ──────────────────────────────────────────
  it('returns 2 for external threat keywords', () => {
    expect(detectLevel('someone is following me')).toBe(2)
    expect(detectLevel('I think someone is watching me')).toBe(2)
    expect(detectLevel('this person wont leave me alone')).toBe(2)
    expect(detectLevel("he won't leave me alone")).toBe(2)
    expect(detectLevel('I feel threatened by this guy')).toBe(2)
  })

  // ── L3: Explicit emergency ───────────────────────────────────────────────
  it('returns 3 for explicit emergency keywords', () => {
    expect(detectLevel('please help me')).toBe(3)
    expect(detectLevel('call 911 now')).toBe(3)
    expect(detectLevel("I'm being attacked")).toBe(3)
    expect(detectLevel('he has a weapon')).toBe(3)
    expect(detectLevel('someone is chasing me')).toBe(3)
    expect(detectLevel("i can't breathe")).toBe(3)
    expect(detectLevel('please call police')).toBe(3)
  })

  // ── Priority: higher level wins ──────────────────────────────────────────
  it('returns highest matching level when multiple levels match', () => {
    // Contains both L1 ("scared") and L3 ("help me")
    expect(detectLevel('im scared please help me')).toBe(3)
    // Contains both L1 ("afraid") and L2 ("following me")
    expect(detectLevel('im afraid someone is following me')).toBe(2)
  })

  // ── Case insensitivity ───────────────────────────────────────────────────
  it('is case-insensitive', () => {
    expect(detectLevel('HELP ME PLEASE')).toBe(3)
    expect(detectLevel('Someone Is Following Me')).toBe(2)
    expect(detectLevel('I AM SO SCARED')).toBe(1)
  })

  // ── Edge cases ───────────────────────────────────────────────────────────
  it('handles whitespace and trimming', () => {
    expect(detectLevel('  help me  ')).toBe(3)
    expect(detectLevel('   ')).toBe(0)
  })
})
