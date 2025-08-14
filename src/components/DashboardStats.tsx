import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Calendar } from "lucide-react";

interface DashboardStatsProps {
  totalExpenses: number;
  monthlyTotal: number;
  currency: string;
  expenseCount: number;
  userBalances: { name: string; paid: number; owes: number }[];
}

export const DashboardStats = ({ 
  totalExpenses, 
  monthlyTotal, 
  currency, 
  expenseCount,
  userBalances 
}: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="shadow-soft hover:shadow-medium transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-secondary">
            {totalExpenses.toFixed(2)} {currency}
          </div>
          <p className="text-xs text-muted-foreground">
            All time spending
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-soft hover:shadow-medium transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <Calendar className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-secondary">
            {monthlyTotal.toFixed(2)} {currency}
          </div>
          <p className="text-xs text-muted-foreground">
            Current month total
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-soft hover:shadow-medium transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-secondary">
            {expenseCount}
          </div>
          <p className="text-xs text-muted-foreground">
            Expense entries
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-soft hover:shadow-medium transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Per Person</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-secondary">
            {(totalExpenses / 3).toFixed(2)} {currency}
          </div>
          <p className="text-xs text-muted-foreground">
            Average share each
          </p>
        </CardContent>
      </Card>
    </div>
  );
};