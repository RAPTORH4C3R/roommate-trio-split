import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, User, CreditCard } from "lucide-react";
import { format } from "date-fns";

interface ExpenseCardProps {
  expense: {
    id: string;
    description: string;
    amount: number;
    currency: string;
    expense_date: string;
    payment_method?: string;
    category: {
      name: string;
      icon: string;
      color: string;
    } | null;
    paid_by: {
      name: string;
    };
  };
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export const ExpenseCard = ({ expense, onDelete, canDelete = false }: ExpenseCardProps) => {
  const handleDelete = () => {
    if (onDelete) {
      onDelete(expense.id);
    }
  };

  const getPaymentMethodDisplay = (method?: string) => {
    switch (method) {
      case 'credit_card': return '💳 Credit Card';
      case 'debit_card': return '💳 Debit Card';
      case 'bank_transfer': return '🏦 Bank Transfer';
      case 'cash':
      default: return '💵 Cash';
    }
  };

  return (
    <Card className="shadow-soft hover:shadow-medium transition-shadow duration-300">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              {expense.category && (
                <span className="text-lg">{expense.category.icon}</span>
              )}
              <h3 className="font-medium text-foreground">{expense.description}</h3>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(expense.expense_date), 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Paid by {expense.paid_by.name}
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                {getPaymentMethodDisplay(expense.payment_method)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {expense.category && (
                  <Badge variant="secondary" style={{ backgroundColor: `${expense.category.color}20`, color: expense.category.color }}>
                    {expense.category.name}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-secondary">
                  {expense.amount.toFixed(2)} {expense.currency}
                </span>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground pt-1 border-t">
              Split equally: {(expense.amount / 3).toFixed(2)} {expense.currency} per person
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};