-- Create user profiles table for the 3 roommates
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create expense categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default categories
INSERT INTO public.expense_categories (name, icon, color) VALUES
('Food', '🍽️', '#FF9800'),
('Groceries', '🛒', '#4CAF50'),
('Gas', '⛽', '#F44336'),
('Utilities', '💡', '#2196F3'),
('Entertainment', '🎬', '#9C27B0'),
('Transport', '🚗', '#607D8B'),
('Other', '📦', '#795548');

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'AED',
  category_id UUID REFERENCES public.expense_categories(id),
  paid_by UUID NOT NULL REFERENCES public.profiles(id),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for expenses
CREATE POLICY "Expenses are viewable by authenticated users" 
ON public.expenses 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert expenses" 
ON public.expenses 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update expenses they created" 
ON public.expenses 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = expenses.paid_by 
  AND profiles.user_id = auth.uid()
));

CREATE POLICY "Users can delete expenses they created" 
ON public.expenses 
FOR DELETE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = expenses.paid_by 
  AND profiles.user_id = auth.uid()
));

-- Create expense splits table (for tracking who owes what)
CREATE TABLE public.expense_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  settled BOOLEAN NOT NULL DEFAULT false,
  settled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

-- Create policies for expense splits
CREATE POLICY "Expense splits are viewable by authenticated users" 
ON public.expense_splits 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert expense splits" 
ON public.expense_splits 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update expense splits" 
ON public.expense_splits 
FOR UPDATE 
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create expense splits
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create splits when expense is added
CREATE TRIGGER create_expense_splits_trigger
  AFTER INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.create_expense_splits();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), 
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();