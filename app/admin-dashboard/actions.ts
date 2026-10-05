"use server";

import { redirect } from "next/navigation";
import User from "@/models/user";
import { connectToDatabase } from "@/lib/mongodb";
import {
  clearAdminSession,
  createAdminSession,
} from "@/lib/admin-session";

export interface LoginState {
  error: string | null;
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const usernameValue = formData.get("username");
  const passwordValue = formData.get("password");
  const username =
    typeof usernameValue === "string" ? usernameValue.trim() : "";
  const password =
    typeof passwordValue === "string" ? passwordValue : "";

  if (
    !username ||
    username.length > 50 ||
    !password ||
    password.length > 1024
  ) {
    return { error: "Enter a valid username and password." };
  }

  let authenticatedUser: { id: string; username: string } | null = null;

  try {
    await connectToDatabase();
    const user = await User.findOne({ username })
      .select("+passwordHash")
      .exec();

    if (
      user &&
      user.role === "admin" &&
      (await User.verifyPassword(password, user.passwordHash))
    ) {
      authenticatedUser = {
        id: user._id.toString(),
        username: user.username,
      };
    }
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(
      `Admin login failed while checking credentials (${errorName}).`,
    );
    return {
      error: "Sign-in is temporarily unavailable. Please try again.",
    };
  }

  if (!authenticatedUser) {
    return { error: "The username or password is incorrect." };
  }

  await createAdminSession(authenticatedUser.id, authenticatedUser.username);
  redirect("/admin-dashboard");
}

export async function logoutAction(): Promise<void> {
  await clearAdminSession();
  redirect("/admin-dashboard");
}
