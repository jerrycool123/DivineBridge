import { MembershipRoleDoc } from '../models/membership-role.js';
import { YouTubeChannelDoc } from '../models/youtube-channel.js';

export interface UserPayload {
  id: string;
  name: string;
  image: string;
}

export interface GuildPayload {
  id: string;
  name: string;
  icon: string | null;
}

export interface MembershipRoleDocWithValidYouTubeChannel
  extends Omit<MembershipRoleDoc, 'youtube'> {
  youtube: YouTubeChannelDoc;
}
