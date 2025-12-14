from supabase import create_client
import os


SUPABASE_URL = ""
SUPABASE_KEY = ""


supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
