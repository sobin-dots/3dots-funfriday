import { z } from 'zod';

export const mythVoteSchema = z.object({
    vote: z.enum(['True', 'False'], {
        message: 'Vote must be either "True" or "False"'
    })
});

export const logoVoteSchema = z.object({
    vote: z.string().min(1, 'Vote cannot be empty')
});

export const connectionSubmitSchema = z.object({
    words: z.array(z.string()).length(4, 'Must submit exactly 4 words')
});

export const auctionReasonSchema = z.object({
    itemId: z.number().int().positive('Item ID must be a positive integer'),
    reason: z.string().max(240, 'Reason cannot exceed 240 characters').optional().default('')
});

export type MythVoteInput = z.infer<typeof mythVoteSchema>;
export type LogoVoteInput = z.infer<typeof logoVoteSchema>;
export type ConnectionSubmitInput = z.infer<typeof connectionSubmitSchema>;
export type AuctionReasonInput = z.infer<typeof auctionReasonSchema>;
