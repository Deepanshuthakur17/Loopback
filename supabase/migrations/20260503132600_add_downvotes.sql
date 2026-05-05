-- Add vote_type to votes (1 for upvote, -1 for downvote)
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS vote_type INTEGER DEFAULT 1;

-- Ensure vote_type is only 1 or -1
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS valid_vote_type;
ALTER TABLE public.votes ADD CONSTRAINT valid_vote_type CHECK (vote_type IN (1, -1));
