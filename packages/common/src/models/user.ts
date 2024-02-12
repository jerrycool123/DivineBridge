import { Document, Model, Schema, model } from 'mongoose';

export interface UserAttrs {
  _id: string; // Discord ID
  profile: {
    username: string;
    avatar: string;
  };
}

export interface UserDoc extends UserAttrs, Document<string> {
  _id: string;
  preference: {
    language: string;
  };
  youtube: {
    id: string;
    title: string;
    customUrl: string;
    thumbnail: string;
    refreshToken: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserModel extends Model<UserDoc> {
  build: (attrs: UserAttrs) => Promise<UserDoc>;
}

const userSchema = new Schema<UserDoc>(
  {
    _id: String,
    profile: {
      username: {
        type: String,
        required: true,
      },
      avatar: {
        type: String,
        required: true,
      },
    },
    preference: {
      language: {
        type: String,
        required: true,
        default: 'eng',
      },
    },
    youtube: {
      type: new Schema(
        {
          id: {
            type: String,
            required: true,
          },
          title: {
            type: String,
            required: true,
          },
          customUrl: {
            type: String,
            required: true,
          },
          thumbnail: {
            type: String,
            required: true,
          },
          refreshToken: {
            type: String,
            required: true,
          },
        },
        {
          _id: false,
        },
      ),
      default: null,
    },
  },
  {
    timestamps: true,
    statics: {
      async build(attrs: UserAttrs) {
        return this.create(attrs);
      },
    },
    virtuals: {
      memberships: {
        options: {
          ref: 'Membership',
          localField: '_id',
          foreignField: 'user',
        },
      },
    },
  },
);

export const UserCollection = model<UserDoc, UserModel>('User', userSchema, 'User');
