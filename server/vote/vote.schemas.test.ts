import { describe, expect, it } from 'vitest';
import { castVoteSchema } from './vote.schemas';
import { EUROVISION_POINTS } from '@/lib/types';

describe('castVoteSchema', () => {
  it('accepts a valid ballot with allowed Eurovision points', () => {
    const result = castVoteSchema.safeParse({
      allocations: [
        { itemId: 'a', points: 12 },
        { itemId: 'b', points: 10 },
        { itemId: 'c', points: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects unsupported point values', () => {
    const result = castVoteSchema.safeParse({
      allocations: [{ itemId: 'a', points: 9 }], // 9 is not in the ladder
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty ballots', () => {
    const result = castVoteSchema.safeParse({ allocations: [] });
    expect(result.success).toBe(false);
  });

  it('caps ballot size at the point-ladder length', () => {
    const tooMany = [...EUROVISION_POINTS, 12].map((p, i) => ({
      itemId: `i${i}`,
      points: p,
    }));
    const result = castVoteSchema.safeParse({ allocations: tooMany });
    expect(result.success).toBe(false);
  });

  it('accepts a fractional voter name', () => {
    const result = castVoteSchema.safeParse({
      voterName: 'Alice',
      allocations: [{ itemId: 'a', points: 12 }],
    });
    expect(result.success).toBe(true);
  });
});
