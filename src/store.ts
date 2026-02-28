import { EventEmitter } from 'events';
import type { ReviewRequest, ReviewStatus, Settings } from './types.js';

class ReviewStore extends EventEmitter {
  private reviews: Map<string, ReviewRequest> = new Map();
  private settings: Settings = {
    autoApprove: false,
    autoApproveDelay: 0,
    notificationsEnabled: true,
  };

  // Review CRUD

  addReview(review: ReviewRequest): void {
    this.reviews.set(review.id, review);
    this.emit('review_created', review);
  }

  getReview(id: string): ReviewRequest | undefined {
    return this.reviews.get(id);
  }

  listReviews(): ReviewRequest[] {
    return Array.from(this.reviews.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  updateStatus(
    id: string,
    status: ReviewStatus,
    comments?: string
  ): ReviewRequest | undefined {
    const review = this.reviews.get(id);
    if (!review) return undefined;
    const updated: ReviewRequest = {
      ...review,
      status,
      comments: comments ?? review.comments,
      resolvedAt: new Date().toISOString(),
    };
    this.reviews.set(id, updated);
    this.emit('review_updated', updated);
    return updated;
  }

  deleteReview(id: string): boolean {
    const existed = this.reviews.has(id);
    this.reviews.delete(id);
    return existed;
  }

  // Settings

  getSettings(): Settings {
    return { ...this.settings };
  }

  updateSettings(patch: Partial<Settings>): Settings {
    this.settings = { ...this.settings, ...patch };
    this.emit('settings_updated', this.settings);
    return this.getSettings();
  }
}

export const store = new ReviewStore();
