# Supabase Setup for First Million

This guide provides instructions for setting up Supabase authentication and database for the First Million financial app.

## Prerequisites

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new Supabase project

## Environment Variables

1. Create a `.env` file in the `client` directory with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Replace `your_supabase_url` with your Supabase project URL (found in Project Settings > API)
3. Replace `your_supabase_anon_key` with your Supabase anon/public key (found in Project Settings > API)

## Database Setup

1. Go to the SQL Editor in your Supabase project
2. Run the SQL commands in `client/src/supabase-schema.sql` to create the required tables and policies

## Authentication Setup

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure your auth settings:
   - Enable Email auth provider
   - Configure email templates (optional)
   - Set redirect URLs for email confirmations

## Row Level Security (RLS)

The SQL schema includes Row Level Security policies that:
- Only allow users to see their own data
- Only allow users to modify their own data
- Protect data from unauthorized access

## Testing the Setup

1. After running the app, create a new account during the onboarding process
2. Verify that the user appears in the Supabase Authentication tab
3. Verify that user data is synchronized to the Supabase database tables
4. Test signing in on another device to confirm data synchronization

## Troubleshooting

If you encounter issues with authentication or data synchronization:

1. Check your Supabase URL and API keys
2. Verify that RLS policies are correctly configured
3. Check the browser console for errors
4. Verify that table structures match the expected formats

## Data Migration

To migrate existing local data to Supabase:

1. Sign in to your account
2. The app will automatically sync local data to Supabase
3. If needed, you can manually trigger synchronization by signing out and signing back in 