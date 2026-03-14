import enCommon from '../locales/en/common.json';
import teCommon from '../locales/te/common.json';
import enProfile from '../locales/en/profile.json';
import teProfile from '../locales/te/profile.json';

describe('Translation Parity Tests', () => {
  /**
   * Recursively gets all keys from a nested object
   * Example: { a: { b: 'value' } } => ['a.b']
   */
  function getNestedKeys(obj: any, prefix = ''): string[] {
    let keys: string[] = [];

    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (
        typeof obj[key] === 'object' &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        keys = keys.concat(getNestedKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }

    return keys;
  }

  /**
   * Gets a nested value from an object using dot notation
   * Example: getNestedValue({ a: { b: 'value' } }, 'a.b') => 'value'
   */
  function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }

  describe('Telugu common.json', () => {
    const enKeys = getNestedKeys(enCommon);
    const teKeys = getNestedKeys(teCommon);

    it('should have all English keys present', () => {
      const missingKeys = enKeys.filter(key => !teKeys.includes(key));

      expect(missingKeys).toEqual([]);
      // If test fails, error message will show: "Expected [] but received ['dashboard.title', 'dashboard.greeting', ...]"
    });

    it('should have dashboard section with all required keys', () => {
      const requiredDashboardKeys = [
        'dashboard.title',
        'dashboard.greeting',
        'dashboard.todaysOverview',
        'dashboard.cartsCreated',
        'dashboard.itemsPicked',
        'dashboard.totalQuantity',
        'dashboard.salesAmount',
        'dashboard.cartStatus',
        'dashboard.draft',
        'dashboard.printed',
        'dashboard.paid',
        'dashboard.completed',
        'dashboard.quickActions',
        'dashboard.newCart',
        'dashboard.scanList',
        'dashboard.viewCarts',
        'dashboard.manageItems',
        'dashboard.startPicking',
        'dashboard.ocrFromPaper',
        'dashboard.seeAllCarts',
        'dashboard.categoriesItems',
        'dashboard.activeCart',
        'dashboard.continue',
        'dashboard.recentCarts',
        'dashboard.viewAll',
        'dashboard.noCartsToday',
        'dashboard.noRecentCarts',
        'dashboard.items',
        'dashboard.qty',
        'dashboard.lastUpdated',
        'dashboard.resumeDraft',
        'dashboard.todaysReport',
        'dashboard.viewSummary',
        'dashboard.startByCreating',
        'dashboard.reports',
        'dashboard.viewAnalytics',
      ];

      const missingKeys = requiredDashboardKeys.filter(
        key => getNestedValue(teCommon, key) === undefined
      );

      expect(missingKeys).toEqual([]);
    });

    it('should have picking section keys in correct namespace', () => {
      const requiredPickingKeys = [
        'picking.createCart',
        'picking.cartName',
        'picking.enterCartName',
        'picking.create',
        'picking.duplicateName',
      ];

      const missingKeys = requiredPickingKeys.filter(
        key => getNestedValue(teCommon, key) === undefined
      );

      expect(missingKeys).toEqual([]);
    });

    it('should have manageCategories section with all required keys', () => {
      const requiredKeys = [
        'manageCategories.title',
        'manageCategories.searchCategories',
        'manageCategories.categories',
        'manageCategories.addCategory',
        'manageCategories.editCategory',
        'manageCategories.categoryName',
        'manageCategories.enterCategoryName',
        'manageCategories.icon',
        'manageCategories.selectIcon',
        'manageCategories.selected',
        'manageCategories.duplicateName',
        'manageCategories.noCategoriesYet',
        'manageCategories.createFirstCategory',
        'manageCategories.categoriesCount',
        'manageCategories.categoriesCount_plural',
        'manageCategories.deleteCategory',
        'manageCategories.deleteConfirm',
        'manageCategories.itemsInCategory',
        'manageCategories.moveItemsTo',
        'manageCategories.deleteItems',
      ];

      const missingKeys = requiredKeys.filter(
        key => getNestedValue(teCommon, key) === undefined
      );

      expect(missingKeys).toEqual([]);
    });

    it('should have deleteConfirmModal section with all required keys', () => {
      const requiredKeys = [
        'deleteConfirmModal.deleteItem',
        'deleteConfirmModal.deleteCategory',
        'deleteConfirmModal.confirmDelete',
        'deleteConfirmModal.cartWarning',
        'deleteConfirmModal.categoryItemsQuestion',
        'deleteConfirmModal.categoryItemsQuestion_plural',
        'deleteConfirmModal.deleteAllItems',
        'deleteConfirmModal.moveItemsToAnother',
        'deleteConfirmModal.moveAndDelete',
      ];

      const missingKeys = requiredKeys.filter(
        key => getNestedValue(teCommon, key) === undefined
      );

      expect(missingKeys).toEqual([]);
    });

    it('should have dashboard greeting keys', () => {
      const requiredKeys = [
        'dashboard.goodMorning',
        'dashboard.goodAfternoon',
        'dashboard.goodEvening',
      ];

      const missingKeys = requiredKeys.filter(
        key => getNestedValue(teCommon, key) === undefined
      );

      expect(missingKeys).toEqual([]);
    });

    it('should have time section with all required keys including yesterday', () => {
      const requiredKeys = [
        'time.justNow',
        'time.minutesAgo',
        'time.hoursAgo',
        'time.yesterday',
        'time.daysAgo',
        'time.daysAgo_plural',
      ];

      const missingKeys = requiredKeys.filter(
        key => getNestedValue(teCommon, key) === undefined
      );

      expect(missingKeys).toEqual([]);
    });

    it('should have payment and picking payment keys for PaymentModal and CartScreen', () => {
      const requiredPaymentKeys = [
        'picking.confirmPayment',
        'picking.totalAmount',
        'picking.paymentReceived',
        'picking.paidAt',
        'picking.markPaymentDone',
        'payment.paymentSuccessful',
        'payment.returnChange',
        'payment.receivedAmount',
        'payment.cash',
        'payment.cashDesc',
        'payment.upi',
        'payment.upiDesc',
        'payment.card',
        'payment.cardDesc',
      ];

      const missingKeys = requiredPaymentKeys.filter(
        key => getNestedValue(teCommon, key) === undefined
      );

      expect(missingKeys).toEqual([]);
    });

    it('should not have empty string values', () => {
      const keysWithEmptyValues = teKeys.filter(key => {
        const teValue = getNestedValue(teCommon, key);
        return teValue === '';
      });

      expect(keysWithEmptyValues).toEqual([]);
    });

    it('should have matching structure to English', () => {
      // Verify top-level sections match
      const enSections = Object.keys(enCommon);
      const teSections = Object.keys(teCommon);

      const missingSections = enSections.filter(
        section => !teSections.includes(section)
      );

      expect(missingSections).toEqual([]);
    });
  });

  describe('Telugu profile.json', () => {
    const enKeys = getNestedKeys(enProfile);
    const teKeys = getNestedKeys(teProfile);

    it('should have all English keys present', () => {
      const missingKeys = enKeys.filter(key => !teKeys.includes(key));

      expect(missingKeys).toEqual([]);
    });

    it('should have matching structure to English', () => {
      const enSections = Object.keys(enProfile);
      const teSections = Object.keys(teProfile);

      const missingSections = enSections.filter(
        section => !teSections.includes(section)
      );

      expect(missingSections).toEqual([]);
    });

    it('should have payment settings keys including missing ones', () => {
      const requiredKeys = [
        'settings.payment.title',
        'settings.payment.upiSettings',
        'settings.payment.merchantUpiId',
        'settings.payment.merchantName',
        'settings.payment.upiSection',
        'settings.payment.upiIdHelper',
        'settings.payment.merchantNameHelper',
        'settings.payment.infoText',
      ];

      const missingKeys = requiredKeys.filter(
        key => getNestedValue(teProfile, key) === undefined
      );

      expect(missingKeys).toEqual([]);
    });

    it('should have network printer modal keys', () => {
      const requiredKeys = [
        'settings.printer.networkModal.title',
        'settings.printer.networkModal.addManually',
        'settings.printer.networkModal.ipAddress',
        'settings.printer.networkModal.port',
        'settings.printer.networkModal.printerNameOptional',
        'settings.printer.networkModal.addPrinter',
        'settings.printer.networkModal.scanNetwork',
        'settings.printer.networkModal.stopScanning',
        'settings.printer.networkModal.noPrintersFound',
        'settings.printer.networkModal.commonPorts',
        'settings.printer.networkModal.removePrinter',
        'settings.printer.networkModal.remove',
      ];

      const missingKeys = requiredKeys.filter(
        key => getNestedValue(teProfile, key) === undefined
      );

      expect(missingKeys).toEqual([]);
    });

    it('should have Telugu Unicode characters for Telugu translations', () => {
      const teValues = teKeys
        .map(key => getNestedValue(teProfile, key))
        .filter(value => typeof value === 'string');

      const teluguValues = teValues.filter(value =>
        /[\u0C00-\u0C7F]/.test(value)
      );

      expect(teluguValues.length).toBeGreaterThan(0);
    });
  });

  describe('Branding — GroOne not GroceryOne', () => {
    it('should use "GroOne" not "GroceryOne" in English about text', () => {
      const aboutText = enCommon.more.about;
      expect(aboutText).toContain('GroOne');
      expect(aboutText).not.toContain('GroceryOne');
    });

    it('should use "GroOne" not "GroceryOne" in Telugu about text', () => {
      const aboutText = teCommon.more.about;
      expect(aboutText).toContain('GroOne');
      expect(aboutText).not.toContain('GroceryOne');
    });
  });

  describe('Translation Value Quality', () => {
    it('should have Telugu Unicode characters for Telugu translations', () => {
      const teKeys = getNestedKeys(teCommon);
      const teValues = teKeys
        .map(key => getNestedValue(teCommon, key))
        .filter(value => typeof value === 'string');

      // Check if at least some values contain Telugu Unicode range (0C00-0C7F)
      const teluguValues = teValues.filter(value =>
        /[\u0C00-\u0C7F]/.test(value)
      );

      expect(teluguValues.length).toBeGreaterThan(0);
    });

    it('should not have untranslated English text for dashboard section', () => {
      const dashboardKeys = getNestedKeys(enCommon).filter(key =>
        key.startsWith('dashboard.')
      );

      dashboardKeys.forEach(key => {
        const enValue = getNestedValue(enCommon, key);
        const teValue = getNestedValue(teCommon, key);

        // If Telugu translation exists, it should not be identical to English
        if (teValue !== undefined) {
          expect(teValue).not.toBe(enValue);
        }
      });
    });
  });
});
