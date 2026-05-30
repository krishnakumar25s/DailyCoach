import os
from supabase import create_client, Client, ClientOptions

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables")

def get_supabase() -> Client:
    """Returns a general Supabase client."""
    options = ClientOptions(persist_session=False)
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY, options=options)

def user_client(token: str) -> Client:
    """Returns a Supabase client authenticated with the user's JWT so RLS applies."""
    options = ClientOptions(persist_session=False)
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY, options=options)
    client.postgrest.auth(token)
    return client
