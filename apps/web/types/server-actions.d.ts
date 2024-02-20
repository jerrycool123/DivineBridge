export interface GetUserActionData {
  id: string;
  profile: {
    username: string;
    image: string;
  };
  youtube: {
    id: string;
    title: string;
    customUrl: string;
    thumbnail: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeleteAccountActionData {}

export interface RevokeYouTubeActionData {}

export type GetGuildsActionData = {
  id: string;
  profile: {
    name: string;
    icon: string | null;
  };
  membershipRoles: {
    id: string;
    profile: {
      name: string;
      color: number;
    };
    config: {
      aliasCommandName: string;
    };
    guild: string;
    youtube: {
      id: string;
      profile: {
        title: string;
        description: string;
        customUrl: string;
        thumbnail: string;
      };
      createdAt: string;
      updatedAt: string;
    };
    membership: {
      id: string;
      user: string;
      membershipRole: string;
      type: MembershipDoc['type'];
      begin: string;
      end: string;
      createdAt: string;
      updatedAt: string;
    } | null;
    createdAt: string;
    updatedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}[];

export interface ConnectYouTubeActionData {
  id: string;
  title: string;
  customUrl: string;
  thumbnail: string;
}

export interface VerifyAuthMembershipActionData {
  id: string;
  user: string;
  membershipRole: string;
  type: MembershipDoc['type'];
  begin: string;
  end: string;
  createdAt: string;
  updatedAt: string;
}
