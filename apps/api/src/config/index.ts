import { type AppOpenAPI, configureOpenAPI } from './open-api';

export default function configure(app: AppOpenAPI) {
  configureOpenAPI(app);
}
