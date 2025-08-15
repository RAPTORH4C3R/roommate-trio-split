-- Add payment method to expenses table
ALTER TABLE public.expenses 
ADD COLUMN payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'bank_transfer'));