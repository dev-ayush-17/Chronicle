import { NextResponse } from "next/server";
import type { StoredFile } from "@chronicle/shared";
import {
  CHRONICLE_BUCKET,
  createSupabaseAdminClient,
  ensureChronicleBucket,
} from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    await ensureChronicleBucket(supabase);

    const fileId = crypto.randomUUID();
    const safeFileName =
      file.name.split(/[/\\]/).pop()?.replace(/[/\\]/g, "_") || "file";
    const path = `${fileId}/${safeFileName}`;
    const contentType = file.type || "application/octet-stream";

    const { error } = await supabase.storage
      .from(CHRONICLE_BUCKET)
      .upload(path, file, {
        contentType,
        upsert: false,
      });

    if (error) {
      return NextResponse.json(
        { error: `Failed to upload to Supabase: ${error.message}` },
        { status: 500 }
      );
    }

    const storedFile: StoredFile = {
      id: fileId,
      fileName: safeFileName,
      size: file.size,
      mimeType: contentType,
      provider: "supabase",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(storedFile);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to upload evidence file.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
