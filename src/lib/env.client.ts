import z from "zod";

const envSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.url({
        error : "NEXT_PUBLIC_SUPABASE_URL is required and must be a valid URL",
    }),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string({
        error: "NEXT_PUBLIC_SUPABASE_KEY is required",
    }),
})


const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
if (!parsed.success) {
  console.error("❌ Invalid client environment variables:", parsed.error.format());
  throw new Error("Invalid client environment variables");
}
export const env = parsed.data;