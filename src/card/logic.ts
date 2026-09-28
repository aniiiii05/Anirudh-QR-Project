import { z } from "zod";
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(80),
  email: z.string().trim().email("Enter a valid email.").max(254),
  message: z
    .string()
    .trim()
    .min(20, "Please write at least 20 characters.")
    .max(1200),
  contextUrl: z
    .union([
      z.literal(""),
      z
        .string()
        .max(500)
        .url()
        .refine((v) => new URL(v).protocol === "https:", "Use an HTTPS link."),
    ])
    .optional(),
  consent: z.literal(true, {
    errorMap: () => ({
      message: "Please confirm that Anirudh may reply by email.",
    }),
  }),
  website: z.string().max(200).optional(),
});
export function tidyLines(value: string) {
  return [
    ...new Set(
      value
        .split("\n")
        .map((line) => line.trim().replace(/^[-*•]\s*/, ""))
        .filter(Boolean),
    ),
  ].slice(0, 30);
}
export function qrDestination(raw: string) {
  const source = new URL(raw, "https://example.invalid");
  const target = new URL("/card", source);
  for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
    const value = source.searchParams.get(key);
    if (value && /^[a-zA-Z0-9_-]{1,64}$/.test(value))
      target.searchParams.set(key, value);
  }
  if (!target.searchParams.has("utm_source"))
    target.searchParams.set("utm_source", "card");
  return target.pathname + target.search;
}
