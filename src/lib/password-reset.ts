import { db } from "@/lib/db";

const TEMP_PASSWORD_LENGTH = 12;
export const TEMP_PASSWORD_TTL_MINUTES = 15;

let schemaReady: Promise<void> | null = null;

type TableColumnRow = {
  name: string;
};

async function addColumnIfMissing(
  existingColumns: Set<string>,
  columnName: string,
  definition: string
) {
  if (existingColumns.has(columnName)) {
    return;
  }

  await db.execute(`ALTER TABLE users ADD COLUMN ${columnName} ${definition}`);
  existingColumns.add(columnName);
}

export async function ensurePasswordResetSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const result = await db.execute("PRAGMA table_info(users)");
      const existingColumns = new Set(
        result.rows.map((row) => String((row as unknown as TableColumnRow).name))
      );

      await addColumnIfMissing(
        existingColumns,
        "temporary_password_hash",
        "TEXT"
      );
      await addColumnIfMissing(
        existingColumns,
        "temporary_password_expires_at",
        "TEXT"
      );
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  return schemaReady;
}

export function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(TEMP_PASSWORD_LENGTH));

  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
}

export function getTemporaryPasswordExpiry() {
  return new Date(Date.now() + TEMP_PASSWORD_TTL_MINUTES * 60 * 1000).toISOString();
}
