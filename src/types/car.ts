// Account (profile / wallet / notifications)
export interface UserProfile {
  fullName: string;
  email: string;
  birthDate: string;
  phone: string;
}

export interface AppNotification {
  id: string;
  title: string;
  time: string;
  read: boolean;
}

