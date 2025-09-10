-- Create trigger for automatic expense splits creation (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'create_expense_splits_trigger') THEN
        CREATE TRIGGER create_expense_splits_trigger
          AFTER INSERT ON public.expenses
          FOR EACH ROW EXECUTE FUNCTION public.create_expense_splits();
    END IF;
END $$;

-- Create trigger for updating expense splits when amount changes (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_expense_splits_trigger') THEN
        CREATE TRIGGER update_expense_splits_trigger
          AFTER UPDATE ON public.expenses
          FOR EACH ROW EXECUTE FUNCTION public.update_expense_splits();
    END IF;
END $$;

-- Create triggers for automatic updated_at timestamp updates (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_expenses_updated_at') THEN
        CREATE TRIGGER update_expenses_updated_at
          BEFORE UPDATE ON public.expenses
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at
          BEFORE UPDATE ON public.profiles
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_repayments_updated_at') THEN
        CREATE TRIGGER update_repayments_updated_at
          BEFORE UPDATE ON public.repayments
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;