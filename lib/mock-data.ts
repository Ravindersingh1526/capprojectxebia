import type { RoomType, HotelPolicies, Amenity, BookingRecord } from '@/lib/types';

export interface MockDataStoreAPI {
  initialize(): void;
  getRoomTypes(): RoomType[];
  getAvailability(roomType: string, date: string): number;
  decrementAvailability(roomType: string, date: string): boolean;
  incrementAvailability(roomType: string, date: string): void;
  getPolicies(): HotelPolicies;
  getAmenities(): Amenity[];
  addBooking(booking: BookingRecord): void;
  getBooking(confirmationNumber: string): BookingRecord | undefined;
  cancelBooking(confirmationNumber: string): boolean;
}

class MockDataStore implements MockDataStoreAPI {
  private roomTypes: RoomType[] = [];
  private availability: Map<string, Map<string, number>> = new Map();
  private policies: HotelPolicies = {
    checkInTime: '',
    checkOutTime: '',
    cancellation: '',
    pets: '',
    smoking: '',
    parking: '',
  };
  private amenities: Amenity[] = [];
  private bookings: BookingRecord[] = [];

  constructor() {
    this.initialize();
  }

  initialize(): void {
    this.roomTypes = [
      {
        id: 'deluxe-room',
        name: 'Deluxe Room',
        description:
          'A spacious and elegantly furnished room with modern amenities, offering a comfortable stay with city views and premium bedding.',
        maxGuests: 2,
        pricePerNight: 8500,
        amenities: [
          'King-size bed',
          'City view',
          'Mini bar',
          'Work desk',
          'Rain shower',
        ],
      },
      {
        id: 'executive-suite',
        name: 'Executive Suite',
        description:
          'A luxurious suite featuring a separate living area, premium furnishings, and exclusive access to the Executive Lounge with complimentary refreshments.',
        maxGuests: 4,
        pricePerNight: 15000,
        amenities: [
          'Separate living area',
          'Executive Lounge access',
          'King-size bed',
          'Bathtub and rain shower',
          'Nespresso machine',
          'City skyline view',
        ],
      },
      {
        id: 'presidential-suite',
        name: 'Presidential Suite',
        description:
          'The finest accommodation at Saltystaz Gurgaon, featuring a grand living room, private dining area, butler service, and panoramic views of the city.',
        maxGuests: 6,
        pricePerNight: 35000,
        amenities: [
          'Grand living room',
          'Private dining area',
          'Butler service',
          'Panoramic city views',
          'Jacuzzi',
          'Walk-in wardrobe',
          'Bang & Olufsen sound system',
        ],
      },
    ];

    this.initializeAvailability();

    this.policies = {
      checkInTime: '2:00 PM',
      checkOutTime: '12:00 PM',
      cancellation:
        'Free cancellation up to 24 hours before check-in. Cancellations made within 24 hours of check-in will be charged one night\'s stay.',
      pets:
        'Pets are not allowed on the hotel premises. Service animals are welcome with proper documentation.',
      smoking:
        'Saltystaz Gurgaon is a 100% smoke-free property. Smoking is prohibited in all indoor areas including rooms, restaurants, and common spaces. A designated outdoor smoking area is available near the garden.',
      parking:
        'Complimentary valet parking is available for all in-house guests. Self-parking is also available in our secured underground parking facility at no additional charge.',
    };

    this.amenities = [
      {
        name: 'Swimming Pool',
        description:
          'Temperature-controlled outdoor infinity pool open from 6:00 AM to 9:00 PM with poolside service.',
      },
      {
        name: 'Fitness Centre',
        description:
          'State-of-the-art gym equipped with cardio machines, free weights, and personal training services, open 24 hours.',
      },
      {
        name: 'Spa & Wellness',
        description:
          'Full-service spa offering traditional Ayurvedic treatments, Swedish massage, and aromatherapy sessions.',
      },
      {
        name: 'Restaurant - Spice Garden',
        description:
          'Multi-cuisine restaurant serving Indian, Continental, and Asian dishes for breakfast, lunch, and dinner.',
      },
      {
        name: 'Business Centre',
        description:
          'Fully equipped business centre with meeting rooms, high-speed internet, printing, and video conferencing facilities.',
      },
      {
        name: 'Concierge Service',
        description:
          'Dedicated concierge team available 24/7 to assist with travel arrangements, restaurant reservations, and local recommendations.',
      },
    ];

    this.bookings = [];
  }

  private initializeAvailability(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const baseUnits: Record<string, number> = {
      'deluxe-room': 10,
      'executive-suite': 5,
      'presidential-suite': 2,
    };

    for (const roomType of this.roomTypes) {
      const dateMap = new Map<string, number>();
      const units = baseUnits[roomType.id] ?? 3;

      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dateMap.set(dateStr, units);
      }

      this.availability.set(roomType.id, dateMap);
    }
  }

  getRoomTypes(): RoomType[] {
    return this.roomTypes;
  }

  getAvailability(roomType: string, date: string): number {
    const dateMap = this.availability.get(roomType);
    if (!dateMap) return 0;
    return dateMap.get(date) ?? 0;
  }

  decrementAvailability(roomType: string, date: string): boolean {
    const dateMap = this.availability.get(roomType);
    if (!dateMap) return false;

    const current = dateMap.get(date) ?? 0;
    if (current <= 0) return false;

    dateMap.set(date, current - 1);
    return true;
  }

  incrementAvailability(roomType: string, date: string): void {
    const dateMap = this.availability.get(roomType);
    if (!dateMap) return;

    const current = dateMap.get(date) ?? 0;
    dateMap.set(date, current + 1);
  }

  getPolicies(): HotelPolicies {
    return this.policies;
  }

  getAmenities(): Amenity[] {
    return this.amenities;
  }

  addBooking(booking: BookingRecord): void {
    this.bookings.push(booking);
  }

  getBooking(confirmationNumber: string): BookingRecord | undefined {
    return this.bookings.find(
      (b) => b.confirmationNumber === confirmationNumber
    );
  }

  cancelBooking(confirmationNumber: string): boolean {
    const booking = this.bookings.find(
      (b) => b.confirmationNumber === confirmationNumber
    );
    if (!booking) return false;

    booking.status = 'cancelled';
    return true;
  }
}

export const mockDataStore = new MockDataStore();
