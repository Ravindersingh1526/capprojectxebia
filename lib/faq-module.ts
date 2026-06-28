import type { Amenity, RoomType } from '@/lib/types';
import { mockDataStore } from '@/lib/mock-data';

export interface FAQModule {
  getHotelInfo(topic: string): string | null;
  getCheckInTime(): string;
  getCheckOutTime(): string;
  getAmenities(): Amenity[];
  getPolicy(policyType: string): string | null;
  getRoomPricing(): RoomType[];
}

class FAQModuleImpl implements FAQModule {
  getHotelInfo(topic: string): string | null {
    switch (topic) {
      case 'check_in_time':
        return this.getCheckInTime();
      case 'check_out_time':
        return this.getCheckOutTime();
      case 'amenities':
        return this.getAmenities()
          .map((a) => `${a.name}: ${a.description}`)
          .join('\n');
      case 'cancellation_policy':
        return this.getPolicy('cancellation');
      case 'pet_policy':
        return this.getPolicy('pets');
      case 'smoking_policy':
        return this.getPolicy('smoking');
      case 'parking':
        return this.getPolicy('parking');
      case 'room_pricing':
        return this.getRoomPricing()
          .map((r) => `${r.name}: ₹${r.pricePerNight} per night`)
          .join('\n');
      default:
        return null;
    }
  }

  getCheckInTime(): string {
    return mockDataStore.getPolicies().checkInTime;
  }

  getCheckOutTime(): string {
    return mockDataStore.getPolicies().checkOutTime;
  }

  getAmenities(): Amenity[] {
    return mockDataStore.getAmenities();
  }

  getPolicy(policyType: string): string | null {
    const policies = mockDataStore.getPolicies();

    switch (policyType) {
      case 'cancellation':
        return policies.cancellation;
      case 'pets':
        return policies.pets;
      case 'smoking':
        return policies.smoking;
      case 'parking':
        return policies.parking;
      default:
        return null;
    }
  }

  getRoomPricing(): RoomType[] {
    return mockDataStore.getRoomTypes();
  }
}

export const faqModule: FAQModule = new FAQModuleImpl();
