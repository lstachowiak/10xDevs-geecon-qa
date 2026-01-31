import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

// Schema for registration with token
const registerWithTokenSchema = z
  .object({
    email: z.string().email("Podaj poprawny adres email"),
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
      .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
      .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
    token: z.string().min(1, "Token jest wymagany"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validatedData = registerWithTokenSchema.parse(body);

    // Verify invite token
    const { data: invite, error: inviteError } = await locals.supabase
      .from("invites")
      .select("*")
      .eq("token", validatedData.token)
      .eq("status", "active")
      .single();

    if (inviteError || !invite) {
      return new Response(
        JSON.stringify({
          message: "Nieprawidłowy lub nieaktywny token zaproszenia",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check if token is expired
    if (new Date(invite.expires_at) < new Date()) {
      // Mark as expired
      await locals.supabase.from("invites").update({ status: "expired" }).eq("id", invite.id);

      return new Response(
        JSON.stringify({
          message: "Token zaproszenia wygasł",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Register user with Supabase Auth
    const { data, error } = await locals.supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          message:
            error.message === "User already registered" ? "Użytkownik z tym adresem email już istnieje" : error.message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Mark invite as used
    await locals.supabase.from("invites").update({ status: "used" }).eq("id", invite.id);

    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          message: error.errors[0]?.message || "Nieprawidłowe dane",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Wystąpił błąd podczas rejestracji",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
