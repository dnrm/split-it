import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTransfer } from "@/lib/capital-one/client";
import { Settlement } from "@/types";

interface CreateTransfersRequest {
  groupId: string;
  settlements: Settlement[];
}

interface GroupMemberWithAccount {
  user_id: string;
  name: string;
  email: string;
  capital_one_account_id: string | null;
}

interface UserForTransfer {
  id: string;
  name: string;
  capital_one_account_id: string | null;
}

export async function POST(request: Request) {
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

    // Parse request body
    const { groupId, settlements }: CreateTransfersRequest =
      await request.json();

    if (!groupId || !settlements || !Array.isArray(settlements)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Check if user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Not a member of this group" },
        { status: 403 }
      );
    }

    // Get all unique user IDs from settlements
    const userIds = [
      ...new Set([
        ...settlements.map((s) => s.from),
        ...settlements.map((s) => s.to),
      ]),
    ];

    console.log("User IDs needed for transfers:", userIds);

    // Use service role client to bypass RLS restrictions
    const { createClient: createServiceClient } = await import(
      "@supabase/supabase-js"
    );

    const supabaseServiceRole = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // First verify all users are members of this group (security check)
    const { data: groupMembers, error: membersCheckError } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .in("user_id", userIds);

    if (membersCheckError) {
      console.error("Error verifying group membership:", membersCheckError);
      return NextResponse.json(
        {
          error: `Failed to verify group membership: ${membersCheckError.message}`,
        },
        { status: 500 }
      );
    }

    if (!groupMembers || groupMembers.length !== userIds.length) {
      console.error("Not all users are members of this group");
      return NextResponse.json(
        { error: "Some users are not members of this group" },
        { status: 400 }
      );
    }

    console.log("All users verified as group members");

    // Now fetch user data using service role (bypasses RLS)
    const { data: usersData, error: usersError } = await supabaseServiceRole
      .from("users")
      .select("id, name, capital_one_account_id")
      .in("id", userIds);

    console.log("Users data fetch result:", { usersData, usersError });

    if (usersError) {
      console.error("Error fetching users data:", usersError);
      return NextResponse.json(
        { error: `Failed to fetch user data: ${usersError.message}` },
        { status: 500 }
      );
    }

    if (!usersData || usersData.length === 0) {
      console.error("No user data found");
      return NextResponse.json(
        { error: "No user data found for settlements" },
        { status: 400 }
      );
    }

    const users = usersData.map((u) => ({
      id: u.id,
      name: u.name,
      capital_one_account_id: u.capital_one_account_id,
    }));

    console.log("Final users data:", users);

    // Check if all users have connected Capital One accounts
    const usersMap = new Map<string, UserForTransfer>(
      users?.map((u) => [u.id, u])
    );
    const missingAccounts: string[] = [];

    for (const userId of userIds) {
      const user = usersMap.get(userId);
      if (!user?.capital_one_account_id) {
        missingAccounts.push(user?.name || userId);
      }
    }

    if (missingAccounts.length > 0) {
      return NextResponse.json(
        {
          error: "Some users have not connected their Capital One accounts",
          missingAccounts,
        },
        { status: 400 }
      );
    }

    // Create all transfers
    const results = [];
    const errors = [];

    for (const settlement of settlements) {
      const fromUser = usersMap.get(settlement.from);
      const toUser = usersMap.get(settlement.to);

      if (
        !fromUser?.capital_one_account_id ||
        !toUser?.capital_one_account_id
      ) {
        errors.push({
          settlement,
          error: "Missing account information",
        });
        continue;
      }

      try {
        // Create transfer via Capital One API
        const transfer = await createTransfer(
          fromUser.capital_one_account_id,
          toUser.capital_one_account_id,
          settlement.amount,
          `Settlement: ${fromUser.name} → ${toUser.name}`
        );

        // Save transaction record
        const { data: transaction, error: transactionError } = await supabase
          .from("transactions")
          .insert({
            group_id: groupId,
            settlement_from: settlement.from,
            settlement_to: settlement.to,
            amount: settlement.amount,
            transfer_id: transfer.transferId,
            status: "pending",
          })
          .select()
          .single();

        if (transactionError) {
          console.error("Error saving transaction:", transactionError);
          errors.push({
            settlement,
            error: "Failed to save transaction record",
          });
        } else {
          results.push({
            settlement,
            transfer,
            transaction,
          });
        }
      } catch (transferError) {
        console.error("Error creating transfer:", transferError);
        errors.push({
          settlement,
          error:
            transferError instanceof Error
              ? transferError.message
              : "Failed to create transfer",
        });
      }
    }

    // Return results
    return NextResponse.json({
      success: errors.length === 0,
      results,
      errors,
      summary: {
        total: settlements.length,
        successful: results.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    console.error("Error in transfers route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
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

    // Get group ID from query params
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    // Check if user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Not a member of this group" },
        { status: 403 }
      );
    }

    // Fetch transactions for the group
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Error in transfers GET route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
