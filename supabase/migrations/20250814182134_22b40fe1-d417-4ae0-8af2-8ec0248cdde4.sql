-- Fix search path security issues
CREATE OR REPLACE FUNCTION public.create_expense_splits()
RETURNS TRIGGER AS $$
DECLARE
  split_amount DECIMAL(10,2);
  profile_record RECORD;
BEGIN
  -- Calculate split amount (divided by 3 for the roommates)
  split_amount := NEW.amount / 3.0;
  
  -- Create splits for all users
  FOR profile_record IN 
    SELECT id FROM public.profiles 
  LOOP
    INSERT INTO public.expense_splits (expense_id, user_id, amount)
    VALUES (NEW.id, profile_record.id, split_amount);
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Enable RLS on expense_categories table
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for expense categories (read-only for authenticated users)
CREATE POLICY "Expense categories are viewable by authenticated users" 
ON public.expense_categories 
FOR SELECT 
TO authenticated
USING (true);