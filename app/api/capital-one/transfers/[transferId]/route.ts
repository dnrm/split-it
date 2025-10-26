import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTransfer } from "@/lib/capital-one/client";

interface RouteContext {
  params: Promise<{ transferId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get transfer ID from params
    const { transferId } = await context.params;

    if (!transferId) {
      return NextResponse.json(
        { error: "Transfer ID is required" },
        { status: 400 }
      );
    }

    // Find transaction in database
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .select("*, groups!inner(id)")
      .eq("transfer_id", transferId)
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if user is involved in this transaction or is a member of the group
    const { data: membership } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", transaction.group_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized to view this transaction" },
        { status: 403 }
      );
    }

    try {
      // Get transfer status from Capital One
      const transfer = await getTransfer(transferId);

      // Update transaction status if different
      if (transfer.status !== transaction.status) {
        await supabase
          .from("transactions")
          .update({ status: transfer.status })
          .eq("id", transaction.id);
      }

      return NextResponse.json({
        transaction: {
          ...transaction,
          status: transfer.status,
        },
        transfer,
      });
    } catch (capitalOneError) {
      console.error("Error fetching from Capital One:", capitalOneError);
      // Return database record even if Capital One API fails
      return NextResponse.json({
        transaction,
        error: "Could not fetch latest status from Capital One",
      });
    }
  } catch (error) {
    console.error("Error in transfer status route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
