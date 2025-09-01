import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseCard } from "@/components/ExpenseCard";
import { DashboardStats } from "@/components/DashboardStats";
import { BalanceCard } from "@/components/BalanceCard";
import { RepaymentForm } from "@/components/RepaymentForm";
import { LogOut, Search, Filter, Users, DollarSign, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  } | null;
  paid_by: {
    id: string;
    name: string;
  } | null;
}

interface Profile {
  id: string;
  name: string;
  user_id: string;
}

interface Repayment {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  description?: string;
  repayment_date: string;
  from_user: {
    id: string;
    name: string;
  };
  to_user: {
    id: string;
    name: string;
  };
}

const Index = () => {
  const { user, session, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  // All hooks MUST be called before any early returns
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Early returns AFTER all hooks
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return <Navigate to="/auth" replace />;
  }

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchExpenses(),
        fetchProfiles(),
        fetchCategories(),
        fetchRepayments()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:expense_categories(*),
        paid_by:profiles(id, name)
      `)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch expenses.",
        variant: "destructive",
      });
    } else {
      setExpenses(data || []);
    }
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching profiles:', error);
    } else {
      setProfiles(data || []);
    }
  };

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

  const fetchRepayments = async () => {
    const { data, error } = await supabase
      .from('repayments')
      .select(`
        *,
        from_user:profiles!repayments_from_user_id_fkey(id, name),
        to_user:profiles!repayments_to_user_id_fkey(id, name)
      `)
      .order('repayment_date', { ascending: false });

    if (error) {
      console.error('Error fetching repayments:', error);
    } else {
      setRepayments(data || []);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete expense.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Expense Deleted",
        description: "The expense has been removed.",
      });
      fetchExpenses();
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      category_id: expense.category?.id,
      paid_by: expense.paid_by?.id || '',
      payment_method: (expense as any).payment_method,
      expense_date: expense.expense_date,
    });
  };

  const handleEditComplete = () => {
    setEditingExpense(null);
    fetchExpenses();
  };

  // Calculate stats
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const monthlyExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.expense_date);
    return expenseDate >= monthStart && expenseDate <= monthEnd;
  });
  
  const monthlyTotal = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Calculate user balances including settlements
  const userBalances = profiles.map(profile => {
    const userExpenses = expenses.filter(expense => expense.paid_by?.id === profile.id);
    const totalPaid = userExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalOwed = totalExpenses / 3; // Equal split among 3
    
    // Calculate debt settlements made by this user (self-settlements)
    const settlementsAmount = repayments
      .filter(repayment => repayment.from_user_id === profile.id && repayment.to_user_id === profile.id)
      .reduce((sum, repayment) => sum + repayment.amount, 0);
    
    const balance = totalPaid - totalOwed + settlementsAmount;

    return {
      name: profile.name,
      paid: totalPaid,
      owes: totalOwed,
      balance: balance,
      settlementsAmount
    };
  });

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (expense.paid_by?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || expense.category?.id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Group expenses by month and year
  const currentMonthExpenses = filteredExpenses.filter(expense => {
    const expenseDate = new Date(expense.expense_date);
    return isSameMonth(expenseDate, currentMonth);
  });

  // Group historical expenses by month
  const groupExpensesByMonth = (expenses: Expense[]) => {
    const groups: { [key: string]: { expenses: Expense[], total: number, monthYear: string } } = {};
    
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.expense_date);
      if (!isSameMonth(expenseDate, currentMonth)) { // Exclude current month
        const monthYear = format(expenseDate, 'MMMM yyyy');
        const key = format(expenseDate, 'yyyy-MM');
        
        if (!groups[key]) {
          groups[key] = { expenses: [], total: 0, monthYear };
        }
        groups[key].expenses.push(expense);
        groups[key].total += expense.amount;
      }
    });
    
    // Sort by date descending (most recent first)
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, data]) => ({ key, ...data }));
  };

  const historicalMonths = groupExpensesByMonth(filteredExpenses);

  const currentUserProfile = profiles.find(p => p.user_id === user.id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-soft sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg gradient-primary">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">RoomMate Splitter</h1>
                <p className="text-sm text-muted-foreground">Welcome, {currentUserProfile?.name}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <DashboardStats
          totalExpenses={totalExpenses}
          monthlyTotal={monthlyTotal}
          currency="AED"
          expenseCount={expenses.length}
          userBalances={userBalances}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Expense Form */}
            <ExpenseForm 
              onExpenseAdded={fetchExpenses} 
              editingExpense={editingExpense}
              onEditComplete={handleEditComplete}
            />

            {/* Add Settlement Button */}
            <div className="flex justify-end">
              <RepaymentForm 
                profiles={profiles}
                currentUserId={user.id}
                userBalance={userBalances.find(b => b.name === currentUserProfile?.name)}
                onRepaymentAdded={fetchRepayments}
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
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

            {/* Monthly Expense Tabs */}
            <Tabs defaultValue="current" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Recent Expenses
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Monthly History
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="current" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-foreground">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {currentMonthExpenses.length} expenses • AED {currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
                  </div>
                </div>
                
                {currentMonthExpenses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No expenses this month</p>
                    <p className="text-sm">Add your first expense to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentMonthExpenses.map((expense) => (
                      <ExpenseCard
                        key={expense.id}
                        expense={expense}
                        onDelete={handleDeleteExpense}
                        onEdit={handleEditExpense}
                        canDelete={currentUserProfile?.id === expense.paid_by?.id}
                        canEdit={currentUserProfile?.id === expense.paid_by?.id}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="history" className="space-y-4">
                {historicalMonths.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No historical data</p>
                    <p className="text-sm">Past month expenses will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {historicalMonths.map((monthData) => (
                      <div key={monthData.key} className="border rounded-lg p-4 bg-card">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b">
                          <h4 className="text-lg font-medium text-foreground">{monthData.monthYear}</h4>
                          <div className="text-sm text-muted-foreground">
                            {monthData.expenses.length} expenses • AED {monthData.total.toFixed(2)}
                          </div>
                        </div>
                        <div className="space-y-3">
                          {monthData.expenses.map((expense) => (
                            <ExpenseCard
                              key={expense.id}
                              expense={expense}
                              onDelete={handleDeleteExpense}
                              onEdit={handleEditExpense}
                              canDelete={currentUserProfile?.id === expense.paid_by?.id}
                              canEdit={currentUserProfile?.id === expense.paid_by?.id}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <BalanceCard userBalances={userBalances} currency="AED" repayments={repayments} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
