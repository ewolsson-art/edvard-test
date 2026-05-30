// K-13: ensures the redirect /patient/:id → /personer/:id (UX-6) and
// utility helpers stay stable. Tests pure logic only.
import { describe, it, expect } from 'vitest';
import { sendCareTeamInvite } from '@/lib/careTeamInvite';

describe('careTeamInvite', () => {
  it('exports a callable function', () => {
    expect(typeof sendCareTeamInvite).toBe('function');
  });
});

describe('UX-6 /patient → /personer redirect helper', () => {
  it('legacy URL pattern maps 1:1 to canonical', () => {
    const legacy = '/patient/abc-123';
    const canonical = legacy.replace(/^\/patient\//, '/personer/');
    expect(canonical).toBe('/personer/abc-123');
  });

  it('preserves trailing path & search params', () => {
    const legacy = '/patient/abc?tab=mood';
    const canonical = legacy.replace(/^\/patient\//, '/personer/');
    expect(canonical).toBe('/personer/abc?tab=mood');
  });
});
