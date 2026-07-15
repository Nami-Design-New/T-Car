'use client';

import { useState } from 'react';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-fade';

import hero1 from '../../../assets/images/hero1.jpg';
import hero2 from '../../../assets/images/hero2.png';
import hero3 from '../../../assets/images/hero3.png';

import RentalTabs from './RentalTabs';

import PickupTypeModal from '@/components/modals/PickupTypeModal';
import MapLocationModal from '@/components/modals/MapLocationModal';
import BranchModal from '@/components/modals/BranchModal';
import AirportModal from '@/components/modals/AirportModal';
import StationModal from '@/components/modals/StationModal';

import { useTranslation } from 'react-i18next';
import { RentalType, PickupType, Branch, Airport, Station, LocationData } from '@/types/car';

const slides = [hero1.src, hero2.src, hero3.src];

export default function Hero() {
  const { t } = useTranslation();

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

  // Selected Data
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);

  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // ===========================
  // Rental Type
  // ===========================

  const handleRentalSelect = (type: RentalType) => {
    setRentalType(type);

    switch (type) {
      case 'daily':
      case 'monthly':
      case 'international':
        setShowPickupModal(true);
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

    console.log(branch);

    // DateTimeModal
  };

  // ===========================
  // Airport
  // ===========================

  const handleAirportConfirm = (airport: Airport) => {
    setSelectedAirport(airport);

    setShowAirportModal(false);

    setShowMapModal(true);

    console.log(airport);

    // DateTimeModal
  };

  // ===========================
  // Station
  // ===========================

  const handleStationConfirm = (station: Station) => {
    setSelectedStation(station);

    setShowStationModal(false);

    setShowMapModal(true);

    console.log(station);

    // DateTimeModal
  };

  // ===========================
  // Location
  // ===========================

  const handleLocationConfirm = (location: LocationData) => {
    setSelectedLocation(location);

    setShowMapModal(false);

    console.log(location);

    // DateTimeModal
  };

  return (
    <section className="hero_section">
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
          <SwiperSlide key={index}>
            <div
              className="hero_slide"
              style={{
                backgroundImage: `url(${image})`,
              }}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="container-tcar">
        <div className="hero_text">
          <h1>{t('hero.title')}</h1>

          <p>{t('hero.subtitle')}</p>
        </div>

        <div className="hero_filter">
          <RentalTabs onSelect={handleRentalSelect} />
        </div>
      </div>

      {/* Pickup */}

      <PickupTypeModal
        open={showPickupModal}
        onClose={() => setShowPickupModal(false)}
        onSelect={handlePickupSelect}
      />

      {/* Airport */}

      <AirportModal
        open={showAirportModal}
        onClose={() => setShowAirportModal(false)}
        onSelect={handleAirportConfirm}
      />

      {/* Station */}

      <StationModal
        open={showStationModal}
        onClose={() => setShowStationModal(false)}
        onSelect={handleStationConfirm}
      />

      {/* Map */}

      <MapLocationModal
        open={showMapModal}
        onClose={() => setShowMapModal(false)}
        onConfirm={handleLocationConfirm}
      />

      {/* Branch */}

      <BranchModal
        open={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        onSelect={handleBranchConfirm}
      />
    </section>
  );
}
