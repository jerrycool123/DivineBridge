import mongoose, { Document, Model, Schema, model } from 'mongoose';

export interface YouTubeChannelAttrs {
  _id: string; // YouTube Channel ID
  profile: {
    title: string;
    description: string;
    customUrl: string;
    thumbnail: string;
  };
  memberOnlyVideoIds: string[];
}

export interface YouTubeChannelDoc extends YouTubeChannelAttrs, Document<string> {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface YouTubeChannelModel extends Model<YouTubeChannelDoc> {
  build: (attrs: YouTubeChannelAttrs) => Promise<YouTubeChannelDoc>;
}

const youtubeChannelSchema = new Schema<YouTubeChannelDoc>(
  {
    _id: String,
    profile: {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: function allowEmptyString(this: YouTubeChannelDoc): boolean {
          return typeof this.profile.description !== 'string';
        },
      },
      customUrl: {
        type: String,
        required: true,
      },
      thumbnail: {
        type: String,
        required: true,
      },
    },
    memberOnlyVideoIds: {
      type: [String],
      default: [],
      required: true,
    },
  },
  {
    timestamps: true,
    statics: {
      async build(attrs: YouTubeChannelAttrs): Promise<YouTubeChannelDoc> {
        return this.create(attrs);
      },
    },
    virtuals: {
      membershipRoles: {
        options: {
          ref: 'MembershipRole',
          localField: '_id',
          foreignField: 'youtube',
        },
      },
    },
  },
);

export const YouTubeChannelCollection =
  (mongoose.models.YouTubeChannel as unknown as YouTubeChannelModel | undefined) ??
  model<YouTubeChannelDoc, YouTubeChannelModel>(
    'YouTubeChannel',
    youtubeChannelSchema,
    'YouTubeChannel',
  );
