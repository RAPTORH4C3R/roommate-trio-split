import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ExpenseFormProps {
  onExpenseAdded: () => void;
  editingExpense?: {
    id: string;
    description: string;
    amount: number;
    currency: string;
    category_id?: string;
    paid_by: string;
    payment_method?: string;
    expense_date: string;
  } | null;
  onEditComplete?: () => void;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Profile {
  id: string;
  name: string;
}

export const ExpenseForm = ({ onExpenseAdded, editingExpense, onEditComplete }: ExpenseFormProps) => {
  const [isOpen, setIsOpen] = useState(!!editingExpense);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState<Date>();
  const [paidBy, setPaidBy] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [categories, setCategories] = useState<Category[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (editingExpense) {
      setDescription(editingExpense.description);
      setAmount(editingExpense.amount.toString());
      setCurrency(editingExpense.currency);
      setCategoryId(editingExpense.category_id || "");
      setPaidBy(editingExpense.paid_by);
      setPaymentMethod(editingExpense.payment_method || "cash");
      setDate(new Date(editingExpense.expense_date));
      setIsOpen(true);
    }
  }, [editingExpense]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching categories:', error);
    } else {
      setCategories(data || []);
    }
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .order('name');
    
    if (error) {
      console.error('Error fetching profiles:', error);
    } else {
      setProfiles(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !amount || !date) {
      toast({
        title: "Missing Information",
        description: "Please fill in description, amount, and date.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (editingExpense) {
        // Update existing expense
        const { error } = await supabase
          .from('expenses')
          .update({
            description,
            amount: parseFloat(amount),
            currency,
            category_id: categoryId || null,
            paid_by: paidBy || null,
            payment_method: paymentMethod,
            expense_date: format(date, 'yyyy-MM-dd'),
          })
          .eq('id', editingExpense.id);

        if (error) {
          throw error;
        }

        toast({
          title: "Expense Updated",
          description: `${description} has been updated successfully.`,
        });
        
        onEditComplete?.();
      } else {
        // Create new expense
        const { error } = await supabase
          .from('expenses')
          .insert({
            description,
            amount: parseFloat(amount),
            currency,
            category_id: categoryId || null,
            paid_by: paidBy || null,
            payment_method: paymentMethod,
            expense_date: format(date, 'yyyy-MM-dd'),
          });

        if (error) {
          throw error;
        }

        toast({
          title: "Expense Added",
          description: `${description} for ${amount} ${currency} has been recorded.`,
        });
        
        onExpenseAdded();
      }
      // Reset form
      setDescription("");
      setAmount("");
      setCurrency("AED");
      setCategoryId("");
      setDate(undefined);
      setPaidBy("");
      setPaymentMethod("cash");
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error saving expense:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save expense.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (editingExpense && onEditComplete) {
      onEditComplete();
    }
  };

  if (!isOpen && !editingExpense) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-medium"
        size="lg"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add New Expense
      </Button>
    );
  }

  return (
    <Card className="shadow-strong">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {editingExpense ? "Edit Expense" : "Add New Expense"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="What was this expense for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AED">AED</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="paidBy">Paid By</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Who paid for this?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Anonymous/Unknown</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">💵 Cash</SelectItem>
                <SelectItem value="credit_card">💳 Credit Card</SelectItem>
                <SelectItem value="debit_card">💳 Debit Card</SelectItem>
                <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 gradient-primary text-primary-foreground"
            >
              {loading ? (editingExpense ? "Updating..." : "Adding...") : (editingExpense ? "Update Expense" : "Add Expense")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};