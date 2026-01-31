import type { APIRoute } from "astro";
import { resetPasswordSchema } from "@/lib/schemas/auth.schema";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    const { error } = await locals.supabase.auth.updateUser({
      password: validatedData.password,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          message: error.message || "Wystąpił błąd podczas zmiany hasła",
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
        message: "Hasło zostało pomyślnie zmienione",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({
        message: "Wystąpił błąd podczas zmiany hasła",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
