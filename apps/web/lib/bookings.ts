import { AppointmentProvider, AppointmentStatus, prisma } from "@closerflow/db";
import { emitAutomationEvent } from "./automations";
import { moveLeadToStageByName } from "./crm";

type CreateAppointmentInput = {
  workspaceId: string;
  leadId: string;
  provider?: AppointmentProvider;
  externalEventId?: string | null;
  startAt: Date;
  endAt?: Date | null;
  inviteeName?: string | null;
  inviteeEmail?: string | null;
  calendlyEventUri?: string | null;
  calendlyInviteeUri?: string | null;
  notes?: string | null;
  status?: AppointmentStatus;
};

function mapAppointmentStatusToStage(status: AppointmentStatus) {
  switch (status) {
    case AppointmentStatus.CONFIRMED:
      return "Confirmed";
    case AppointmentStatus.COMPLETED:
      return "Showed";
    case AppointmentStatus.SCHEDULED:
    default:
      return "Booked";
  }
}

export async function createOrUpdateAppointment(input: CreateAppointmentInput) {
  const status = input.status ?? AppointmentStatus.SCHEDULED;
  const provider = input.provider ?? AppointmentProvider.MANUAL;

  const existing = input.externalEventId
    ? await prisma.appointment.findFirst({
        where: {
          workspaceId: input.workspaceId,
          externalEventId: input.externalEventId,
        },
      })
    : null;

  const appointment = existing
    ? await prisma.appointment.update({
        where: {
          id: existing.id,
        },
        data: {
          status,
          startAt: input.startAt,
          endAt: input.endAt ?? null,
          inviteeName: input.inviteeName ?? null,
          inviteeEmail: input.inviteeEmail ?? null,
          calendlyEventUri: input.calendlyEventUri ?? null,
          calendlyInviteeUri: input.calendlyInviteeUri ?? null,
          notes: input.notes ?? null,
        },
      })
    : await prisma.appointment.create({
        data: {
          workspaceId: input.workspaceId,
          leadId: input.leadId,
          provider,
          externalEventId: input.externalEventId ?? null,
          startAt: input.startAt,
          endAt: input.endAt ?? null,
          inviteeName: input.inviteeName ?? null,
          inviteeEmail: input.inviteeEmail ?? null,
          calendlyEventUri: input.calendlyEventUri ?? null,
          calendlyInviteeUri: input.calendlyInviteeUri ?? null,
          notes: input.notes ?? null,
          status,
        },
      });

  if (status !== AppointmentStatus.CANCELLED && status !== AppointmentStatus.NO_SHOW) {
    await prisma.$transaction((tx) =>
      moveLeadToStageByName(tx, {
        workspaceId: input.workspaceId,
        leadId: input.leadId,
        stageName: mapAppointmentStatusToStage(status),
        changedByUserId: null,
      }),
    );
  }

  if (!existing) {
    await emitAutomationEvent({
      workspaceId: input.workspaceId,
      eventType: "booking.created",
      payload: {
        leadId: input.leadId,
      },
    });
  }

  return appointment;
}
