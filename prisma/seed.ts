import { PrismaClient, QualificationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo" },
    update: {},
    create: { id: "demo-workspace", name: "Demo Workspace", slug: "demo", plan: "starter", niche: "med-spa" },
  });

  await prisma.lead.createMany({
    data: [
      {
        workspaceId: workspace.id,
        firstName: "Ava",
        lastName: "Stone",
        email: "ava@example.com",
        phone: "+15555550001",
        source: "meta_ads",
        medium: "paid_social",
        campaign: "summer_consults",
        serviceInterest: "injectables",
        leadScore: 92,
        qualificationStatus: QualificationStatus.HOT,
        lifecycleStage: "BOOKED",
      },
      {
        workspaceId: workspace.id,
        firstName: "Mason",
        lastName: "Lee",
        email: "mason@example.com",
        phone: "+15555550002",
        source: "google_ads",
        medium: "cpc",
        campaign: "roofing_estimate",
        serviceInterest: "roof_replacement",
        leadScore: 76,
        qualificationStatus: QualificationStatus.WARM,
        lifecycleStage: "QUALIFIED",
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
