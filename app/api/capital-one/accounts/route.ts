import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccounts, getAccountById } from "@/lib/capital-one/client";

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
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { error: "Failed to fetch user info" },
        { status: 500 }
      );
    }

    // Check if user has connected account
    if (!userData?.capital_one_account_id) {
      return NextResponse.json(
        { error: "No Capital One account connected" },
        { status: 404 }
      );
    }

    // Get account info from Capital One
    try {
      const account = await getAccountById(userData.capital_one_account_id);
      return NextResponse.json({ account });
    } catch (capitalOneError) {
      console.error("Error fetching from Capital One:", capitalOneError);
      return NextResponse.json(
        { error: "Failed to fetch account from Capital One" },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Error in accounts route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
