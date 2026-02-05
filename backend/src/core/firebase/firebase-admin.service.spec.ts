import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseAdminService } from './firebase-admin.service';

describe('FirebaseAdminService', () => {
  describe('when Firebase is not initialized (null)', () => {
    let service: FirebaseAdminService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FirebaseAdminService,
          {
            provide: 'FIREBASE_APP',
            useValue: null,
          },
        ],
      }).compile();

      service = module.get<FirebaseAdminService>(FirebaseAdminService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should report as unavailable', () => {
      expect(service.isAvailable()).toBe(false);
    });

    it('should return null when sending push notification', async () => {
      const result = await service.sendPushNotification(
        'test-token',
        'Test Title',
        'Test Body',
      );
      expect(result).toBeNull();
    });

    it('should return null when sending topic notification', async () => {
      const result = await service.sendToTopic(
        'test-topic',
        'Test Title',
        'Test Body',
      );
      expect(result).toBeNull();
    });

    it('should return null when sending multicast notification', async () => {
      const result = await service.sendMulticast(
        ['token1', 'token2'],
        'Test Title',
        'Test Body',
      );
      expect(result).toBeNull();
    });

    it('should return null for multicast with empty tokens array', async () => {
      const result = await service.sendMulticast(
        [],
        'Test Title',
        'Test Body',
      );
      expect(result).toBeNull();
    });
  });

  describe('when Firebase is initialized', () => {
    let service: FirebaseAdminService;
    let mockSend: jest.Mock;
    let mockSendEachForMulticast: jest.Mock;
    let mockFirebaseApp: any;

    beforeEach(async () => {
      mockSend = jest.fn().mockResolvedValue('mock-message-id');
      mockSendEachForMulticast = jest.fn().mockResolvedValue({
        successCount: 2,
        failureCount: 0,
        responses: [],
      });

      mockFirebaseApp = {
        messaging: () => ({
          send: mockSend,
          sendEachForMulticast: mockSendEachForMulticast,
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FirebaseAdminService,
          {
            provide: 'FIREBASE_APP',
            useValue: mockFirebaseApp,
          },
        ],
      }).compile();

      service = module.get<FirebaseAdminService>(FirebaseAdminService);
    });

    it('should report as available', () => {
      expect(service.isAvailable()).toBe(true);
    });

    it('should send push notification to a device token', async () => {
      const result = await service.sendPushNotification(
        'device-token-123',
        'Order Ready',
        'Your order is ready for pickup',
      );

      expect(result).toBe('mock-message-id');
      expect(mockSend).toHaveBeenCalledWith({
        token: 'device-token-123',
        notification: {
          title: 'Order Ready',
          body: 'Your order is ready for pickup',
        },
      });
    });

    it('should send push notification with optional data payload', async () => {
      const data = { orderId: '456', status: 'ready' };
      await service.sendPushNotification(
        'device-token-123',
        'Order Update',
        'Status changed',
        data,
      );

      expect(mockSend).toHaveBeenCalledWith({
        token: 'device-token-123',
        notification: {
          title: 'Order Update',
          body: 'Status changed',
        },
        data,
      });
    });

    it('should send topic notification', async () => {
      const result = await service.sendToTopic(
        'promotions',
        'New Deal',
        '50% off all vegetables',
      );

      expect(result).toBe('mock-message-id');
      expect(mockSend).toHaveBeenCalledWith({
        topic: 'promotions',
        notification: {
          title: 'New Deal',
          body: '50% off all vegetables',
        },
      });
    });

    it('should send topic notification with optional data payload', async () => {
      const data = { promoCode: 'VEG50' };
      await service.sendToTopic(
        'promotions',
        'New Deal',
        '50% off',
        data,
      );

      expect(mockSend).toHaveBeenCalledWith({
        topic: 'promotions',
        notification: { title: 'New Deal', body: '50% off' },
        data,
      });
    });

    it('should send multicast notification to multiple tokens', async () => {
      const tokens = ['token-1', 'token-2'];
      const result = await service.sendMulticast(
        tokens,
        'Broadcast',
        'Store closing early today',
      );

      expect(result).toEqual({
        successCount: 2,
        failureCount: 0,
        responses: [],
      });
      expect(mockSendEachForMulticast).toHaveBeenCalledWith({
        tokens,
        notification: {
          title: 'Broadcast',
          body: 'Store closing early today',
        },
      });
    });

    it('should return null for multicast with empty tokens array', async () => {
      const result = await service.sendMulticast(
        [],
        'Test',
        'Test Body',
      );
      expect(result).toBeNull();
      expect(mockSendEachForMulticast).not.toHaveBeenCalled();
    });

    it('should throw error when push notification fails', async () => {
      mockSend.mockRejectedValue(new Error('FCM error'));

      await expect(
        service.sendPushNotification('bad-token', 'Title', 'Body'),
      ).rejects.toThrow('FCM error');
    });

    it('should throw error when topic notification fails', async () => {
      mockSend.mockRejectedValue(new Error('Topic error'));

      await expect(
        service.sendToTopic('bad-topic', 'Title', 'Body'),
      ).rejects.toThrow('Topic error');
    });

    it('should throw error when multicast notification fails', async () => {
      mockSendEachForMulticast.mockRejectedValue(
        new Error('Multicast error'),
      );

      await expect(
        service.sendMulticast(['token'], 'Title', 'Body'),
      ).rejects.toThrow('Multicast error');
    });
  });
});
