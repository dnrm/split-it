import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { accountId } = await request.json();

    if (!accountId || typeof accountId !== "string") {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    // Update user's capital_one_account_id
    const { error: updateError } = await supabase
      .from("users")
      .update({ capital_one_account_id: accountId })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating user account:", updateError);
      return NextResponse.json(
        { error: "Failed to connect account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account connected successfully",
    });
  } catch (error) {
    console.error("Error in connect route:", error);
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

    // Get user's capital_one_account_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("capital_one_account_id")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("Error fetching user account:", userError);
      return NextResponse.json(
        { error: "Failed to fetch account info" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accountId: userData?.capital_one_account_id || null,
      connected: !!userData?.capital_one_account_id,
    });
  } catch (error) {
    console.error("Error in connect GET route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
