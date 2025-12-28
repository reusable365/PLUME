-- Allow more statuses for guest_invites to track integration
ALTER TABLE public.guest_invites DROP CONSTRAINT IF EXISTS guest_invites_status_check;
ALTER TABLE public.guest_invites ADD CONSTRAINT guest_invites_status_check CHECK (status IN ('sent', 'opened', 'answered', 'accepted', 'rejected', 'integrated'));
