import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class UserSession extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  sessionToken: string;

  @Prop({ required: true })
  deviceInfo: string;

  @Prop({ required: true })
  ipAddress: string;

  @Prop({ required: true })
  userAgent: string;

  @Prop({ required: true })
  isActive: boolean;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ required: true })
  lastActivity: Date;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);

// Index para performance
UserSessionSchema.index({ userId: 1 });
UserSessionSchema.index({ sessionToken: 1 });
UserSessionSchema.index({ expiresAt: 1 });
