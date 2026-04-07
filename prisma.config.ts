import "dotenv/config";

import type { PrismaConfig } from "prisma";

const config: PrismaConfig = {
  schema: "packages/db/prisma/schema.prisma",
  migrations: {
    path: "packages/db/prisma/migrations",
    seed: "node packages/db/seed.js",
  },
};

export default config;
