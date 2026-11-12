-- Private auth tables: no access through the Supabase Data API.
-- Tables that don't exist yet (e.g. _prisma_migrations in Prisma's shadow database)
-- are skipped. Roles are checked so this also runs on a plain local Postgres.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'user_credentials', 'user_identities', 'auth_sessions',
    'auth_refresh_tokens', 'email_verification_tokens', 'password_reset_tokens',
    '_prisma_migrations'
  ]
  LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', t);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', t);
    END IF;
  END LOOP;
END $$;