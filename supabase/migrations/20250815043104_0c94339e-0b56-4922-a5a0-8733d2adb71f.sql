-- Create trigger to update expense splits when expense amount changes
CREATE OR REPLACE FUNCTION public.update_expense_splits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  split_amount DECIMAL(10,2);
  profile_record RECORD;
BEGIN
  -- Only recalculate if amount changed
  IF OLD.amount != NEW.amount THEN
    -- Calculate new split amount (divided by 3 for the roommates)
    split_amount := NEW.amount / 3.0;
    
    -- Update existing splits for this expense
    UPDATE public.expense_splits 
    SET amount = split_amount
    WHERE expense_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for expense updates
CREATE TRIGGER update_expense_splits_trigger
  AFTER UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_expense_splits();