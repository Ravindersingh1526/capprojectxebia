import {
  BookingRequest,
  BookingConfirmation,
  BookingRecord,
  DateValidationResult,
} from '@/lib/types';
import { mockDataStore } from '@/lib/mock-data';
import { validateDates } from '@/lib/validation';

export interface AvailableRoom {
  roomTypeId: string;
  name: string;
  pricePerNight: number;
  totalCost: number;
  maxGuests: number;
}

export interface BookingEngine {
  checkAvailability(checkIn: string, checkOut: string, roomType?: string): AvailableRoom[];
  createBooking(request: BookingRequest, sessionId?: string): BookingConfirmation;
  cancelBooking(confirmationNumber: string, sessionId: string): boolean;
  validateDates(checkIn: string, checkOut: string): DateValidationResult;
}

/**
 * Returns an array of date strings (YYYY-MM-DD) for each night in the range.
 * The range includes checkIn but excludes checkOut (guests stay nights, not the checkout day).
 */
function getDateRange(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const [startYear, startMonth, startDay] = checkIn.split('-').map(Number);
  const [endYear, endMonth, endDay] = checkOut.split('-').map(Number);

  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  const current = new Date(start);
  while (current < end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/** Sequential counter for generating unique confirmation numbers */
let bookingCounter = 0;

/**
 * Generates a confirmation number in the format STZ-YYYYMMDD-NNN
 * where YYYYMMDD is the check-in date and NNN is a zero-padded sequential counter.
 */
function generateConfirmationNumber(checkInDate: string): string {
  bookingCounter++;
  const datePart = checkInDate.replace(/-/g, '');
  const counterPart = String(bookingCounter).padStart(3, '0');
  return `STZ-${datePart}-${counterPart}`;
}

class BookingEngineImpl implements BookingEngine {
  checkAvailability(checkIn: string, checkOut: string, roomType?: string): AvailableRoom[] {
    const roomTypes = mockDataStore.getRoomTypes();
    const dates = getDateRange(checkIn, checkOut);
    const numberOfNights = dates.length;

    if (numberOfNights === 0) {
      return [];
    }

    // Filter to specific room type if provided
    const candidates = roomType
      ? roomTypes.filter((rt) => rt.id === roomType)
      : roomTypes;

    const available: AvailableRoom[] = [];

    for (const room of candidates) {
      // Check that ALL dates in the range have availability > 0
      const allAvailable = dates.every(
        (date) => mockDataStore.getAvailability(room.id, date) > 0
      );

      if (allAvailable) {
        available.push({
          roomTypeId: room.id,
          name: room.name,
          pricePerNight: room.pricePerNight,
          totalCost: room.pricePerNight * numberOfNights,
          maxGuests: room.maxGuests,
        });
      }
    }

    // Return up to 3 options
    return available.slice(0, 3);
  }

  createBooking(request: BookingRequest, sessionId?: string): BookingConfirmation {
    // Validate dates
    const dateValidation = this.validateDates(request.checkInDate, request.checkOutDate);
    if (!dateValidation.valid) {
      throw new Error(dateValidation.message || 'Invalid dates provided.');
    }

    // Check availability for the requested room type
    const available = this.checkAvailability(
      request.checkInDate,
      request.checkOutDate,
      request.roomType
    );

    if (available.length === 0) {
      throw new Error(
        `No availability for room type "${request.roomType}" on the requested dates.`
      );
    }

    const roomOption = available[0];
    const dates = getDateRange(request.checkInDate, request.checkOutDate);

    // Decrement availability for each date in range
    for (const date of dates) {
      const success = mockDataStore.decrementAvailability(request.roomType, date);
      if (!success) {
        throw new Error(
          `Failed to reserve room for date ${date}. Availability may have changed.`
        );
      }
    }

    // Generate confirmation number
    const confirmationNumber = generateConfirmationNumber(request.checkInDate);

    // Create booking record
    const bookingRecord: BookingRecord = {
      confirmationNumber,
      sessionId: sessionId || '',
      guestName: request.guestName,
      roomType: request.roomType,
      checkInDate: request.checkInDate,
      checkOutDate: request.checkOutDate,
      pricePerNight: roomOption.pricePerNight,
      totalCost: roomOption.totalCost,
      status: 'confirmed',
      createdAt: new Date(),
    };

    // Store booking
    mockDataStore.addBooking(bookingRecord);

    return {
      confirmationNumber,
      roomType: request.roomType,
      checkInDate: request.checkInDate,
      checkOutDate: request.checkOutDate,
      pricePerNight: roomOption.pricePerNight,
      totalCost: roomOption.totalCost,
      guestName: request.guestName,
    };
  }

  cancelBooking(confirmationNumber: string, sessionId: string): boolean {
    // Find the booking
    const booking = mockDataStore.getBooking(confirmationNumber);
    if (!booking) {
      return false;
    }

    // Verify booking belongs to the given session
    if (booking.sessionId !== sessionId) {
      return false;
    }

    // Verify booking is not already cancelled
    if (booking.status === 'cancelled') {
      return false;
    }

    // Cancel the booking
    const cancelled = mockDataStore.cancelBooking(confirmationNumber);
    if (!cancelled) {
      return false;
    }

    // Increment availability for each date in the range
    const dates = getDateRange(booking.checkInDate, booking.checkOutDate);
    for (const date of dates) {
      mockDataStore.incrementAvailability(booking.roomType, date);
    }

    return true;
  }

  validateDates(checkIn: string, checkOut: string): DateValidationResult {
    return validateDates(checkIn, checkOut);
  }
}

export const bookingEngine = new BookingEngineImpl();
