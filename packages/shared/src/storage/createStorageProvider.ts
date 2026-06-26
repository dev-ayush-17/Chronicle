import { IndexedDBStorageProvider } from "./indexeddb";
import { SupabaseStorageProvider } from "./SupabaseStorageProvider";
import type { StorageProvider } from "./provider";
import type { StorageProviderType } from "./types";

const mode: StorageProviderType = "supabase";

export function createStorageProvider(): StorageProvider {
  switch (mode) {
    case "indexeddb":
      return new IndexedDBStorageProvider();

    case "supabase":
    default:
      return new SupabaseStorageProvider();
  }
}