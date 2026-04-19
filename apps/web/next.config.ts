import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvConfig } from "@next/env";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";
const repoBasePath = "/Leadgen";

// In this monorepo, the shared runtime env lives at the repo root.
loadEnvConfig(path.join(currentDir, "../.."));

const nextConfig = {
  transpilePackages: ["@closerflow/db", "@closerflow/types", "@closerflow/ui"],
  ...(isGitHubPagesBuild
    ? {
        basePath: repoBasePath,
        assetPrefix: repoBasePath,
      }
    : {}),
};

export default nextConfig;
