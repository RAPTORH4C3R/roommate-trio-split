-- Remove the constraint that prevents self-settlements
ALTER TABLE public.repayments DROP CONSTRAINT repayments_different_users;