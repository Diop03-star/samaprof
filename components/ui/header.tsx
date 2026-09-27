import Link from 'next/link';
import { getCurrentUser, createClient } from '@/lib/supabase/server';

export async function Header() {
  const user = await getCurrentUser();
  let profile = null;

  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", user.userId)
      .maybeSingle();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/80 backdrop-blur-xl border-b border-surface-dim shadow-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-display font-extrabold text-on-surface">
            <span className="text-primary text-2xl leading-none">✦</span> SamaProf
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/dashboard" className="flex items-center gap-3 bg-surface-dim/50 px-2 py-1.5 rounded-full border border-surface-dim hover:bg-surface-dim transition-colors group">
              <span className="pl-2 text-sm font-semibold text-secondary group-hover:text-primary transition-colors">
                {profile?.name?.split(" ")[0] || "Tableau de bord"}
              </span>
              <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  (profile?.name?.charAt(0) || "U").toUpperCase()
                )}
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="rounded-full bg-white border border-surface-dim px-5 py-2 text-sm font-bold text-secondary shadow-sm hover:bg-surface transition-colors">
                Connexion
              </Link>
              <Link href="/onboarding" className="hidden sm:inline-block rounded-full bg-primary px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-hover transition-colors">
                S'inscrire
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
