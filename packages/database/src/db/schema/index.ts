import { authSchema } from './auth';
import { organizationSchema } from './organizations';

export const schema = {
  ...authSchema,
  ...organizationSchema,
};
