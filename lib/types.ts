export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface RoomType {
  id: string;
  name: string;
  description: string;
  maxGuests: number; // 1-10
  pricePerNight: number; // in INR
  amenities: string[]; // room-specific amenities
}

export interface BookingRecord {
  confirmationNumber: string; // e.g., "STZ-20250101-001"
  sessionId: string;
  guestName: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  pricePerNight: number;
  totalCost: number;
  status: 'confirmed' | 'cancelled';
  createdAt: Date;
}

export interface BookingConfirmation {
  confirmationNumber: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  pricePerNight: number;
  totalCost: number;
  guestName: string;
}

export interface BookingRequest {
  checkInDate: string; // ISO date string
  checkOutDate: string; // ISO date string
  roomType: string;
  guestName: string;
}

export interface DateValidationResult {
  valid: boolean;
  error?: 'checkout_before_checkin' | 'checkin_in_past' | 'invalid_format';
  message?: string;
}

export interface HotelPolicies {
  checkInTime: string;
  checkOutTime: string;
  cancellation: string;
  pets: string;
  smoking: string;
  parking: string;
}

export interface Amenity {
  name: string;
  description: string;
}

export interface Session {
  id: string;
  guestName: string | null;
  messages: ChatMessage[];
  createdAt: Date;
  lastActivityAt: Date;
  bookings: BookingRecord[];
  state: 'awaiting_name' | 'active';
}

export interface ChatRequest {
  sessionId?: string;
  message: string;
}

export interface ChatResponse {
  sessionId: string;
  reply: string;
  metadata?: {
    bookingConfirmation?: BookingConfirmation;
    sessionExpired?: boolean;
  };
}
