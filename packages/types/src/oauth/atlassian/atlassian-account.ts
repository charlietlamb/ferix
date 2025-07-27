export type AtlassianAccount = {
  emailVerified: boolean;
  email: string;
  image: string;
  name: string;
  account_id: string;
  picture: string;
  account_status: 'active' | string;
  characteristics: {
    not_mentionable: boolean;
  };
  last_updated: string;
  nickname: string;
  locale: string;
  extended_profile: {
    phone_numbers: string[];
    team_type: string;
  };
  account_type: 'atlassian' | string;
  email_verified: boolean;
};
