import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase en `service_role`. Il contourne la RLS : il ne doit être
 * atteint que depuis un script d'administration (seed, migrations, webhooks),
 * jamais depuis une page ni une Server Component.
 *
 * Il vit dans son propre module, et non à côté de `lib/supabase/server.ts`,
 * pour que ce soit l'import lui-même qui interdise le contournement de la RLS,
 * plutôt qu'un commentaire.
 */
export function createServiceClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquant : impossible de créer le client admin."
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
