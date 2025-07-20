import { atom } from 'jotai';

export type ModalMap = {
  inviteOrganizationMember: {
    organizationId: string;
  };
};

export type ModalKey = keyof ModalMap;

export type ModalEntry = {
  [K in keyof ModalMap]: {
    key: K;
    props: ModalMap[K];
  };
}[keyof ModalMap];

export const modalStackAtom = atom<ModalEntry[]>([]);
