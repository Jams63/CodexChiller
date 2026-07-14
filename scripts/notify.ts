/**
 * Send WhatsApp digests for saved searches with new matching jobs.
 * Run after ingestion: npm run notify
 */
import { getPool } from "../src/lib/db";
import { notifySavedSearches } from "../src/lib/notifications/matcher";

async function main() {
  const { sent, checked } = await notifySavedSearches();
  console.log(`saved searches checked=${checked} digests sent=${sent}`);
  await getPool().end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
