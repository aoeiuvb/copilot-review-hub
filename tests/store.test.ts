import { store } from '../src/store.js';
import type { ReviewRequest } from '../src/types.js';

function makeReview(overrides: Partial<ReviewRequest> = {}): ReviewRequest {
  return {
    id: 'test-id',
    title: 'Test Review',
    content: 'console.log("hello")',
    language: 'javascript',
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  // Reset store state between tests by deleting all reviews
  for (const r of store.listReviews()) {
    store.deleteReview(r.id);
  }
});

describe('ReviewStore', () => {
  test('addReview and listReviews', () => {
    const review = makeReview({ id: 'r1' });
    store.addReview(review);
    const list = store.listReviews();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('r1');
  });

  test('getReview returns undefined for unknown id', () => {
    expect(store.getReview('nonexistent')).toBeUndefined();
  });

  test('updateStatus changes status and sets resolvedAt', () => {
    const review = makeReview({ id: 'r2' });
    store.addReview(review);
    const updated = store.updateStatus('r2', 'approved', 'LGTM');
    expect(updated).toBeDefined();
    expect(updated!.status).toBe('approved');
    expect(updated!.comments).toBe('LGTM');
    expect(updated!.resolvedAt).toBeDefined();
  });

  test('updateStatus returns undefined for unknown id', () => {
    expect(store.updateStatus('no-such-id', 'approved')).toBeUndefined();
  });

  test('deleteReview removes it', () => {
    const review = makeReview({ id: 'r3' });
    store.addReview(review);
    expect(store.deleteReview('r3')).toBe(true);
    expect(store.getReview('r3')).toBeUndefined();
  });

  test('deleteReview returns false for nonexistent id', () => {
    expect(store.deleteReview('ghost')).toBe(false);
  });

  test('getSettings returns defaults', () => {
    const s = store.getSettings();
    expect(s.autoApprove).toBe(false);
    expect(s.notificationsEnabled).toBe(true);
  });

  test('updateSettings patches settings', () => {
    const s = store.updateSettings({ autoApprove: true, autoApproveDelay: 30 });
    expect(s.autoApprove).toBe(true);
    expect(s.autoApproveDelay).toBe(30);
    // Restore defaults for other tests
    store.updateSettings({ autoApprove: false, autoApproveDelay: 0 });
  });

  test('store emits review_created event', done => {
    const review = makeReview({ id: 'r4' });
    store.once('review_created', (r) => {
      expect(r.id).toBe('r4');
      done();
    });
    store.addReview(review);
  });

  test('store emits review_updated event', done => {
    const review = makeReview({ id: 'r5' });
    store.addReview(review);
    store.once('review_updated', (r) => {
      expect(r.status).toBe('rejected');
      done();
    });
    store.updateStatus('r5', 'rejected', 'Not good');
  });
});
