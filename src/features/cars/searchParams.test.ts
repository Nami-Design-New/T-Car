import { describe, expect, it } from 'vitest';
import {
  applyCarFilterDraft,
  filterAndSortCars,
  parseCarFilterDraft,
  parseCarSearchParams,
  toCityCarsSearchParams,
  toCityCarsQuery,
  withCityCarsLocation,
} from './searchParams';
import type { CarListing } from './model';

const testPriceRange = { min: 5, max: 30000 };
const settingsPriceRange = { min: 5, max: 55 };

const cars: CarListing[] = [
  {
    id: 'a',
    name: 'City Sedan',
    brand: 'Alpha',
    image: '/a.jpg',
    pricePerDay: 200,
    seats: 5,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    rating: 4.2,
    reviewsCount: 10,
    year: 2024,
    showroom: 'Riyadh',
  },
  {
    id: 'b',
    name: 'Road SUV',
    brand: 'Beta',
    image: '/b.jpg',
    pricePerDay: 100,
    seats: 5,
    transmission: 'Automatic',
    fuelType: 'Electric',
    rating: 4.8,
    reviewsCount: 12,
    year: 2025,
    showroom: 'Jeddah',
  },
];

describe('car search params', () => {
  it('parses URL values and opens bounds clamped to the range edges', () => {
    expect(
      parseCarSearchParams(
        { q: ' sedan ', priceMin: '0', priceMax: '99999', sort: 'price_asc' },
        settingsPriceRange,
      )
    ).toEqual({
      query: 'sedan',
      minPrice: 0,
      maxPrice: Number.POSITIVE_INFINITY,
      brandIds: [],
      types: [],
      companyIds: [],
      serviceIds: [],
      sort: 'price_asc',
      context: {},
    });
  });

  it('lists cars priced outside the site range when the price is not narrowed', () => {
    const params = parseCarSearchParams({}, settingsPriceRange);
    expect(filterAndSortCars(cars, params).map((car) => car.id)).toEqual(['b', 'a']);
  });

  it('filters by a narrowed price range', () => {
    const params = parseCarSearchParams({ priceMax: '150' }, testPriceRange);
    expect(params).toMatchObject({ minPrice: 0, maxPrice: 150 });
    expect(filterAndSortCars(cars, params).map((car) => car.id)).toEqual(['b']);
  });

  it('filters by query and sorts by price', () => {
    const params = parseCarSearchParams(
      { q: 'road', sort: 'price_desc' },
      testPriceRange,
    );
    expect(filterAndSortCars(cars, params).map((car) => car.id)).toEqual(['b']);
  });

  it('round-trips the complete filter draft through URL parameters', () => {
    const draft = parseCarFilterDraft({
      q: ' suv ',
      priceMin: '500',
      brands: 'toyota,nissan,toyota',
      types: ['suv', 'sedan'],
      companies: 'elite',
      services: 'delivery',
    }, testPriceRange);
    const params = applyCarFilterDraft(
      new URLSearchParams(),
      draft,
      testPriceRange,
    );

    expect(params.toString()).toBe(
      'q=suv&priceMin=500&brands=toyota%2Cnissan&types=suv%2Csedan&companies=elite&services=delivery'
    );
    expect(
      parseCarFilterDraft(Object.fromEntries(params.entries()), testPriceRange),
    ).toEqual(draft);
  });
});

describe('toCityCarsQuery', () => {
  const region = 'منطقة الرياض';

  it('sends only the region when nothing is narrowed', () => {
    const params = parseCarSearchParams({}, settingsPriceRange);
    expect(toCityCarsQuery(params)).toEqual({});
  });

  it('sends the search, a narrowed price, and a valid date pair', () => {
    const params = parseCarSearchParams(
      {
        q: ' kia ',
        priceMin: '10',
        priceMax: '40',
        pickupDate: '2026-11-10',
        dropoffDate: '2026-11-12',
      },
      settingsPriceRange,
    );
    expect(toCityCarsQuery(params)).toEqual({
      query: 'kia',
      minPrice: 10,
      maxPrice: 40,
      fromDay: '2026-11-10',
      toDay: '2026-11-12',
    });
  });

  it('sends a minimum of 0 with a narrowed maximum, and a minimum alone', () => {
    expect(
      toCityCarsQuery(parseCarSearchParams({ priceMax: '50' }, settingsPriceRange)),
    ).toEqual({ minPrice: 0, maxPrice: 50 });
    expect(
      toCityCarsQuery(parseCarSearchParams({ priceMin: '20' }, settingsPriceRange)),
    ).toEqual({ minPrice: 20 });
  });

  it('leaves out a lone, malformed, or reversed date pair', () => {
    for (const dates of [
      { pickupDate: '2026-11-10' },
      { pickupDate: '10/11/2026', dropoffDate: '2026-11-12' },
      { pickupDate: '2026-11-12', dropoffDate: '2026-11-10' },
      { pickupDate: '2026-11-10', dropoffDate: '2026-11-10' },
    ]) {
      const params = parseCarSearchParams(dates, settingsPriceRange);
      expect(toCityCarsQuery(params)).toEqual({});
    }
  });

  it('adds saved region and coordinates only as a complete tuple', () => {
    const query = toCityCarsQuery(parseCarSearchParams({}, settingsPriceRange));
    expect(
      withCityCarsLocation(query, {
        region: 'Riyadh Province',
        latitude: 24.7136,
        longitude: 46.6753,
      }),
    ).toEqual({
      region: 'Riyadh Province',
      latitude: 24.7136,
      longitude: 46.6753,
    });
    expect(withCityCarsLocation(query, null)).toEqual({});
  });
});

describe('toCityCarsSearchParams', () => {
  it('requests page 2 for a company after its cars were included in the city group', () => {
    expect(
      toCityCarsSearchParams(
        {
          region: 'Riyadh Province',
          latitude: 24.7136,
          longitude: 46.6753,
          query: 'kia',
          minPrice: 100,
          maxPrice: 400,
          fromDay: '2026-11-10',
          toDay: '2026-11-12',
        },
        2,
        10,
        '12',
      ).toString(),
    ).toBe(
      'per_page=10&page=2&region=Riyadh+Province&latitude=24.7136&longitude=46.6753&search=kia&min_price=100&max_price=400&from_day=2026-11-10&to_day=2026-11-12&company_id=12',
    );
  });
});
