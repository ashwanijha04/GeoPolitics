/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Firebase config. API key is intentionally public — Firebase security
 * is enforced by Database Rules, not by keeping the key secret.
 */

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAJKk4NqzdFVVI0_3pPWPDTCPAiPYamUuo',
  authDomain: 'geopolitics-e18b5.firebaseapp.com',
  databaseURL: 'https://geopolitics-e18b5-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'geopolitics-e18b5',
  storageBucket: 'geopolitics-e18b5.firebasestorage.app',
  messagingSenderId: '212765005765',
  appId: '1:212765005765:web:55cf79e9c64d638d521dac',
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

/** Generate or retrieve a stable local player ID — no Firebase Auth needed. */
export function getOrCreateUid(): Promise<string> {
  const key = 'gs:player-uid';
  let uid = localStorage.getItem(key);
  if (!uid) {
    uid = 'p_' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(key, uid);
  }
  return Promise.resolve(uid);
}

/** 6-char room code, unambiguous charset */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
