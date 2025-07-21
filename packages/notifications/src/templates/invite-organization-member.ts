import { env } from '@ferix/env';
import type { MessageTemplate } from '@ferix/types/notifications/message-template';

export const inviteOrganizationMemberTemplate = (
  organizationName: string,
  inviterName: string,
  invitationId: string
): MessageTemplate => {
  return {
    subject: `You have been invited to join ${organizationName}.`,
    html: `You have been invited to join ${organizationName} by ${inviterName}. Please click the link below to accept the invitation: ${env.NEXT_PUBLIC_BASE_URL}/accept-invitation?invitationId=${invitationId}`,
    content: `You have been invited to join ${organizationName} by ${inviterName}. Please click the link below to accept the invitation: ${env.NEXT_PUBLIC_BASE_URL}/accept-invitation?invitationId=${invitationId}`,
  };
};
