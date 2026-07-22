import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGenerationPolicy, renderPolicyIndex } from "./lib/generation-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const destination = path.join(root, "context-packs", "index.md");
const rendered = renderPolicyIndex(loadGenerationPolicy(root));

if (process.argv.includes("--check")) {
  if (fs.readFileSync(destination, "utf8") !== rendered) {
    console.error("Generation policy index is stale. Run node tools/sync-generation-policy.mjs.");
    process.exit(1);
  }
  console.log("Generation policy index is synchronized.");
} else {
  fs.writeFileSync(destination, rendered);
  console.log("Generation policy index synchronized.");
}
