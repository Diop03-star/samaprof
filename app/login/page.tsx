"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "./actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInError, signInAction, signInPending] = useActionState(signIn, null);
  const [signUpError, signUpAction, signUpPending] = useActionState(signUp, null);

  const action = mode === "signin" ? signInAction : signUpAction;
  const error = mode === "signin" ? signInError : signUpError;
  const pending = mode === "signin" ? signInPending : signUpPending;

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-2xl font-semibold text-white">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Your learning path. Your pace. Your AI coach.
        </p>

        <form action={action} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm text-slate-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm text-slate-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-orange-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white disabled:opacity-60"
          >
            {pending ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-sm text-indigo-400 hover:underline"
        >
          {mode === "signin" ? "No account? Sign up" : "Already registered? Sign in"}
        </button>
      </div>
    </main>
  );
}