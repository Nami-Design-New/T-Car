'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FiSearch, FiSliders, FiX } from 'react-icons/fi';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-fade';

import { IMAGES } from '@/shared/config/assets';
const hero1 = IMAGES.heroOne;
const hero2 = IMAGES.heroTwo;
const hero3 = IMAGES.heroThree;

import RentalTabs from './RentalTabs';
import CarFilters from '@/features/cars/components/CarFilters';
import type { CarBrand } from '@/features/cars/model';
import { applyCarFilterDraft, type CarFilterDraft } from '@/features/cars/searchParams';

const PickupTypeModal = dynamic(() => import('./PickupTypeModal'), { ssr: false });
const MapLocationModal = dynamic(() => import('./MapLocationModal'), { ssr: false });
const BranchModal = dynamic(() => import('./BranchModal'), { ssr: false });
const AirportModal = dynamic(() => import('./AirportModal'), { ssr: false });
const StationModal = dynamic(() => import('./StationModal'), { ssr: false });
const CountryModal = dynamic(() => import('./CountryModal'), { ssr: false });

import type {
  RentalType,
  PickupType,
  Branch,
  Airport,
  Station,
  LocationData,
  Country,
  RentalSearchOptions,
} from '../model';

interface Props {
  options: RentalSearchOptions;
  brands: CarBrand[];
}

const slides = [hero1, hero2, hero3];

