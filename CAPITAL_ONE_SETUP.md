# Capital One API Setup Guide

This guide will help you set up the Capital One API integration for the Settle Transactions feature.

## Prerequisites

- A Capital One Developer account
- Access to the Capital One DevExchange API sandbox

## Step 1: Register for Capital One DevExchange

1. Go to [Capital One DevExchange](https://developer.capitalone.com/)
2. Click "Sign Up" or "Get Started"
3. Create an account or sign in with your existing credentials
4. Complete your profile information

## Step 2: Create an Application

1. Navigate to the [Applications Dashboard](https://developer.capitalone.com/platform-documentation/)
2. Click "Create New Application"
3. Fill in the application details:
   - **Application Name**: SplitSphere (or your preferred name)
   - **Description**: Expense splitting app with automated settlements
   - **APIs**: Select the following APIs:
     - Account Management API
     - Transfer API
4. Submit your application

## Step 3: Get Your API Credentials

Once your application is approved:

1. Go to your application details
2. Copy the following credentials:
   - **Client ID**: Your application's unique identifier
   - **Client Secret**: Your application's secret key (keep this secure!)
3. Note the API Base URL (usually `https://api.capitalone.com`)

## Step 4: Configure Environment Variables

Add the following to your `.env.local` file:

```env
CAPITAL_ONE_CLIENT_ID=your_client_id_here
CAPITAL_ONE_CLIENT_SECRET=your_client_secret_here
CAPITAL_ONE_API_BASE_URL=https://api.capitalone.com
```

**Important**: Never commit these credentials to version control!

## Step 5: Update Database Schema

Run the SQL migration to add Capital One support:

```bash
# In your Supabase SQL Editor, run:
cat update-capital-one-schema.sql
```

This will:

- Add `capital_one_account_id` column to the `users` table
- Create the `transactions` table for tracking transfers
- Set up necessary indexes and RLS policies

## Step 6: Test the Integration

### For Development/Testing

Capital One provides a sandbox environment for testing:

1. Use test account IDs from the [Capital One Sandbox Documentation](https://developer.capitalone.com/)
2. Test accounts won't perform real transfers
3. You can simulate different scenarios and responses

### Connecting User Accounts

Users need to connect their Capital One accounts to use this feature:

1. Navigate to a group in your app
2. Click "Settle Transactions"
3. Click "Connect Capital One" button
4. Enter your Capital One Account ID
5. The system will save this for future settlements

### Testing Transfers

1. Create a group with multiple members
2. Add some expenses
3. Go to the group page and click "Settle Transactions"
4. Ensure all involved users have connected their Capital One accounts
5. Review the settlement plan
6. Click "Confirm & Execute Transfers"
7. Check the transaction status in the database

## API Endpoints Used

### Account Management

- `GET /accounts` - Get all accounts
- `GET /accounts/{id}` - Get specific account details
- `GET /customers/{id}/accounts` - Get accounts by customer

### Transfers

- `GET /accounts/{id}/transfers` - Get all transfers for an account
- `POST /accounts/{id}/transfers` - Create a new transfer
- `GET /transfers/{transferId}` - Get transfer status
- `PUT /transfers/{transferId}` - Update a transfer

## Rate Limits

Capital One API has rate limits:

- Sandbox: 1000 requests per hour
- Production: Contact Capital One for your specific limits

## Error Handling

The integration includes comprehensive error handling for:

- Missing account connections
- Invalid account IDs
- API failures
- Network issues
- Insufficient funds

## Security Considerations

1. **Never expose API credentials**: Keep them in environment variables only
2. **Validate all inputs**: The API routes validate user permissions and data
3. **RLS Policies**: Database access is protected by Row Level Security
4. **Secure transfers**: All transfers are authenticated and authorized
5. **Audit trail**: The `transactions` table tracks all transfer attempts

## Troubleshooting

### "Capital One credentials not configured"

- Ensure all three environment variables are set
- Restart your development server after adding them

### "No Capital One account connected"

- Users must connect their accounts through the UI
- Check the `users` table for `capital_one_account_id` values

### "Failed to create transfer"

- Verify the account IDs are valid
- Check Capital One API status
- Review API rate limits
- Ensure sufficient account balance (in production)

### Database errors

- Verify the schema migration ran successfully
- Check RLS policies are properly configured
- Ensure users are group members

## Production Deployment

Before going to production:

1. **Apply for Production Access**: Contact Capital One to move from sandbox to production
2. **Update API URL**: Change `CAPITAL_ONE_API_BASE_URL` to production endpoint
3. **Rotate Credentials**: Get production API credentials
4. **Test Thoroughly**: Test with small amounts first
5. **Monitor Transfers**: Set up logging and monitoring
6. **Implement Webhooks**: Consider Capital One webhooks for real-time updates
7. **User Verification**: Implement additional identity verification for production

## Support and Resources

- [Capital One Developer Portal](https://developer.capitalone.com/)
- [API Documentation](https://developer.capitalone.com/platform-documentation/)
- [Capital One DevExchange Community](https://community.capitalone.com/)
- [API Status Page](https://status.capitalone.com/)

## Compliance and Legal

- Ensure compliance with Capital One's Terms of Service
- Implement proper data protection measures
- Follow financial regulations in your jurisdiction
- Consider PCI compliance requirements for production use

---

For more information about the SplitSphere app, see the [main README](./README.md).
