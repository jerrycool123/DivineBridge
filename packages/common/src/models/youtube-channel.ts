import { Document, Model, Schema, model } from 'mongoose';

export interface YouTubeChannelAttrs {
  _id: string; // YouTube Channel ID
  profile: {
    title: string;
    description: string;
    customUrl: string;
    thumbnail: string;
  };
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
  },
  {
    timestamps: true,
    statics: {
      async build(attrs: YouTubeChannelAttrs): Promise<YouTubeChannelDoc> {
        return this.create(attrs);
      },
    },
  },
);

export const YouTubeChannelCollection = model<YouTubeChannelDoc, YouTubeChannelModel>(
  'YouTubeChannel',
  youtubeChannelSchema,
  'YouTubeChannel',
);
