"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle, Loader2, Trash2 } from "lucide-react";
import { Settlement } from "@/types";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface ExecuteTransfersButtonProps {
  settlements: Settlement[];
  groupId: string;
  canExecute: boolean;
}

export function ExecuteTransfersButton({
  settlements,
  groupId,
  canExecute,
}: ExecuteTransfersButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<
    "idle" | "executing" | "success" | "error"
  >("idle");

  const handleMarkAsSettled = async () => {
    if (!canExecute) {
      toast.error("Cannot settle group at this time");
      return;
    }

    setLoading(true);
    setExecutionStatus("executing");

    try {
      const supabase = createClient();

      // Mark the group as settled
      const { error } = await supabase
        .from("groups")
        .update({ settled_at: new Date().toISOString() })
        .eq("id", groupId);

      if (error) {
        throw error;
      }

      setExecutionStatus("success");
      toast.success("Group marked as settled!");

      // Show dialog after a brief delay
      setTimeout(() => {
        setShowDeleteDialog(true);
      }, 1500);
    } catch (error) {
      console.error("Error marking group as settled:", error);
      setExecutionStatus("error");
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to mark group as settled"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);

      if (error) {
        throw error;
      }

      toast.success("Group deleted successfully!");
      router.push("/dashboard/groups");
      router.refresh();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete group"
      );
    }
  };

  const handleKeepGroup = () => {
    setShowDeleteDialog(false);
    router.push(`/dashboard/groups/${groupId}`);
    router.refresh();
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          {executionStatus === "success" ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="mx-auto h-16 w-16 text-chart-5" />
              <div>
                <h3 className="text-lg font-semibold">
                  Group Marked as Settled!
                </h3>
                <p className="text-sm text-muted-foreground">
                  All balances have been settled.
                </p>
              </div>
            </div>
          ) : executionStatus === "error" ? (
            <div className="text-center space-y-4">
              <XCircle className="mx-auto h-16 w-16 text-destructive" />
              <div>
                <h3 className="text-lg font-semibold">Settlement Failed</h3>
                <p className="text-sm text-muted-foreground">
                  Please check the error messages and try again.
                </p>
              </div>
              <Button
                onClick={() => setExecutionStatus("idle")}
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={handleMarkAsSettled}
                disabled={!canExecute || loading}
                className="w-full rounded-xl bg-linear-to-b from-primary to-blue-600 text-white hover:from-primary/80 hover:to-primary/50 border border-primary"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Marking as Settled...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Mark Group as Settled
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                This will mark all settlements as complete and the group as
                settled.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Group Settled Successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              All balances in this group have been settled. Would you like to
              delete this group? You can also keep it for future reference.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleKeepGroup}>
              Keep Group
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
