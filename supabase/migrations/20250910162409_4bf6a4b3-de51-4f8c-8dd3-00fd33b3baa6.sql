-- Create trigger for automatic profile creation when users sign up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for automatic expense splits creation
CREATE TRIGGER create_expense_splits_trigger
  AFTER INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.create_expense_splits();

-- Create trigger for updating expense splits when amount changes
CREATE TRIGGER update_expense_splits_trigger
  AFTER UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_expense_splits();

-- Create triggers for automatic updated_at timestamp updates
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repayments_updated_at
  BEFORE UPDATE ON public.repayments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();