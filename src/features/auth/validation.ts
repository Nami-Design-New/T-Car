import { z } from 'zod';
import { profileFieldsSchema } from '@/shared/lib/validation/profile';
import { phoneValueSchema } from '@/shared/lib/validation/phone';

// Auth form schemas (doc 9). Messages are `errors.*` keys, never user text.
// The client resolves forms with them and the Server Actions parse them again.
/** Length of the one-time code the backend sends. */
export const OTP_LENGTH = 4;

const code = z
  .string({ error: 'auth.invalidCode' })
  .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), { error: 'auth.invalidCode' });

/** Login phone with a separate calling code and normalized national number. */
export const phoneSchema = z.object({ phone: phoneValueSchema });

/** OTP step: the code the customer typed. */
export const otpCodeSchema = z.object({ code });

/** What `verifyOtpAction` receives: the phone the code was sent to, and the code. */
export const verifyOtpSchema = z.object({ phone: phoneValueSchema, code });

/** Registration step: the profile fields (consent is implied by continuing). */
export const registerFormSchema = profileFieldsSchema;

const invalidLocation = { error: 'auth.invalidLocation' } as const;

/**
 * Location step: what `MapLocationModal` picked, as `/assign-location` takes it.
 * The backend requires a region; when the geocoder has none, the address is sent.
 */
export const locationSchema = z
  .object(
    {
      lat: z.number(invalidLocation).min(-90, invalidLocation).max(90, invalidLocation),
      lng: z.number(invalidLocation).min(-180, invalidLocation).max(180, invalidLocation),
      address: z.string(invalidLocation).trim().min(1, invalidLocation),
      region: z.string(invalidLocation).trim().optional(),
    },
    invalidLocation
  )
  .transform(({ lat, lng, address, region }) => ({
    latitude: lat,
    longitude: lng,
    addressName: address,
    region: region || address,
  }));

export type PhoneFormInput = z.input<typeof phoneSchema>;
export type PhoneFormValues = z.output<typeof phoneSchema>;
export type OtpCodeValues = z.infer<typeof otpCodeSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
