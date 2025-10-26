import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      groupId,
      amount,
      description,
      payerId,
      participants,
      category,
      rawInput,
    } = body;

    console.log("Creating expense with data:", {
      groupId,
      amount,
      description,
      payerId,
      participants,
      category,
      rawInput,
    });

    if (
      !groupId ||
      !amount ||
      !description ||
      !payerId ||
      !participants ||
      participants.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create expense
    const { data: expense, error: expenseError } = await supabase
      .from("expenses")
      .insert({
        group_id: groupId,
        amount,
        description,
        payer_id: payerId,
        category,
        raw_input: rawInput,
      })
      .select()
      .single();

    if (expenseError) {
      console.error("Error creating expense:", expenseError);
      return NextResponse.json(
        { error: expenseError.message },
        { status: 500 }
      );
    }

    // Calculate split amount (equal split)
    const splitAmount = amount / participants.length;

    // Create expense splits
    const splits = participants.map((participantId: string) => ({
      expense_id: expense.id,
      user_id: participantId,
      amount: splitAmount,
    }));

    console.log("Creating splits:", splits);

    const { error: splitsError } = await supabase
      .from("expense_splits")
      .insert(splits);

    if (splitsError) {
      console.error("Error creating splits:", splitsError);
      console.error("Splits data that failed:", splits);
      // Try to rollback expense
      await supabase.from("expenses").delete().eq("id", expense.id);
      return NextResponse.json(
        { error: `Failed to create splits: ${splitsError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ expense, success: true });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId is required" },
        { status: 400 }
      );
    }

    const { data: expenses, error } = await supabase
      .from("expenses")
      .select(
        `
        *,
        payer:users!expenses_payer_id_fkey(*),
        splits:expense_splits(
          *,
          user:users(*)
        )
      `
      )
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching expenses:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ expenses, success: true });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}
