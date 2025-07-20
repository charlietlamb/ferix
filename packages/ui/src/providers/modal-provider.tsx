'use client';

import { InviteOrganizationMemberDialog } from '@ferix/ui/components/dialog/organization/invite-organization-member-dialog';
import { useModal } from '@ferix/ui/hooks/use-modal';
import type { ModalMap } from '@ferix/ui/store/modal';

export const modalRegistry: {
  [K in keyof ModalMap]: React.FC<ModalMap[K]>;
} = {
  inviteOrganizationMember: InviteOrganizationMemberDialog,
};

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const { current } = useModal();

  if (!current) {
    return children;
  }

  const Modal = modalRegistry[current.key];

  return (
    <>
      <Modal {...current.props} />
      {children}
    </>
  );
}
