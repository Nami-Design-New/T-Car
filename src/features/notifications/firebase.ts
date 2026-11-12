"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAaffu70zMb7Yh-jhVwZUNNcCBBCx7VaFg",
  authDomain: "tcar-9ab64.firebaseapp.com",
  projectId: "tcar-9ab64",
  storageBucket: "tcar-9ab64.firebasestorage.app",
  messagingSenderId: "739821046146",
  appId: "1:739821046146:web:48954f4c701c9e669de79b",
  measurementId: "G-LYSGYSLNM4",
};

function app() {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

/** Requests browser permission and returns the FCM registration token, if available. */
export async function getFirebaseMessagingToken(): Promise<string | null> {
  if (!(await isSupported()) || !("Notification" in window)) return null;

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
  );
  return getToken(getMessaging(app()), {
    serviceWorkerRegistration: registration,
  });
}

/** Subscribes to messages while the T-Car tab is open. */
export async function listenForFirebaseMessages(
  onForegroundMessage: (payload: MessagePayload) => void,
): Promise<(() => void) | undefined> {
  if (!(await isSupported())) return undefined;
  return onMessage(getMessaging(app()), onForegroundMessage);
}
