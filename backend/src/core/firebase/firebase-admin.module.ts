/**
 * Firebase Admin Module
 * Provides a global Firebase Admin SDK instance for FCM push notifications.
 * Uses Application Default Credentials (ADC) on Cloud Run.
 * For local dev, set GOOGLE_APPLICATION_CREDENTIALS env var to a service account JSON path.
 */

import { Module, Global, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseAdminService } from './firebase-admin.service';

const FIREBASE_APP = 'FIREBASE_APP';

@Global()
@Module({
  providers: [
    {
      provide: FIREBASE_APP,
      useFactory: () => {
        const logger = new Logger('FirebaseAdminModule');

        if (admin.apps.length > 0) {
          logger.log('Reusing existing Firebase Admin app');
          return admin.apps[0];
        }

        try {
          const app = admin.initializeApp({
            credential: admin.credential.applicationDefault(),
          });
          logger.log('Firebase Admin SDK initialized successfully');
          return app;
        } catch (error) {
          logger.warn(
            'Firebase Admin SDK initialization failed. ' +
              'FCM push notifications will be unavailable. ' +
              'Set GOOGLE_APPLICATION_CREDENTIALS for local development. ' +
              `Error: ${error.message}`,
          );
          return null;
        }
      },
    },
    FirebaseAdminService,
  ],
  exports: [FIREBASE_APP, FirebaseAdminService],
})
export class FirebaseAdminModule {}
