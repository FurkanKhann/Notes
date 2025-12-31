from supabase import create_client
import os

# Get credentials from environment variables
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')

# Validate that credentials are set
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError(
        "Supabase credentials not found! "
        "Please set SUPABASE_URL and SUPABASE_KEY environment variables."
    )

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
