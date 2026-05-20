import { prisma } from "@closerflow/db";

export type DateRange = {
  from: Date;
  to: Date;
};

export type LeadVolumePoint = {
  date: string;
  count: number;
};

export type SourceAttribution = {
  source: string;
  leads: number;
  bookings: number;
  won: number;
  revenue: number;
  conversionRate: number;
};

export type PipelineConversion = {
  stage: string;
  count: number;
  percentage: number;
};

export type AnalyticsSummary = {
  totalLeads: number;
  totalBookings: number;
  totalWon: number;
  totalRevenue: number;
  avgLeadScore: number;
  avgSpeedToContact: number | null;
  bookingRate: number;
  showRate: number;
  closeRate: number;
  revenuePerLead: number;
};

export type FullAnalytics = {
  summary: AnalyticsSummary;
  leadVolume: LeadVolumePoint[];
  sourceAttribution: SourceAttribution[];
  pipelineConversion: PipelineConversion[];
  topCampaigns: Array<{ campaign: string; leads: number; bookings: number; revenue: number }>;
};

function getDefaultDateRange(): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from, to };
}

export async function getWorkspaceAnalytics(
  workspaceId: string,
  range?: Partial<DateRange>,
): Promise<FullAnalytics> {
  const { from, to } = { ...getDefaultDateRange(), ...range };

  const [leads, appointments, revenueEvents, messages, stages] = await Promise.all([
    prisma.lead.findMany({
      where: {
        workspaceId,
        createdAt: { gte: from, lte: to },
      },
      select: {
        id: true,
        createdAt: true,
        leadScore: true,
        status: true,
        source: true,
        utmSource: true,
        campaign: true,
        utmCampaign: true,
        pipelineStageId: true,
      },
    }),
    prisma.appointment.findMany({
      where: {
        workspaceId,
        createdAt: { gte: from, lte: to },
      },
      select: {
        id: true,
        leadId: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.revenueEvent.findMany({
      where: {
        lead: { workspaceId },
        createdAt: { gte: from, lte: to },
      },
      select: {
        id: true,
        leadId: true,
        amount: true,
        status: true,
      },
    }),
    prisma.message.findMany({
      where: {
        workspaceId,
        direction: "OUTBOUND",
        createdAt: { gte: from, lte: to },
      },
      select: {
        id: true,
        leadId: true,
        sentAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.pipelineStage.findMany({
      where: {
        pipeline: {
          workspaceId,
          isDefault: true,
        },
      },
      orderBy: { orderIndex: "asc" },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            leads: {
              where: { workspaceId },
            },
          },
        },
      },
    }),
  ]);

  // --- Summary ---
  const totalLeads = leads.length;
  const totalBookings = appointments.length;
  const completedAppointments = appointments.filter(
    (a) => a.status === "COMPLETED",
  );
  const wonLeads = leads.filter((l) => l.status === "WON");
  const totalWon = wonLeads.length;
  const confirmedRevenue = revenueEvents.filter((r) => r.status === "CONFIRMED");
  const totalRevenue = confirmedRevenue.reduce(
    (sum, r) => sum + Number(r.amount),
    0,
  );
  const avgLeadScore =
    totalLeads > 0
      ? Math.round(leads.reduce((sum, l) => sum + l.leadScore, 0) / totalLeads)
      : 0;

  // Speed-to-contact: avg time between lead creation and first outbound message
  const leadFirstMessage = new Map<string, Date>();
  for (const msg of messages) {
    if (msg.leadId && msg.sentAt && !leadFirstMessage.has(msg.leadId)) {
      leadFirstMessage.set(msg.leadId, msg.sentAt);
    }
  }
  const contactTimes: number[] = [];
  for (const lead of leads) {
    const firstMsg = leadFirstMessage.get(lead.id);
    if (firstMsg) {
      contactTimes.push(
        (firstMsg.getTime() - lead.createdAt.getTime()) / 1000,
      );
    }
  }
  const avgSpeedToContact =
    contactTimes.length > 0
      ? Math.round(
          contactTimes.reduce((s, v) => s + v, 0) / contactTimes.length,
        )
      : null;

  const bookingRate =
    totalLeads > 0 ? Math.round((totalBookings / totalLeads) * 100) : 0;
  const showRate =
    totalBookings > 0
      ? Math.round((completedAppointments.length / totalBookings) * 100)
      : 0;
  const closeRate =
    totalLeads > 0 ? Math.round((totalWon / totalLeads) * 100) : 0;
  const revenuePerLead =
    totalLeads > 0 ? Math.round((totalRevenue / totalLeads) * 100) / 100 : 0;

  const summary: AnalyticsSummary = {
    totalLeads,
    totalBookings,
    totalWon,
    totalRevenue,
    avgLeadScore,
    avgSpeedToContact,
    bookingRate,
    showRate,
    closeRate,
    revenuePerLead,
  };

  // --- Lead Volume (daily) ---
  const volumeMap = new Map<string, number>();
  for (const lead of leads) {
    const day = lead.createdAt.toISOString().slice(0, 10);
    volumeMap.set(day, (volumeMap.get(day) || 0) + 1);
  }
  const leadVolume: LeadVolumePoint[] = Array.from(volumeMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // --- Source Attribution ---
  const sourceMap = new Map<
    string,
    { leads: number; bookings: Set<string>; won: number; revenue: number }
  >();
  const leadSourceMap = new Map<string, string>();

  for (const lead of leads) {
    const src = lead.utmSource || lead.source || "direct";
    leadSourceMap.set(lead.id, src);
    const entry = sourceMap.get(src) || {
      leads: 0,
      bookings: new Set<string>(),
      won: 0,
      revenue: 0,
    };
    entry.leads++;
    if (lead.status === "WON") entry.won++;
    sourceMap.set(src, entry);
  }

  for (const appt of appointments) {
    const src = leadSourceMap.get(appt.leadId);
    if (src) {
      const entry = sourceMap.get(src);
      if (entry) entry.bookings.add(appt.leadId);
    }
  }

  for (const rev of confirmedRevenue) {
    const src = leadSourceMap.get(rev.leadId);
    if (src) {
      const entry = sourceMap.get(src);
      if (entry) entry.revenue += Number(rev.amount);
    }
  }

  const sourceAttribution: SourceAttribution[] = Array.from(
    sourceMap.entries(),
  )
    .map(([source, data]) => ({
      source,
      leads: data.leads,
      bookings: data.bookings.size,
      won: data.won,
      revenue: data.revenue,
      conversionRate:
        data.leads > 0
          ? Math.round((data.bookings.size / data.leads) * 100)
          : 0,
    }))
    .sort((a, b) => b.leads - a.leads);

  // --- Pipeline Conversion ---
  const totalInPipeline = stages.reduce((s, st) => s + st._count.leads, 0);
  const pipelineConversion: PipelineConversion[] = stages.map((stage) => ({
    stage: stage.name,
    count: stage._count.leads,
    percentage:
      totalInPipeline > 0
        ? Math.round((stage._count.leads / totalInPipeline) * 100)
        : 0,
  }));

  // --- Top Campaigns ---
  const campaignMap = new Map<
    string,
    { leads: number; bookings: Set<string>; revenue: number }
  >();
  const leadCampaignMap = new Map<string, string>();

  for (const lead of leads) {
    const camp = lead.utmCampaign || lead.campaign || "(none)";
    leadCampaignMap.set(lead.id, camp);
    const entry = campaignMap.get(camp) || {
      leads: 0,
      bookings: new Set<string>(),
      revenue: 0,
    };
    entry.leads++;
    campaignMap.set(camp, entry);
  }

  for (const appt of appointments) {
    const camp = leadCampaignMap.get(appt.leadId);
    if (camp) {
      const entry = campaignMap.get(camp);
      if (entry) entry.bookings.add(appt.leadId);
    }
  }

  for (const rev of confirmedRevenue) {
    const camp = leadCampaignMap.get(rev.leadId);
    if (camp) {
      const entry = campaignMap.get(camp);
      if (entry) entry.revenue += Number(rev.amount);
    }
  }

  const topCampaigns = Array.from(campaignMap.entries())
    .map(([campaign, data]) => ({
      campaign,
      leads: data.leads,
      bookings: data.bookings.size,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 10);

  return {
    summary,
    leadVolume,
    sourceAttribution,
    pipelineConversion,
    topCampaigns,
  };
}
