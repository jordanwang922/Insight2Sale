"use server";

import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

/**
 * 登录：仅接收 FormData，可直接 `<form action={submitLogin}>`。
 * 成功或失败均由 next-auth 通过 redirect() 完成导航（微信内可不依赖客户端 JS 提交）。
 */
export async function submitLogin(formData: FormData) {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (error instanceof AuthError) {
      redirect(`/login?error=${encodeURIComponent(error.type || "CredentialsSignin")}`);
    }
    redirect("/login?error=Unknown");
  }
}
