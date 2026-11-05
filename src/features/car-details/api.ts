import type { CarDetails } from "./model";
import { carDetailsMock } from "./api.mock";

export interface CarDetailsApi {
  /** Throws a `not_found` AppError for an unknown id. */
  getCarDetails(id: string): Promise<CarDetails>;
}

/**
 * The mock remains the active implementation until the detail endpoint is
 * integrated in the next fraction.
 */
export const carDetailsApi: CarDetailsApi = carDetailsMock;
