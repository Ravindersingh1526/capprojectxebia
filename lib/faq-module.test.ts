import { describe, it, expect } from 'vitest';
import { faqModule } from '@/lib/faq-module';

describe('FAQModule', () => {
  describe('getCheckInTime', () => {
    it('returns the hotel check-in time', () => {
      const result = faqModule.getCheckInTime();
      expect(result).toBe('2:00 PM');
    });
  });

  describe('getCheckOutTime', () => {
    it('returns the hotel check-out time', () => {
      const result = faqModule.getCheckOutTime();
      expect(result).toBe('12:00 PM');
    });
  });

  describe('getAmenities', () => {
    it('returns the complete list of amenities', () => {
      const amenities = faqModule.getAmenities();
      expect(amenities.length).toBeGreaterThanOrEqual(5);
    });

    it('each amenity has a name and description', () => {
      const amenities = faqModule.getAmenities();
      for (const amenity of amenities) {
        expect(amenity.name).toBeTruthy();
        expect(amenity.description).toBeTruthy();
      }
    });
  });

  describe('getPolicy', () => {
    it('returns cancellation policy', () => {
      const result = faqModule.getPolicy('cancellation');
      expect(result).toBeTruthy();
      expect(result).toContain('cancellation');
    });

    it('returns pet policy', () => {
      const result = faqModule.getPolicy('pets');
      expect(result).toBeTruthy();
    });

    it('returns smoking policy', () => {
      const result = faqModule.getPolicy('smoking');
      expect(result).toBeTruthy();
    });

    it('returns parking policy', () => {
      const result = faqModule.getPolicy('parking');
      expect(result).toBeTruthy();
    });

    it('returns null for unknown policy type', () => {
      const result = faqModule.getPolicy('unknown_policy');
      expect(result).toBeNull();
    });
  });

  describe('getRoomPricing', () => {
    it('returns room types with pricing', () => {
      const rooms = faqModule.getRoomPricing();
      expect(rooms.length).toBeGreaterThanOrEqual(3);
    });

    it('each room has a positive price', () => {
      const rooms = faqModule.getRoomPricing();
      for (const room of rooms) {
        expect(room.pricePerNight).toBeGreaterThan(0);
      }
    });
  });

  describe('getHotelInfo', () => {
    it('routes check_in_time topic correctly', () => {
      const result = faqModule.getHotelInfo('check_in_time');
      expect(result).toBe('2:00 PM');
    });

    it('routes check_out_time topic correctly', () => {
      const result = faqModule.getHotelInfo('check_out_time');
      expect(result).toBe('12:00 PM');
    });

    it('routes amenities topic and formats as string', () => {
      const result = faqModule.getHotelInfo('amenities');
      expect(result).toBeTruthy();
      expect(result).toContain('Swimming Pool');
      expect(result).toContain('Fitness Centre');
    });

    it('routes cancellation_policy topic correctly', () => {
      const result = faqModule.getHotelInfo('cancellation_policy');
      expect(result).toBeTruthy();
      expect(result).toContain('cancellation');
    });

    it('routes pet_policy topic correctly', () => {
      const result = faqModule.getHotelInfo('pet_policy');
      expect(result).toBeTruthy();
    });

    it('routes smoking_policy topic correctly', () => {
      const result = faqModule.getHotelInfo('smoking_policy');
      expect(result).toBeTruthy();
      expect(result).toContain('smoke');
    });

    it('routes parking topic correctly', () => {
      const result = faqModule.getHotelInfo('parking');
      expect(result).toBeTruthy();
      expect(result).toContain('parking');
    });

    it('routes room_pricing topic and formats as string', () => {
      const result = faqModule.getHotelInfo('room_pricing');
      expect(result).toBeTruthy();
      expect(result).toContain('Deluxe Room');
      expect(result).toContain('₹');
      expect(result).toContain('per night');
    });

    it('returns null for unknown topics', () => {
      const result = faqModule.getHotelInfo('unknown_topic');
      expect(result).toBeNull();
    });

    it('returns null for empty string topic', () => {
      const result = faqModule.getHotelInfo('');
      expect(result).toBeNull();
    });
  });
});
