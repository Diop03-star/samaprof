"use client";

import { useActionState } from "react";
import type { OnboardingState } from "./actions";
import { Steps } from "@/components/onboarding/steps";
import { AiThinking } from "@/components/ui/ai-thinking";
import { AiError } from "@/components/ui/ai-error";

type ServerAction = (
  state: OnboardingState,
  formData: FormData
) => Promise<OnboardingState>;

export function Form({
  action,
  initial,
}: {
  action: ServerAction;
  initial: OnboardingState;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex w-full flex-col items-center">
      {pending ? (
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
           <div className="w-16 h-16 rounded-full bg-tertiary/10 flex items-center justify-center relative">
              <div className="absolute inset-0 border-4 border-tertiary/30 rounded-full animate-ping" />
              <span className="text-2xl">✨</span>
           </div>
           <AiThinking label="L'IA SamaProf conçoit votre parcours sur mesure..." />
        </div>
      ) : (
        <Steps pending={pending} />
      )}
      {state.error && !pending && (
        <div className="mt-6 w-full max-w-lg">
          <AiError message={state.error} />
        </div>
      )}
    </form>
  );
}
