import { defaultLocale } from '@divine-bridge/i18n';
import mongoose, { Document, Model, Schema, model } from 'mongoose';

export interface UserAttrs {
  _id: string; // Discord ID
  profile: {
    username: string;
    image: string;
  };
}

export interface UserDoc extends UserAttrs, Document<string> {
  _id: string;
  preference: {
    language: string;
    locale: string;
  };
  youtube: {
    id: string;
    title: string;
    customUrl: string;
    thumbnail: string;
    refreshToken: string;
  } | null;
  flags: {
    tutorial: boolean;
  };
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
      image: {
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
      locale: {
        type: String,
        required: true,
        default: defaultLocale,
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
    flags: {
      tutorial: {
        type: Boolean,
        required: true,
        default: false,
      },
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

export const UserCollection =
  (mongoose.models.User as unknown as UserModel | undefined) ??
  model<UserDoc, UserModel>('User', userSchema, 'User');
