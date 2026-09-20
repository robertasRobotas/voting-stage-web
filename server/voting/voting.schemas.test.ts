import { describe, expect, it } from 'vitest';
import {
  createVotingSchema,
  itemInputSchema,
  reorderItemsSchema,
  updateItemSchema,
  updateSettingsSchema,
} from './voting.schemas';

describe('createVotingSchema', () => {
  it('accepts a minimal valid board (LINK access)', () => {
    const r = createVotingSchema.safeParse({
      title: 'Best lunch spot',
      items: [{ title: 'A' }, { title: 'B' }],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.access).toBe('LINK');
  });

  it('rejects boards with fewer than 2 items', () => {
    const r = createVotingSchema.safeParse({
      title: 't',
      items: [{ title: 'only one' }],
    });
    expect(r.success).toBe(false);
  });

  it('rejects malformed invited emails', () => {
    const r = createVotingSchema.safeParse({
      title: 't',
      access: 'INVITE_ONLY',
      invitedEmails: ['not-an-email'],
      items: [{ title: 'A' }, { title: 'B' }],
    });
    expect(r.success).toBe(false);
  });
});

describe('itemInputSchema', () => {
  it('coerces empty imageUrl to undefined', () => {
    const r = itemInputSchema.safeParse({ title: 'A', imageUrl: '' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.imageUrl).toBeUndefined();
  });

  it('rejects non-http(s) image URLs', () => {
    const r = itemInputSchema.safeParse({
      title: 'A',
      imageUrl: 'javascript:alert(1)',
    });
    expect(r.success).toBe(false);
  });

  it('accepts an https image URL', () => {
    const r = itemInputSchema.safeParse({
      title: 'A',
      imageUrl: 'https://example.com/pic.jpg',
    });
    expect(r.success).toBe(true);
  });
});

describe('updateItemSchema', () => {
  it('keeps empty imageUrl as empty string so the service can clear it', () => {
    const r = updateItemSchema.safeParse({ imageUrl: '' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.imageUrl).toBe('');
  });

  it('treats an absent imageUrl as "leave unchanged"', () => {
    const r = updateItemSchema.safeParse({ title: 'New title' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.imageUrl).toBeUndefined();
  });

  it('still rejects non-http(s) image URLs', () => {
    const r = updateItemSchema.safeParse({ imageUrl: 'javascript:alert(1)' });
    expect(r.success).toBe(false);
  });

  it('accepts a valid https image URL', () => {
    const r = updateItemSchema.safeParse({ imageUrl: 'https://example.com/pic.jpg' });
    expect(r.success).toBe(true);
  });
});

describe('reorderItemsSchema', () => {
  it('requires a non-empty list', () => {
    const r = reorderItemsSchema.safeParse({ itemIds: [] });
    expect(r.success).toBe(false);
  });
});

describe('updateSettingsSchema', () => {
  it('all fields optional', () => {
    const r = updateSettingsSchema.safeParse({});
    expect(r.success).toBe(true);
  });
});
