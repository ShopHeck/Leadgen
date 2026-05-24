import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnvConfig } from "@next/env";

const require = createRequire(import.meta.url);
const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin");

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const defaultPagesBasePath = repositoryName ? `/${repositoryName}` : "/Leadgen";
const repoBasePath = process.env.GITHUB_PAGES_BASE_PATH || defaultPagesBasePath;

// In this monorepo, the shared runtime env lives at the repo root.
loadEnvConfig(path.join(currentDir, "../.."));

const nextConfig = {
  transpilePackages: ["@closerflow/types", "@closerflow/ui", "@closerflow/db"],
  serverExternalPackages: ["twilio", "stripe"],
  outputFileTracingRoot: path.join(currentDir, "../.."),
  outputFileTracingIncludes: {
    "/**": ["../../packages/db/src/generated/client/**"],
  },
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
  ...(isGitHubPagesBuild
    ? {
        basePath: repoBasePath,
        assetPrefix: repoBasePath,
      }
    : {}),
};

export default nextConfig;
