import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { Model } from 'mongoose';
import { UserSession } from '../../shared/schemas/user-session.schema';

@Injectable()
export class SessionService {
  constructor(@InjectModel(UserSession.name) private sessionModel: Model<UserSession>) {}

  async createOrUpdateSession(
    userId: string,
    deviceInfo: string,
    ipAddress: string,
    userAgent: string
  ): Promise<string> {
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
    const now = new Date();

    // Atualizar ou criar sessão (apenas uma por usuário)
    await this.sessionModel.findOneAndUpdate(
      { userId },
      {
        userId,
        sessionToken,
        deviceInfo,
        ipAddress,
        userAgent,
        isActive: true,
        expiresAt,
        lastActivity: now,
      },
      { upsert: true, new: true }
    );

    return sessionToken;
  }

  async createOrUpdateSessionWithToken(
    userId: string,
    deviceInfo: string,
    ipAddress: string,
    userAgent: string,
    jwtToken: string
  ): Promise<string> {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
    const now = new Date();

    // Atualizar ou criar sessão (apenas uma por usuário) com o JWT token
    const result = await this.sessionModel.findOneAndUpdate(
      { userId },
      {
        userId,
        sessionToken: jwtToken, // Usar o JWT token como sessionToken
        deviceInfo,
        ipAddress,
        userAgent,
        isActive: true,
        expiresAt,
        lastActivity: now,
      },
      { upsert: true, new: true }
    );

    return jwtToken;
  }

  async validateSession(sessionToken: string): Promise<string | null> {
    const session = await this.sessionModel.findOne({
      sessionToken,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return null;
    }

    // Atualizar última atividade
    await this.sessionModel.updateOne({ _id: session._id }, { lastActivity: new Date() });

    return session.userId.toString();
  }

  async refreshSession(sessionToken: string): Promise<string | null> {
    const session = await this.sessionModel.findOne({
      sessionToken,
      isActive: true,
    });

    if (!session) {
      return null;
    }

    const newToken = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.sessionModel.updateOne(
      { _id: session._id },
      {
        sessionToken: newToken,
        expiresAt,
        lastActivity: new Date(),
      }
    );

    return newToken;
  }

  async invalidateSession(sessionToken: string): Promise<void> {
    await this.sessionModel.updateOne({ sessionToken }, { isActive: false });
  }

  async invalidateUserSessions(userId: string): Promise<void> {
    await this.sessionModel.updateMany({ userId }, { isActive: false });
  }

  async cleanExpiredSessions(): Promise<void> {
    await this.sessionModel.deleteMany({
      $or: [{ expiresAt: { $lt: new Date() } }, { isActive: false }],
    });
  }

  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Método para buscar sessão por token (para o interceptor)
  async findSessionByToken(sessionToken: string): Promise<UserSession | null> {
    return await this.sessionModel.findOne({ sessionToken });
  }

  // Método para atualizar última atividade (para o interceptor)
  async updateSessionActivity(sessionToken: string): Promise<void> {
    await this.sessionModel.updateOne({ sessionToken }, { lastActivity: new Date() });
  }

  async updateSessionToken(userId: string, newToken: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

    await this.sessionModel.findOneAndUpdate(
      { userId, isActive: true },
      {
        sessionToken: newToken,
        expiresAt,
        lastActivity: new Date(),
      }
    );
  }
}
