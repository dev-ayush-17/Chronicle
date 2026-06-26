import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const CHRONICLE_BUCKET = "chronicle";

function normalizeSupabaseUrl(url: string): string {
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

export function createSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = normalizeSupabaseUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  );
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL for server upload."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function ensureChronicleBucket(
  supabase: SupabaseClient
): Promise<void> {
  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(`Failed to list storage buckets: ${listError.message}`);
  }

  if (buckets?.some((bucket) => bucket.name === CHRONICLE_BUCKET)) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(
    CHRONICLE_BUCKET,
    {
      public: false,
      fileSizeLimit: 262144000,
    }
  );

  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw new Error(`Failed to create storage bucket: ${createError.message}`);
  }
}
