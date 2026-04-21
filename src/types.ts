/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ItemType = 'lost' | 'found';

export interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  type: ItemType;
  reporterName: string;
  reporterEmail: string;
  reporterId: string;
  reporterPhone?: string;
  reporterRollNo?: string;
  reporterAvatarUrl?: string;
  imageUrl?: string;
  createdAt: string;
}

export const CATEGORIES = [
  'Electronics',
  'Books',
  'IDs & Cards',
  'Keys',
  'Clothing',
  'Bags & Wallets',
  'Other'
];