export default function Hero({ options, brands }: Props) {
  const t = useTranslations();

  const router = useRouter();
  const currentSearchParams = useSearchParams();

  const [rentalType, setRentalType] = useState<RentalType | null>(null);

  // Pickup
  const [showPickupModal, setShowPickupModal] = useState(false);

  // Map
  const [showMapModal, setShowMapModal] = useState(false);

  // Branch
  const [showBranchModal, setShowBranchModal] = useState(false);

  // Airport
  const [showAirportModal, setShowAirportModal] = useState(false);

  // Station
  const [showStationModal, setShowStationModal] = useState(false);

  // Country (international)
  const [showCountryModal, setShowCountryModal] = useState(false);

  // Selected Data
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);

  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const navigateToCars = (params: URLSearchParams) => {
    if (rentalType) params.set('type', rentalType);
    router.push(`/cars?${params.toString()}`);
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const query = search.trim();
    if (query) params.set('q', query);
    navigateToCars(params);
  };

  const handleFiltersApply = (filters: CarFilterDraft) => {
    const params = applyCarFilterDraft(new URLSearchParams(currentSearchParams.toString()), filters);
    setShowFilters(false);
    navigateToCars(params);
  };

  useEffect(() => {
    if (!showFilters) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowFilters(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [showFilters]);

  const goToCars = (params: Record<string, string | number>) => {
    if (!rentalType) return;

    const searchParams = new URLSearchParams({ type: rentalType });

    // Earlier steps of the flow: before, these were logged and then dropped.
    if (selectedAirport) searchParams.set('airportId', String(selectedAirport.id));
    if (selectedStation) searchParams.set('stationId', String(selectedStation.id));
    if (selectedCountry) searchParams.set('countryId', String(selectedCountry.id));

    Object.entries(params).forEach(([key, value]) => {
      searchParams.set(key, String(value));
    });

    router.push(`/cars?${searchParams.toString()}`);
  };

  // ===========================
  // Rental Type
  // ===========================

  const handleRentalSelect = (type: RentalType) => {
    setRentalType(type);
    setSelectedLocation(null);
    setSelectedBranch(null);
    setSelectedAirport(null);
    setSelectedStation(null);
    setSelectedCountry(null);

    switch (type) {
      case 'daily':
      case 'monthly':
        setShowPickupModal(true);
        break;

      case 'international':
        setShowCountryModal(true);
        break;

      case 'airport':
        setShowAirportModal(true);
        break;

      case 'station':
        setShowStationModal(true);
        break;
    }
  };

  // ===========================
  // Pickup
  // ===========================

  const handlePickupSelect = (type: PickupType) => {
    setShowPickupModal(false);

    if (type === 'delivery') {
      setShowMapModal(true);
    } else {
      setShowBranchModal(true);
    }
  };

  // ===========================
  // Branch
  // ===========================

  const handleBranchConfirm = (branch: Branch) => {
    setSelectedBranch(branch);

    setShowBranchModal(false);
    goToCars({
      branchId: branch.id,
      address: branch.address,
    });
  };

  // ===========================
  // Airport
  // ===========================

  const handleAirportConfirm = (airport: Airport) => {
    setSelectedAirport(airport);

    setShowAirportModal(false);

    setShowMapModal(true);
  };

  // ===========================
  // Station
  // ===========================

  const handleStationConfirm = (station: Station) => {
    setSelectedStation(station);

    setShowStationModal(false);

    setShowMapModal(true);
  };

  // ===========================
  // Country (international)
  // ===========================

  const handleCountryConfirm = (country: Country) => {
    setSelectedCountry(country);

    setShowCountryModal(false);

    // after choosing country, show pickup type modal
    setShowPickupModal(true);
  };

  // ===========================
  // Location
  // ===========================

  const handleLocationConfirm = (location: LocationData) => {
    setSelectedLocation(location);

    setShowMapModal(false);
    goToCars({
      lat: location.lat,
      lng: location.lng,
      address: location.address,
    });
  };

  return (
    <section className={`hero_section${showFilters ? ' has-filter-drawer' : ''}`}>
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        speed={1500}
        loop
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        className="hero_swiper"
      >
        {slides.map((image, index) => (
          <SwiperSlide key={image.src}>
            <div className="hero_slide" style={{ position: 'relative' }}>
              <Image
                src={image}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="hero_overlay" aria-hidden="true" />

      <div className="hero_content">
        <span className="hero_eyebrow">{t('rentalSearch.hero.eyebrow')}</span>
        <h1>{t('rentalSearch.hero.title')}</h1>
        <p>{t('rentalSearch.hero.subtitle')}</p>
      </div>

      <div className="hero_filter">
        <form className="hero_search" onSubmit={handleSearch}>
          <div className="hero_search_field">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('cars.filters.searchPlaceholder')}
              aria-label={t('cars.filters.searchPlaceholder')}
            />
          </div>
          <button type="submit" className="hero_search_submit">
            <FiSearch aria-hidden="true" />
            <span>{t('search.submit')}</span>
          </button>
          <button
            type="button"
            className="hero_filter_toggle"
            onClick={() => setShowFilters(true)}
            aria-label={t('cars.filters.open')}
            title={t('cars.filters.open')}
          >
            <FiSliders aria-hidden="true" />
          </button>
        </form>
        <RentalTabs onSelect={handleRentalSelect} />
      </div>
      {showFilters && (
        <>
          <button
            type="button"
            className="hero_filter_drawer_backdrop"
            onClick={() => setShowFilters(false)}
            aria-label={t('cars.filters.close')}
          />
          <aside
            className="hero_filter_drawer"
            aria-label={t('cars.filters.title')}
            aria-modal="true"
            role="dialog"
          >
            <header className="hero_filter_drawer_header">
              <button
                type="button"
                className="hero_filter_drawer_close"
                onClick={() => setShowFilters(false)}
                aria-label={t('cars.filters.close')}
              >
                <FiX aria-hidden="true" />
              </button>
            </header>
            <div className="hero_filter_drawer_body">
              <CarFilters brands={brands} onApply={handleFiltersApply} />
            </div>
          </aside>
        </>
      )}

      {/* Pickup */}

      <CountryModal
        open={showCountryModal}
        countries={options.countries}
        onClose={() => setShowCountryModal(false)}
        onSelect={handleCountryConfirm}
      />

      <PickupTypeModal
        open={showPickupModal}
        onClose={() => setShowPickupModal(false)}
        onSelect={handlePickupSelect}
      />

      {/* Airport */}

      <AirportModal
        open={showAirportModal}
        airports={options.airports}
        onClose={() => setShowAirportModal(false)}
        onSelect={handleAirportConfirm}
      />

      {/* Station */}

      <StationModal
        open={showStationModal}
        stations={options.stations}
        onClose={() => setShowStationModal(false)}
        onSelect={handleStationConfirm}
      />

      {/* Map */}

      {showMapModal && (
        <MapLocationModal
          open
          onClose={() => setShowMapModal(false)}
          onConfirm={handleLocationConfirm}
        />
      )}

      {/* Branch */}

      <BranchModal
        open={showBranchModal}
        branches={options.branches}
        onClose={() => setShowBranchModal(false)}
        onSelect={handleBranchConfirm}
      />
    </section>
  );
}
