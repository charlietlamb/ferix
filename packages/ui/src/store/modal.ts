import { atom } from 'jotai';
import { InviteOrganizationMemberDialog } from '../components/dialog/organization/invite-organization-member-dialog';

export type ModalMap = {
  inviteOrganizationMember: undefined;
};

export type ModalKey = keyof ModalMap;

export type ModalEntry = {
  [K in keyof ModalMap]: {
    key: K;
    props: ModalMap[K];
  };
}[keyof ModalMap];

export type ModalProps<K extends ModalKey> = ModalMap[K];

export const modalRegistry: {
  [K in keyof ModalMap]: React.FC<ModalMap[K]>;
} = {
  inviteOrganizationMember: InviteOrganizationMemberDialog,
};

export const modalStackAtom = atom<ModalEntry[]>([]);
