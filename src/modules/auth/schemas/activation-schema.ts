import { z } from "zod";

export const activationCodeSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Informe um e-mail válido.")),
  token: z.string().regex(/^\d{8}$/, "Informe o código de 8 dígitos recebido por e-mail."),
});

export const activationPasswordSchema = z.object({
  password: z.string().min(8, "Use pelo menos 8 caracteres."),
  passwordConfirmation: z.string(),
}).refine((value) => value.password === value.passwordConfirmation, {
  path: ["passwordConfirmation"],
  message: "As senhas não são iguais.",
});
