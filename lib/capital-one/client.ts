import { CapitalOneAccount, CapitalOneTransfer } from "@/types";

const CAPITAL_ONE_API_BASE_URL =
  process.env.CAPITAL_ONE_API_BASE_URL || "https://api.capitalone.com";
const CAPITAL_ONE_CLIENT_ID = process.env.CAPITAL_ONE_CLIENT_ID;
const CAPITAL_ONE_CLIENT_SECRET = process.env.CAPITAL_ONE_CLIENT_SECRET;

/**
 * Get authorization header for Capital One API
 */
function getAuthHeader(): string {
  if (!CAPITAL_ONE_CLIENT_ID || !CAPITAL_ONE_CLIENT_SECRET) {
    throw new Error("Capital One credentials not configured");
  }
  const credentials = Buffer.from(
    `${CAPITAL_ONE_CLIENT_ID}:${CAPITAL_ONE_CLIENT_SECRET}`
  ).toString("base64");
  return `Basic ${credentials}`;
}

/**
 * Get all accounts from Capital One
 */
export async function getAccounts(): Promise<CapitalOneAccount[]> {
  try {
    const response = await fetch(`${CAPITAL_ONE_API_BASE_URL}/accounts`, {
      method: "GET",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch accounts: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Capital One accounts:", error);
    throw error;
  }
}

/**
 * Get a specific account by ID
 */
export async function getAccountById(
  accountId: string
): Promise<CapitalOneAccount> {
  try {
    const response = await fetch(
      `${CAPITAL_ONE_API_BASE_URL}/accounts/${accountId}`,
      {
        method: "GET",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch account: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Capital One account:", error);
    throw error;
  }
}

/**
 * Get all transfers for a specific account
 */
export async function getAccountTransfers(
  accountId: string
): Promise<CapitalOneTransfer[]> {
  try {
    const response = await fetch(
      `${CAPITAL_ONE_API_BASE_URL}/accounts/${accountId}/transfers`,
      {
        method: "GET",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch transfers: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Capital One transfers:", error);
    throw error;
  }
}

/**
 * Create a transfer between accounts
 */
export async function createTransfer(
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  description?: string
): Promise<CapitalOneTransfer> {
  try {
    const response = await fetch(
      `${CAPITAL_ONE_API_BASE_URL}/accounts/${fromAccountId}/transfers`,
      {
        method: "POST",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medium: "balance",
          payee_id: toAccountId,
          amount: amount,
          transaction_date: new Date().toISOString(),
          description: description || "Settlement payment",
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to create transfer: ${response.statusText}. ${JSON.stringify(
          errorData
        )}`
      );
    }

    const data = await response.json();
    return {
      transferId: data._id || data.id,
      status: data.status,
      amount: data.amount,
      fromAccountId: fromAccountId,
      toAccountId: toAccountId,
    };
  } catch (error) {
    console.error("Error creating Capital One transfer:", error);
    throw error;
  }
}

/**
 * Get a specific transfer by ID
 */
export async function getTransfer(
  transferId: string
): Promise<CapitalOneTransfer> {
  try {
    const response = await fetch(
      `${CAPITAL_ONE_API_BASE_URL}/transfers/${transferId}`,
      {
        method: "GET",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch transfer: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      transferId: data._id || data.id,
      status: data.status,
      amount: data.amount,
      fromAccountId: data.payer_id,
      toAccountId: data.payee_id,
    };
  } catch (error) {
    console.error("Error fetching Capital One transfer:", error);
    throw error;
  }
}

/**
 * Update a transfer
 */
export async function updateTransfer(
  transferId: string,
  updates: Partial<{ status: string; amount: number }>
): Promise<CapitalOneTransfer> {
  try {
    const response = await fetch(
      `${CAPITAL_ONE_API_BASE_URL}/transfers/${transferId}`,
      {
        method: "PUT",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update transfer: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      transferId: data._id || data.id,
      status: data.status,
      amount: data.amount,
      fromAccountId: data.payer_id,
      toAccountId: data.payee_id,
    };
  } catch (error) {
    console.error("Error updating Capital One transfer:", error);
    throw error;
  }
}
