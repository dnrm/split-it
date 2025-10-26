# SplitSphere

An AI-powered expense-sharing application that simplifies group payments through natural language input and automated settlement optimization.

## Features

- **AI Expense Parsing**: Describe expenses naturally (e.g., "I paid $45 for dinner for everyone") and let AI extract the details
- **Smart Settlements**: Optimized payment plans that minimize the number of transactions
- **Automated Transfers**: Execute settlements automatically via Capital One API integration
- **Group Management**: Create and manage expense groups with friends, family, or colleagues
- **Real-time Balances**: Automatically calculated balances showing who owes whom
- **AI Summaries**: Generate intelligent summaries of group expenses with different tones
- **Mobile-First Design**: Fully responsive design optimized for mobile devices
- **Secure Authentication**: Email/password and magic link authentication via Supabase

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Auth)
- **AI**: Google Gemini API for natural language processing and summaries
- **Hosting**: Vercel (recommended)

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account ([supabase.com](https://supabase.com))
- A Google Gemini API key ([ai.google.dev](https://ai.google.dev))

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd splitit
```

### 2. Install Dependencies

```bash
yarn install
# or
npm install
```

### 3. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API to get your:
   - Project URL
   - Anon/Public key
3. Go to SQL Editor and run the schema from `supabase-schema.sql`
4. This will create all necessary tables, indexes, RLS policies, and triggers

### 4. Get Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key for the next step

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Capital One API Configuration (for Settle Transactions feature)
CAPITAL_ONE_CLIENT_ID=your_capital_one_client_id
CAPITAL_ONE_CLIENT_SECRET=your_capital_one_client_secret
CAPITAL_ONE_API_BASE_URL=https://api.capitalone.com
```

**Important**: Never commit `.env.local` to version control. It's already in `.gitignore`.

### 6. Run the Development Server

```bash
yarn dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

The application uses the following main tables:

- `users` - User profiles (synced with Supabase auth)
- `groups` - Expense groups
- `group_members` - Group membership
- `expenses` - Individual expenses
- `expense_splits` - How expenses are split among members

All tables have Row Level Security (RLS) enabled for secure data access.

## Usage Guide

### Creating a Group

1. Sign up or log in
2. Click "Create Group" from the dashboard
3. Enter a group name and select currency
4. Add members by their email address

### Adding Expenses

1. Navigate to your group
2. Use natural language to describe the expense:
   - "I paid $45 for dinner for everyone"
   - "Dani paid $60 for gas for Ana and Franco"
3. Review the AI-parsed details
4. Confirm and save

### Viewing Balances

1. Go to the "Balances" tab in your group
2. See net balances for all members
3. View optimized settlement instructions
4. Copy payment amounts easily

### Generating Summaries

1. Go to the "Summary" tab
2. Choose a tone (Formal, Casual, or Sarcastic)
3. AI will generate an intelligent summary of spending

### Settling Transactions (Capital One Integration)

1. Click "Settle Transactions" button in the group header
2. Review the optimized settlement plan and insights
3. Connect your Capital One account if you haven't already
4. Ensure all involved users have connected their accounts
5. Click "Confirm & Execute Transfers" to process payments automatically
6. Transfers are executed via Capital One API (1-3 business days)

## Project Structure

```
/app
  /api              # Next.js API routes
    /capital-one    # Capital One API integration
  /auth             # Authentication pages
  /dashboard        # Main application pages
    /groups/[id]
      /settle       # Settle transactions page
/components
  /ui               # Shadcn/ui components
  /expenses         # Expense-related components
  /groups           # Group management components
  /balances         # Balance display components
  /summaries        # AI summary components
  /settlements      # Settlement and transfer components
  /capital-one      # Capital One account connection
/lib
  /ai               # Gemini AI integration
  /supabase         # Supabase client setup
  /capital-one      # Capital One API client
  /utils            # Utility functions (balance calculator, settlement optimizer)
/types              # TypeScript type definitions
```

## Key Algorithms

### Balance Calculator

Calculates net balances by:

1. Summing total paid per user
2. Summing total owed per user
3. Computing net balance (paid - owed)

### Settlement Optimizer

Minimizes transactions using a greedy algorithm:

1. Separate creditors (owed money) and debtors (owe money)
2. Match largest creditor with largest debtor
3. Settle the minimum of both amounts
4. Repeat until all balanced

This typically reduces N\*(N-1) potential transactions to just a few payments.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy

### Important Notes

- Ensure all environment variables are set in production
- Update Supabase URL callbacks to include your production domain
- Consider setting up a production Supabase project separate from development

## Environment Variables Reference

| Variable                        | Description                   | Required   |
| ------------------------------- | ----------------------------- | ---------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL     | Yes        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key   | Yes        |
| `GEMINI_API_KEY`                | Google Gemini API key         | Yes        |
| `CAPITAL_ONE_CLIENT_ID`         | Capital One API client ID     | Optional\* |
| `CAPITAL_ONE_CLIENT_SECRET`     | Capital One API client secret | Optional\* |
| `CAPITAL_ONE_API_BASE_URL`      | Capital One API base URL      | Optional\* |

\*Required only if using the Settle Transactions feature

## Troubleshooting

### "Failed to parse expense"

- Ensure your Gemini API key is correctly set
- Check that you have API quota remaining
- Try being more specific in your expense description

### Database errors

- Verify your Supabase credentials are correct
- Ensure the schema has been properly applied
- Check RLS policies are enabled

### Authentication issues

- Clear browser cookies and try again
- Verify Supabase URL and anon key
- Check Supabase Auth settings

## Future Enhancements

- Voice input for expense entry
- Receipt scanning with OCR
- Multi-currency support with live conversion
- Additional payment platform integrations (Venmo, PayPal, Zelle)
- WhatsApp/Telegram bot for expense tracking
- Enhanced expense analytics and charts
- Recurring expense support
- Transaction history and audit logs

## Contributing

This is a hackathon project. Feel free to fork and modify as needed.

## License

MIT

## Built With

Built for a hackathon using cutting-edge AI and modern web technologies.

---

For more information, see the [PRD document](./docs/SplitSphere_PRD.md).
