-- Lets signed-in users read their own profile row and change only display_name and
-- theme_preference through Supabase's Data API, using their own access token.
-- Skipped, leaving the tables locked, where Supabase's auth helpers or roles do not
-- exist (shadow databases, plain local Postgres).

DO $guard$
BEGIN
  IF to_regprocedure('auth.uid()') IS NULL
     OR to_regprocedure('auth.jwt()') IS NULL
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
     OR to_regclass('public.users') IS NULL THEN
    RAISE NOTICE 'Supabase auth helpers, roles or public.users missing: skipping users RLS policies';
    RETURN;
  END IF;

  EXECUTE $sql$
    -- Helpers live in a schema the Data API does not expose.
    CREATE SCHEMA IF NOT EXISTS private;
    GRANT USAGE ON SCHEMA private TO authenticated;

    -- The one issuer our policies trust. Change it here, in a new migration.
    CREATE OR REPLACE FUNCTION private.trusted_issuer() RETURNS text
      LANGUAGE sql IMMUTABLE AS $f$ SELECT 'https://leadslookup.vercel.app'::text $f$;
    REVOKE ALL ON FUNCTION private.trusted_issuer() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION private.trusted_issuer() TO authenticated;

    -- Prisma maintains updated_at for its own writes; this covers Data API writes.
    CREATE OR REPLACE FUNCTION private.set_updated_at() RETURNS trigger
      LANGUAGE plpgsql AS $t$ BEGIN NEW.updated_at := now(); RETURN NEW; END $t$;
    DROP TRIGGER IF EXISTS users_set_updated_at ON public.users;
    CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON public.users
      FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

    -- Clients can bypass application validation, so the database enforces it too.
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_display_name_length;
    ALTER TABLE public.users ADD CONSTRAINT users_display_name_length
      CHECK (display_name IS NULL OR char_length(display_name) BETWEEN 1 AND 80);

    -- Column-level grants: no INSERT, no DELETE, no role/status/email changes.
    GRANT SELECT (id, email, display_name, role, status, theme_preference,
                  email_verified_at, created_at, updated_at)
      ON public.users TO authenticated;
    GRANT UPDATE (display_name, theme_preference) ON public.users TO authenticated;

    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS users_select_own ON public.users;
    CREATE POLICY users_select_own ON public.users FOR SELECT TO authenticated
      USING (id = (SELECT auth.uid()));

    DROP POLICY IF EXISTS users_update_own ON public.users;
    CREATE POLICY users_update_own ON public.users FOR UPDATE TO authenticated
      USING (id = (SELECT auth.uid()))
      WITH CHECK (id = (SELECT auth.uid()));

    -- Defence in depth: only tokens from our issuer count, whatever else is trusted.
    DROP POLICY IF EXISTS users_trusted_issuer ON public.users;
    CREATE POLICY users_trusted_issuer ON public.users AS RESTRICTIVE FOR ALL TO authenticated
      USING ((SELECT auth.jwt() ->> 'iss') = private.trusted_issuer());
  $sql$;
END
$guard$;