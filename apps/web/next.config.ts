import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvConfig } from "@next/env";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// In this monorepo, the shared runtime env lives at the repo root.
loadEnvConfig(path.join(currentDir, "../.."));

const nextConfig = {
  transpilePackages: ["@closerflow/db", "@closerflow/types", "@closerflow/ui"],
};

export default nextConfig;
