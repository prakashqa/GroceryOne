/**
 * Shared fixtures for receipt generator tests.
 */

import { MerchantInfo, ReceiptItem, ReceiptTranslations } from '../receiptGenerator';

export const mockMerchantInfo: MerchantInfo = {
  name: 'Prakash Groceries',
  address: '123 Test Street, Hyderabad',
};

export const mockMerchantInfoNoAddress: MerchantInfo = {
  name: 'No Address Store',
};

export const mockItems: ReceiptItem[] = [
  {
    name: 'Aashirvaad Atta',
    quantity: 5,
    unit: 'kg',
    categoryId: 'atta',
    categoryName: 'Atta, Rice & Grains',
    categoryIcon: '🌾',
  },
  {
    name: 'Fortune Chakki Atta',
    quantity: 5,
    unit: 'kg',
    categoryId: 'atta',
    categoryName: 'Atta, Rice & Grains',
    categoryIcon: '🌾',
  },
  {
    name: 'Basmati Rice',
    quantity: 1,
    unit: 'kg',
    categoryId: 'atta',
    categoryName: 'Atta, Rice & Grains',
    categoryIcon: '🌾',
  },
  {
    name: 'Brown Rice',
    quantity: 1,
    unit: 'kg',
    categoryId: 'atta',
    categoryName: 'Atta, Rice & Grains',
    categoryIcon: '🌾',
  },
];

export const teluguTranslations: ReceiptTranslations = {
  title: 'పికింగ్ జాబితా',
  date: 'తేదీ',
  time: 'సమయం',
  categories: 'వర్గాలు',
  uniqueItems: 'ప్రత్యేక వస్తువులు',
  totalQuantity: 'మొత్తం పరిమాణం',
  item: 'వస్తువు',
  qty: 'పరిమాణం',
  footer: 'ధన్యవాదాలు! మాతో షాపింగ్ చేయండి',
  categoryName: 'వర్గం పేరు',
  itemName: 'వస్తువు పేరు',
  quantity: 'పరిమాణం',
  noHeader: 'న',
  itemHeader: 'వస్తువు',
  qtyShort: 'పరి',
  rateHeader: 'రేటు',
  amtHeader: 'అమౌంట్',
};

export const teluguItems: ReceiptItem[] = [
  {
    name: 'ఆశీర్వాద్ ఆటా',
    quantity: 5,
    unit: 'కి.గ్రా',
    categoryId: 'atta',
    categoryName: 'ఆటా, బియ్యం & ధాన్యాలు',
    categoryIcon: '🌾',
  },
  {
    name: 'తూర్ దాల్',
    quantity: 1,
    unit: 'కి.గ్రా',
    categoryId: 'dal',
    categoryName: 'పప్పులు & దినుసులు',
    categoryIcon: '🫘',
  },
];
