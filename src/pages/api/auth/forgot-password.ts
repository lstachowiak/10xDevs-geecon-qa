import type { APIRoute } from "astro";
import { forgotPasswordSchema } from "@/lib/schemas/auth.schema";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, url }) => {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    // Get base URL for redirect
    const redirectTo = `${url.origin}/auth/reset-password`;

    const { error } = await locals.supabase.auth.resetPasswordForEmail(validatedData.email, {
      redirectTo,
    });

    // Always return success to prevent email enumeration
    // but log error for debugging
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Password reset error:", error);
    }

    return new Response(
      JSON.stringify({
        message: "Jeśli konto z podanym adresem email istnieje, wysłaliśmy link do resetowania hasła",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch {
    // Always return success to prevent email enumeration
    return new Response(
      JSON.stringify({
        message: "Jeśli konto z podanym adresem email istnieje, wysłaliśmy link do resetowania hasła",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
