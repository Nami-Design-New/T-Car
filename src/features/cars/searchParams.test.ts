import { describe, expect, it } from 'vitest';
import { filterAndSortCars, parseCarSearchParams } from './searchParams';
import type { CarListing } from './model';

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
  it('parses and clamps URL values', () => {
    expect(parseCarSearchParams({ q: ' sedan ', priceMin: '0', priceMax: '99999', sort: 'price_asc' })).toEqual({
      query: 'sedan',
      minPrice: 100,
      maxPrice: 30000,
      sort: 'price_asc',
      context: {},
    });
  });

  it('filters by query and sorts by price', () => {
    const params = parseCarSearchParams({ q: 'road', sort: 'price_desc' });
    expect(filterAndSortCars(cars, params).map((car) => car.id)).toEqual(['b']);
  });
});
