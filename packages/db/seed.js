require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("./src/generated/client");

const prisma = new PrismaClient();

const DEFAULT_STAGES = [
  "New",
  "Attempting Contact",
  "Qualified",
  "Booked",
  "Confirmed",
  "Showed",
  "Won",
  "Lost",
  "Nurture",
];

const STAGE_STATUS = {
  New: "NEW",
  "Attempting Contact": "ATTEMPTING_CONTACT",
  Qualified: "QUALIFIED",
  Booked: "BOOKED",
  Confirmed: "CONFIRMED",
  Showed: "SHOWED",
  Won: "WON",
  Lost: "LOST",
  Nurture: "NURTURE",
};

async function ensureDefaultPipeline(workspaceId) {
  let pipeline = await prisma.pipeline.findFirst({
    where: {
      workspaceId,
      isDefault: true,
    },
    include: {
      stages: {
        orderBy: {
          orderIndex: "asc",
        },
      },
    },
  });

  if (!pipeline) {
    pipeline = await prisma.pipeline.create({
      data: {
        workspaceId,
        name: "Lifecycle",
        isDefault: true,
        stages: {
          create: DEFAULT_STAGES.map((name, orderIndex) => ({
            name,
            orderIndex,
          })),
        },
      },
      include: {
        stages: {
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
    });
  }

  const existingNames = new Set(pipeline.stages.map((stage) => stage.name));
  const missingStages = DEFAULT_STAGES.filter((name) => !existingNames.has(name));

  if (missingStages.length > 0) {
    await prisma.pipeline.update({
      where: { id: pipeline.id },
      data: {
        stages: {
          create: missingStages.map((name, index) => ({
            name,
            orderIndex: pipeline.stages.length + index,
          })),
        },
      },
    });

    pipeline = await prisma.pipeline.findUniqueOrThrow({
      where: { id: pipeline.id },
      include: {
        stages: {
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
    });
  }

  return pipeline;
}

async function ensureLead({
  workspaceId,
  assignedUserId,
  stageByName,
  lead,
}) {
  const stage = stageByName[lead.stageName];
  const existing = await prisma.lead.findFirst({
    where: {
      workspaceId,
      email: lead.email,
    },
  });

  const record =
    existing ||
    (await prisma.lead.create({
      data: {
        workspaceId,
        assignedUserId,
        pipelineStageId: stage.id,
        status: STAGE_STATUS[lead.stageName],
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        campaign: lead.campaign,
        utmSource: lead.utm.source,
        utmMedium: lead.utm.medium,
        utmCampaign: lead.utm.campaign,
        utmTerm: lead.utm.term,
        utmContent: lead.utm.content,
        leadScore: lead.score,
        scoreBand: lead.scoreBand,
        scoringReasonsJson: lead.scoringReasons,
        lastScoredAt: new Date(),
      },
    }));

  if (!existing) {
    await prisma.formSubmission.create({
      data: {
        workspaceId,
        leadId: record.id,
        payloadJson: {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          notes: lead.intakeNotes,
          answers: lead.answers,
        },
        utmJson: lead.utm,
        pageUrl: lead.pageUrl,
      },
    });

    await prisma.leadStageHistory.create({
      data: {
        workspaceId,
        leadId: record.id,
        fromStageId: null,
        toStageId: stage.id,
        changedByUserId: assignedUserId,
      },
    });
  }

  if (lead.note) {
    const noteCount = await prisma.leadNote.count({
      where: {
        leadId: record.id,
      },
    });

    if (noteCount === 0) {
      await prisma.leadNote.create({
        data: {
          workspaceId,
          leadId: record.id,
          authorUserId: assignedUserId,
          body: lead.note,
        },
      });
    }
  }

  if (Array.isArray(lead.messages) && lead.messages.length > 0) {
    const messageCount = await prisma.message.count({
      where: {
        leadId: record.id,
      },
    });

    if (messageCount === 0) {
      for (const message of lead.messages) {
        await prisma.message.create({
          data: {
            workspaceId,
            leadId: record.id,
            channel: message.channel,
            direction: message.direction,
            subject: message.subject || null,
            body: message.body,
            status: message.status,
            provider: message.provider,
            providerMessageId: message.providerMessageId,
            fromAddress: message.fromAddress,
            toAddress: message.toAddress,
            sentAt: new Date(),
            metadataJson: message.metadataJson || null,
          },
        });
      }
    }
  }

  return record;
}

async function main() {
  const passwordHash = await bcrypt.hash("CloserFlow123!", 10);

  const existingUser = await prisma.user.findUnique({
    where: {
      email: "demo@closerflow.ai",
    },
  });

  const user = existingUser
    ? await prisma.user.update({
        where: {
          id: existingUser.id,
        },
        data: {
          firstName: "Demo",
          lastName: "Operator",
          passwordHash,
        },
      })
    : await prisma.user.create({
        data: {
          email: "demo@closerflow.ai",
          firstName: "Demo",
          lastName: "Operator",
          passwordHash,
        },
      });

  const existingWorkspace = await prisma.workspace.findUnique({
    where: {
      slug: "demo-closerflow",
    },
  });

  const workspace = existingWorkspace
    ? await prisma.workspace.update({
        where: {
          id: existingWorkspace.id,
        },
        data: {
          name: "Demo CloserFlow Workspace",
        },
      })
    : await prisma.workspace.create({
        data: {
          name: "Demo CloserFlow Workspace",
          slug: "demo-closerflow",
          members: {
            create: {
              userId: user.id,
              role: "ADMIN",
            },
          },
        },
      });

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: workspace.id,
      userId: user.id,
    },
  });

  if (!membership) {
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: "ADMIN",
      },
    });
  }

  const pipeline = await ensureDefaultPipeline(workspace.id);
  const stageByName = Object.fromEntries(pipeline.stages.map((stage) => [stage.name, stage]));

  const leads = [
    {
      name: "Jordan Avery",
      email: "jordan@suncrestmedspa.com",
      phone: "+15555550101",
      stageName: "New",
      score: 82,
      scoreBand: "HOT",
      source: "facebook",
      campaign: "summer-lift",
      pageUrl: "https://demo.closerflow.ai/funnels/medspa",
      intakeNotes: "Requested same-week consultation for body contouring.",
      answers: {
        budget: "10k",
        urgency: "ASAP",
        decisionMaker: "yes",
        location: "same city",
      },
      utm: {
        source: "facebook",
        medium: "paid-social",
        campaign: "summer-lift",
        term: "body contouring",
        content: "video-a",
      },
      scoringReasons: [
        { label: "Budget", points: 25, reason: "Budget suggests premium buying capacity." },
        { label: "Urgency", points: 20, reason: "Lead wants to move immediately." },
      ],
      note: "Call within 5 minutes. High intent and premium treatment package likely.",
      messages: [
        {
          channel: "SMS",
          direction: "OUTBOUND",
          body: "Hi Jordan, this is Demo from CloserFlow. We saw your request and can get you scheduled this week. What time works best today?",
          status: "SENT",
          provider: "TWILIO",
          providerMessageId: "seed-twilio-jordan",
          fromAddress: "+15555550999",
          toAddress: "+15555550101",
          metadataJson: { seeded: true },
        },
      ],
    },
    {
      name: "Taylor Brooks",
      email: "taylor@crestroofing.com",
      phone: "+15555550102",
      stageName: "Qualified",
      score: 68,
      scoreBand: "WARM",
      source: "google",
      campaign: "roof-repair-search",
      pageUrl: "https://demo.closerflow.ai/funnels/roofing",
      intakeNotes: "Needs estimate next month after insurance review.",
      answers: {
        budget: "5k",
        urgency: "this month",
        decisionMaker: "owner",
        location: "within service area",
      },
      utm: {
        source: "google",
        medium: "search",
        campaign: "roof-repair-search",
        term: "roof repair quote",
        content: "headline-b",
      },
      scoringReasons: [
        { label: "Budget", points: 16, reason: "Budget suggests workable commercial intent." },
        { label: "Urgency", points: 14, reason: "Lead appears ready in the near term." },
      ],
      note: "Insurance timeline introduces some friction, but contact quality is strong.",
      messages: [
        {
          channel: "EMAIL",
          direction: "OUTBOUND",
          subject: "Roof repair estimate follow-up",
          body: "Taylor, thanks for reaching out. We can prepare an estimate package for your insurance review and hold a slot for next month.",
          status: "SENT",
          provider: "RESEND",
          providerMessageId: "seed-resend-taylor",
          fromAddress: "team@closerflow.ai",
          toAddress: "taylor@crestroofing.com",
          metadataJson: { seeded: true },
        },
      ],
    },
    {
      name: "Morgan Lee",
      email: "morgan@northvalesolar.com",
      phone: "+15555550103",
      stageName: "Booked",
      score: 74,
      scoreBand: "WARM",
      source: "instagram",
      campaign: "solar-savings",
      pageUrl: "https://demo.closerflow.ai/funnels/solar",
      intakeNotes: "Booked design consult after requesting financing details.",
      answers: {
        budget: "medium",
        urgency: "soon",
        decisionMaker: "partner",
        location: "local",
      },
      utm: {
        source: "instagram",
        medium: "paid-social",
        campaign: "solar-savings",
        term: "solar installation",
        content: "carousel-c",
      },
      scoringReasons: [
        { label: "Decision-maker", points: 10, reason: "Lead likely influences the decision." },
        { label: "Engagement", points: 15, reason: "Lead engagement signals: phone captured, form supplied multiple answers." },
      ],
      note: "Prep financing comparison before consult.",
    },
    {
      name: "Casey Nguyen",
      email: "casey@harborgrouplegal.com",
      phone: "+15555550104",
      stageName: "Nurture",
      score: 42,
      scoreBand: "NURTURE",
      source: "linkedin",
      campaign: "legal-ops-outreach",
      pageUrl: "https://demo.closerflow.ai/funnels/legal",
      intakeNotes: "Interested but budget review deferred until next quarter.",
      answers: {
        budget: "low",
        urgency: "later",
        decisionMaker: "manager",
        location: "same state",
      },
      utm: {
        source: "linkedin",
        medium: "paid-social",
        campaign: "legal-ops-outreach",
        term: "lead intake automation",
        content: "static-d",
      },
      scoringReasons: [
        { label: "Budget", points: 8, reason: "Budget signal exists but indicates lower spend." },
        { label: "Urgency", points: 7, reason: "Lead shows interest but timeline is later." },
      ],
      note: "Add to quarterly nurture sequence and revisit before budgeting season.",
    },
  ];

  for (const lead of leads) {
    await ensureLead({
      workspaceId: workspace.id,
      assignedUserId: user.id,
      stageByName,
      lead,
    });
  }

  console.log("Seed complete.");
  console.log("Demo login: demo@closerflow.ai / CloserFlow123!");
  console.log("Demo workspace slug: demo-closerflow");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
