import mongoose, { Document, Model, Schema, model } from 'mongoose';

export interface MembershipRoleAttrs {
  _id: string; // Discord Role ID
  profile: {
    name: string;
    color: number;
  };
  config: {
    aliasCommandId: string;
    aliasCommandName: string;
  };
  guild: string; // Ref: Guild
  youtube: string; // Ref: YouTubeChannel
}

export interface MembershipRoleDoc extends MembershipRoleAttrs, Document<string> {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MembershipRoleModel extends Model<MembershipRoleDoc> {
  build: (attrs: MembershipRoleAttrs) => Promise<MembershipRoleDoc>;
}

const membershipRoleSchema = new Schema<MembershipRoleDoc>(
  {
    _id: String,
    profile: {
      name: {
        type: String,
        required: true,
      },
      color: {
        type: Number,
        required: true,
      },
    },
    config: {
      aliasCommandId: {
        type: String,
        required: true,
      },
      aliasCommandName: {
        type: String,
        required: true,
      },
    },
    guild: {
      type: String,
      ref: 'Guild',
      required: true,
    },
    youtube: {
      type: String,
      ref: 'YouTubeChannel',
      required: true,
    },
  },
  {
    timestamps: true,
    statics: {
      async build(attrs: MembershipRoleAttrs): Promise<MembershipRoleDoc> {
        return this.create(attrs);
      },
    },
  },
);

export const MembershipRoleCollection =
  (mongoose.models.MembershipRole as unknown as MembershipRoleModel) ??
  model<MembershipRoleDoc, MembershipRoleModel>(
    'MembershipRole',
    membershipRoleSchema,
    'MembershipRole',
  );
