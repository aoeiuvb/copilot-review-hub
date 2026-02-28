/**
 * 审查会话的状态
 */
export type ReviewStatus = 'pending' | 'approved' | 'needs_revision' | 'timeout';

/**
 * 审查会话
 */
export interface ReviewSession {
  sessionId: string;
  taskId: string;
  title?: string;
  summary: string;
  details?: string;
  status: ReviewStatus;
  feedback?: string;
  createdAt: number;
  updatedAt: number;
  agentResolve?: (feedback: string) => void;
}

/**
 * request_review tool 的输入参数
 */
export interface RequestReviewInput {
  taskId: string;
  title?: string;
  summary: string;
  details?: string;
}

/**
 * request_review tool 的返回结果
 */
export interface RequestReviewResult {
  status: ReviewStatus;
  feedback: string;
  sessionId: string;
  reviewerUrl: string;
}
