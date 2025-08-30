import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  user_id: string;
}

interface UserBalance {
  name: string;
  paid: number;
  owes: number;
  balance: number;
  repaymentsMade?: number;
  repaymentsReceived?: number;
}

interface RepaymentFormProps {
  profiles: Profile[];
  currentUserId?: string;
  userBalance?: UserBalance;
  onRepaymentAdded?: () => void;
}

export const RepaymentForm = ({ profiles, currentUserId, userBalance, onRepaymentAdded }: RepaymentFormProps) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserProfile = profiles.find(p => p.user_id === currentUserId);
  const maxSettlement = userBalance?.balance < 0 ? Math.abs(userBalance.balance) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUserProfile) {
      toast.error("You must be logged in to add a repayment");
      return;
    }

    if (!amount) {
      toast.error("Please enter an amount");
      return;
    }

    const settlementAmount = parseFloat(amount);
    if (settlementAmount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (settlementAmount > maxSettlement) {
      toast.error(`Amount cannot exceed your debt of ${maxSettlement.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('repayments')
        .insert({
          from_user_id: currentUserProfile.id,
          to_user_id: currentUserProfile.id, // Settlement to self
          amount: settlementAmount,
          description: description.trim() || 'Debt settlement',
        });

      if (error) throw error;

      toast.success("Debt settlement recorded successfully!");
      setAmount("");
      setDescription("");
      setOpen(false);
      onRepaymentAdded?.();
    } catch (error) {
      console.error('Error adding repayment:', error);
      toast.error("Failed to record settlement");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show if user has debt to settle
  if (!userBalance || userBalance.balance >= 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <DollarSign className="h-4 w-4" />
          Settle Debt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settle Your Debt</DialogTitle>
          <p className="text-sm text-muted-foreground">
            You owe: {maxSettlement.toFixed(2)} AED
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Settlement Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={maxSettlement}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Maximum: {maxSettlement.toFixed(2)} AED
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a note about this settlement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Recording..." : "Settle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};