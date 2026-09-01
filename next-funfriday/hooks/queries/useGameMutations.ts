import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export const useMythVote = () => {
    return useMutation({
        mutationFn: (vote: 'True' | 'False') => apiClient.post('/api/myth/vote', { vote }),
        onSuccess: () => {
            toast.success('Vote recorded!');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to submit vote');
        }
    });
};

export const useLogoVote = () => {
    return useMutation({
        mutationFn: (vote: string) => apiClient.post('/api/logo/vote', { vote }),
        onSuccess: () => {
            toast.success('Vote recorded!');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to submit vote');
        }
    });
};

export const useConnectionSubmit = () => {
    return useMutation({
        mutationFn: (words: string[]) => apiClient.post('/api/connection/submit', { words }),
        onSuccess: (res: { matched: boolean; category?: string; oneAway?: boolean }) => {
            if (res.matched) {
                toast.success(`🎉 Group solved: ${res.category}! (+25 pts)`);
            } else if (res.oneAway) {
                toast.warning('💡 One away! (3 of 4 match a category)');
            } else {
                toast.error('❌ Not quite, try another combination.');
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Submission failed.');
        }
    });
};

export const useAuctionReason = () => {
    return useMutation({
        mutationFn: ({ itemId, reason }: { itemId: number; reason: string }) => apiClient.post('/api/auction/reason', { itemId, reason }),
        onSuccess: () => {
            toast.success('Reason saved automatically');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to save reason');
        }
    });
};
