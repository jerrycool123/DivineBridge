import { Document, Model, Schema, model } from 'mongoose';

export interface GuildAttrs {
  _id: string; // Discord Guild ID
  profile: {
    name: string;
    icon: string | null;
  };
}

export interface GuildDoc extends GuildAttrs, Document<string> {
  _id: string;
  config: {
    logChannel: string | null; // Discord Text Channel ID
    screenshotEnabled: boolean;
    authEnabled: boolean;
    liveChatEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface GuildModel extends Model<GuildDoc> {
  build: (attrs: GuildAttrs) => Promise<GuildDoc>;
}

const guildSchema = new Schema<GuildDoc>(
  {
    _id: String,
    profile: {
      name: {
        type: String,
        required: true,
      },
      icon: {
        type: String,
        default: null,
      },
    },
    config: {
      logChannel: {
        type: String,
        default: null,
      },
      screenshotEnabled: {
        type: Boolean,
        default: false,
      },
      authEnabled: {
        type: Boolean,
        default: false,
      },
      liveChatEnabled: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
    statics: {
      async build(attrs: GuildAttrs): Promise<GuildDoc> {
        return this.create(attrs);
      },
    },
    virtuals: {
      membershipRoles: {
        options: {
          ref: 'MembershipRole',
          localField: '_id',
          foreignField: 'guild',
        },
      },
    },
  },
);

export const GuildCollection = model<GuildDoc, GuildModel>('Guild', guildSchema, 'Guild');