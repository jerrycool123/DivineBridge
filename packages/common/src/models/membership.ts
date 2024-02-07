import { Document, Model, Schema, Types, model } from 'mongoose';

export interface MembershipAttrs {
  user: string; // Ref: User
  membershipRole: string; // Ref: MembershipRole
  type: 'screenshot' | 'auth' | 'live_chat';
  begin: Date;
  end: Date;
}

export interface MembershipDoc extends MembershipAttrs, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface MembershipModel extends Model<MembershipDoc> {
  build: (attrs: MembershipAttrs) => Promise<MembershipDoc>;
}

const membershipSchema = new Schema<MembershipDoc>(
  {
    user: {
      type: String,
      ref: 'User',
      required: true,
    },
    membershipRole: {
      type: String,
      ref: 'MembershipRole',
      required: true,
    },
    type: {
      type: String,
      enum: ['screenshot', 'auth', 'live_chat'],
      required: true,
    },
    begin: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    statics: {
      async build(attrs: MembershipAttrs): Promise<MembershipDoc> {
        return this.create(attrs);
      },
    },
  },
);

export const MembershipCollection = model<MembershipDoc, MembershipModel>(
  'Membership',
  membershipSchema,
  'Membership',
);
