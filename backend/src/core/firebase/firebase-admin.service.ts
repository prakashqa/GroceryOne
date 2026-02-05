/**
 * Firebase Admin Service
 * Provides methods for sending FCM push notifications.
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name);

  constructor(
    @Inject('FIREBASE_APP')
    private readonly firebaseApp: admin.app.App | null,
  ) {}

  /**
   * Check if Firebase is available (initialized successfully)
   */
  isAvailable(): boolean {
    return this.firebaseApp !== null;
  }

  /**
   * Send a push notification to a specific device token
   */
  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<string | null> {
    if (!this.firebaseApp) {
      this.logger.warn(
        'Firebase not initialized. Skipping push notification.',
      );
      return null;
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification: { title, body },
        ...(data && { data }),
      };

      const messageId = await this.firebaseApp.messaging().send(message);
      this.logger.log(`Push notification sent successfully: ${messageId}`);
      return messageId;
    } catch (error) {
      this.logger.error(
        `Failed to send push notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send a push notification to a topic (all subscribed devices)
   */
  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<string | null> {
    if (!this.firebaseApp) {
      this.logger.warn(
        'Firebase not initialized. Skipping topic notification.',
      );
      return null;
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: { title, body },
        ...(data && { data }),
      };

      const messageId = await this.firebaseApp.messaging().send(message);
      this.logger.log(
        `Topic notification sent to "${topic}": ${messageId}`,
      );
      return messageId;
    } catch (error) {
      this.logger.error(
        `Failed to send topic notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send push notifications to multiple device tokens
   */
  async sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<admin.messaging.BatchResponse | null> {
    if (!this.firebaseApp) {
      this.logger.warn(
        'Firebase not initialized. Skipping multicast notification.',
      );
      return null;
    }

    if (tokens.length === 0) {
      this.logger.warn('No tokens provided for multicast notification.');
      return null;
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: { title, body },
        ...(data && { data }),
      };

      const response = await this.firebaseApp
        .messaging()
        .sendEachForMulticast(message);
      this.logger.log(
        `Multicast sent: ${response.successCount} success, ${response.failureCount} failures`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to send multicast notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
