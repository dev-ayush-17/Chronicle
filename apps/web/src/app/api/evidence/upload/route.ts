import { NextResponse } from "next/server";
import type { StoredFile } from "@chronicle/shared";
import {
  CHRONICLE_BUCKET,
  createSupabaseAdminClient,
  ensureChronicleBucket,
} from "@/lib/supabase/admin";
import { anchorHashOnChain } from "@/lib/web3/serverAnchor";

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

    // -----------------------------------------------------------------------
    // Step 1: Upload binary to Supabase Storage
    // -----------------------------------------------------------------------
    const { error } = await supabase.storage
      .from(CHRONICLE_BUCKET)
      .upload(path, file, {
        contentType,
        upsert: false,
      });

    const sha256Hash = formData.get("sha256Hash") as string | null;
    const description = formData.get("description");
    const tagsRaw = formData.get("tags");

    const tags =
      typeof tagsRaw === "string"
        ? JSON.parse(tagsRaw)
        : [];

    if (error) {
      return NextResponse.json(
        { error: `Failed to upload to Supabase: ${error.message}` },
        { status: 500 }
      );
    }

    // -----------------------------------------------------------------------
    // Step 2: Insert metadata into Postgres (without tx hash yet)
    // -----------------------------------------------------------------------
    const { error: dbError } = await supabase.from("evidence").insert({
      file_name: safeFileName,
      file_type: contentType,
      file_size: file.size,
      file_id: path,
      sha256_hash: sha256Hash,
      description: description || null,
      tags: tags,
    });

    if (dbError) {
      console.error("❌ DB INSERT FAILED:", dbError);
      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      );
    }

    // -----------------------------------------------------------------------
    // Step 3: Anchor SHA-256 on blockchain (non-fatal — upload already succeeded)
    // -----------------------------------------------------------------------
    let blockchainTxHash: string | undefined = undefined;

    if (sha256Hash) {
      try {
        const anchorResult = await anchorHashOnChain(sha256Hash);
        blockchainTxHash = anchorResult.txHash;

        // Step 4: Update the Postgres row with the transaction hash
        const { error: updateError } = await supabase
          .from("evidence")
          .update({ blockchain_tx_hash: blockchainTxHash })
          .eq("file_id", path);

        if (updateError) {
          console.error("⚠️  Failed to save blockchain_tx_hash to DB:", updateError.message);
          // Non-fatal — the anchor tx is on-chain even if DB update fails
        } else {
          console.log(`✅ Anchored on-chain: ${blockchainTxHash}`);
        }
      } catch (anchorErr) {
        // Anchoring is NON-FATAL. Log the error but do not fail the upload.
        const msg = anchorErr instanceof Error ? anchorErr.message : String(anchorErr);
        console.error("⚠️  Blockchain anchoring failed (non-fatal):", msg);
      }
    }

    // -----------------------------------------------------------------------
    // Step 5: Return the StoredFile response (with tx hash if available)
    // -----------------------------------------------------------------------
    const storedFile: StoredFile = {
      id: fileId,
      fileName: safeFileName,
      size: file.size,
      mimeType: contentType,
      provider: "supabase",
      createdAt: new Date().toISOString(),
      blockchainTxHash,
    };

    return NextResponse.json(storedFile);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to upload evidence file.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
