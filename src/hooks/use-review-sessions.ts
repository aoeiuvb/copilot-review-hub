import useSWR from 'swr';

export type ReviewStatus = 'changes_requested' | 'approved' | 'pending';

export interface ReviewSession {
  sessionId: string;
  taskId: string;
  taskTitle: string;
  title: string;
  summary: string;
  details: string;
  status: 'pending' | 'approved' | 'needs_revision';
  feedback?: string;
  createdAt: number;
  updatedAt: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useReviewSessions() {
  const { data, error, mutate, isLoading } = useSWR<{ sessions: ReviewSession[], timestamp: number }>(
    '/api/sessions',
    fetcher,
    {
      refreshInterval: 2000, // Poll every 2 seconds
      refreshWhenHidden: true, // Keep polling when window is backgrounded
    }
  );

  return {
    sessions: data?.sessions || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export async function submitFeedback(sessionId: string, status: 'approved' | 'needs_revision', feedback: string) {
  const response = await fetch(`/api/sessions/${sessionId}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, feedback }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to submit feedback');
  }

  return response.json();
}
