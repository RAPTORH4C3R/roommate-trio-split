-- Fix security vulnerability: Restrict financial data access to relevant users only

-- Drop existing overly permissive SELECT policies
DROP POLICY IF EXISTS "Expenses are viewable by authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Expense splits are viewable by authenticated users" ON public.expense_splits;  
DROP POLICY IF EXISTS "Repayments are viewable by authenticated users" ON public.repayments;

-- Create secure SELECT policy for expenses
-- Users can only see expenses they paid for OR expenses they have splits for
CREATE POLICY "Users can view relevant expenses" ON public.expenses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (
      profiles.id = expenses.paid_by 
      OR EXISTS (
        SELECT 1 FROM public.expense_splits 
        WHERE expense_splits.expense_id = expenses.id 
        AND expense_splits.user_id = profiles.id
      )
    )
  )
);

-- Create secure SELECT policy for expense_splits  
-- Users can only see their own splits
CREATE POLICY "Users can view their own expense splits" ON public.expense_splits
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.id = expense_splits.user_id
  )
);

-- Create secure SELECT policy for repayments
-- Users can only see repayments where they are sender or receiver  
CREATE POLICY "Users can view relevant repayments" ON public.repayments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.id = repayments.from_user_id OR profiles.id = repayments.to_user_id)
  )
);