import { z } from "zod";

/**
 * Schema for validating login form
 * Enforces:
 * - email: valid email format (required)
 * - password: non-empty string (required)
 */
export const loginSchema = z.object({
  email: z.string().email("Podaj poprawny adres email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

/**
 * Type inference for login form data
 */
export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema for validating registration form
 * Enforces:
 * - email: valid email format (required, read-only from token)
 * - password: minimum 8 characters (required)
 * - confirmPassword: must match password (required)
 */
export const registerSchema = z
  .object({
    email: z.string().email("Podaj poprawny adres email"),
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
      .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
      .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

/**
 * Type inference for registration form data
 */
export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Schema for validating forgot password form
 * Enforces:
 * - email: valid email format (required)
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Podaj poprawny adres email"),
});

/**
 * Type inference for forgot password form data
 */
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Schema for validating reset password form
 * Enforces:
 * - password: minimum 8 characters with complexity requirements (required)
 * - confirmPassword: must match password (required)
 */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
      .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
      .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

/**
 * Type inference for reset password form data
 */
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
