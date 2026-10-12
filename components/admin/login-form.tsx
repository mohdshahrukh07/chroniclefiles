"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  loginAction,
  type LoginState,
} from "@/app/admin-dashboard/actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="username"
          className="block text-sm font-semibold text-[#3e4b43]"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          maxLength={50}
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "login-error" : undefined}
          className="h-12 w-full rounded-md border border-[#dce5df] bg-white px-3 text-base text-[#303a34] outline-none transition-[border-color,box-shadow] placeholder:text-[#9aa39d] focus-visible:border-[#02A95C] focus-visible:ring-3 focus-visible:ring-[#02A95C]/15"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-[#3e4b43]"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={1024}
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "login-error" : undefined}
          className="h-12 w-full rounded-md border border-[#dce5df] bg-white px-3 text-base text-[#303a34] outline-none transition-[border-color,box-shadow] placeholder:text-[#9aa39d] focus-visible:border-[#02A95C] focus-visible:ring-3 focus-visible:ring-[#02A95C]/15"
        />
      </div>

      {state.error ? (
        <p
          id="login-error"
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
        >
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isPending}
        className="h-12 w-full rounded-md bg-[#02A95C] text-base font-bold text-white shadow-sm transition-colors hover:bg-[#078b50] focus-visible:ring-3 focus-visible:ring-[#02A95C]/30"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
