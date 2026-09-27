import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { submitOnboarding, type OnboardingState } from "./actions";
import { Form } from "./form";
import Link from "next/link";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const initial: OnboardingState = { error: null };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-surface px-6 py-16 relative overflow-hidden">
      
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-tertiary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header / Logo */}
      <div className="absolute top-8 left-8 z-20">
         <Link href="/" className="font-display font-bold text-2xl text-on-surface flex items-center gap-2">
            <span className="text-tertiary">✦</span> SamaProf
         </Link>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        <Form action={submitOnboarding} initial={initial} />
      </div>
    </main>
  );
}
