import { describe, expect, it } from 'vitest';
import {
  applyCarFilterDraft,
  filterAndSortCars,
  parseCarFilterDraft,
  parseCarSearchParams,
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
