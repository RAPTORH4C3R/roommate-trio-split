-- Create repayments table
CREATE TABLE public.repayments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES public.profiles(id),
  to_user_id UUID NOT NULL REFERENCES public.profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  repayment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT repayments_different_users CHECK (from_user_id != to_user_id)
);

-- Enable Row Level Security
ALTER TABLE public.repayments ENABLE ROW LEVEL SECURITY;

-- Create policies for repayments
CREATE POLICY "Repayments are viewable by authenticated users" 
ON public.repayments 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert repayments" 
ON public.repayments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update repayments they created" 
ON public.repayments 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = repayments.from_user_id 
  AND profiles.user_id = auth.uid()
));

CREATE POLICY "Users can delete repayments they created" 
ON public.repayments 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = repayments.from_user_id 
  AND profiles.user_id = auth.uid()
));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_repayments_updated_at
BEFORE UPDATE ON public.repayments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();