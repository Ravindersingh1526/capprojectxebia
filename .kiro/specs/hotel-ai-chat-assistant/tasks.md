# Implementation Plan: Hotel AI Chat Assistant

## Overview

This plan implements the Saltystaz Gurgaon AI Chat Assistant as a Next.js App Router application with TypeScript, using the OpenAI Agents SDK for conversational AI. Tasks are ordered by dependency — data layer first, then business logic, then agent integration, then API, and finally the UI.

## Tasks

- [x] 1. Set up project structure and core types
  - [x] 1.1 Initialize Next.js project with TypeScript, Tailwind CSS, and install dependencies
    - Create a Next.js App Router project with TypeScript
    - Install dependencies: `@openai/agents`, `zod`, `uuid`
    - Install dev dependencies: `vitest`, `fast-check`, `@testing-library/react`, `@testing-library/jest-dom`, `msw`
    - Configure Tailwind CSS
    - Set up Vitest config
    - _Requirements: 5.5_

  - [x] 1.2 Define shared TypeScript interfaces and types
    - Create `lib/types.ts` with all interfaces: `ChatMessage`, `RoomType`, `BookingRecord`, `BookingConfirmation`, `BookingRequest`, `DateValidationResult`, `HotelPolicies`, `Amenity`, `Session`, `ChatRequest`, `ChatResponse`
    - Use exact type definitions from the design document
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 2. Implement Mock Data Store
  - [x] 2.1 Create the Mock Data Store module
    - Create `lib/mock-data.ts` implementing `MockDataStoreAPI`
    - Initialize with at least 3 room types (Deluxe Room, Executive Suite, Presidential Suite) with INR pricing, descriptions, max guests (1-10), and room-specific amenities
    - Generate availability data for 90 days from current date with positive units per room type per day
    - Include hotel policies (cancellation, check-in 2:00 PM, check-out 12:00 PM, pets, smoking, parking) as non-empty text
    - Include at least 5 amenities with names and descriptions
    - Implement `getRoomTypes()`, `getAvailability()`, `decrementAvailability()`, `incrementAvailability()`, `getPolicies()`, `getAmenities()`, `addBooking()`, `cancelBooking()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 2.2 Write property test for booking creation and availability decrement
    - **Property 6: Booking creation produces a valid record and decrements availability**
    - **Validates: Requirements 3.4, 5.6**

  - [x] 2.3 Write property test for cancellation restoring availability
    - **Property 7: Booking cancellation restores availability**
    - **Validates: Requirements 3.8**

- [x] 3. Implement Session Manager
  - [x] 3.1 Create the Session Manager module
    - Create `lib/session-manager.ts` implementing the `SessionManager` interface
    - Generate unique session IDs using `crypto.randomUUID()`
    - Track session state: `awaiting_name` | `active`
    - Enforce 50-message history limit with FIFO eviction (oldest messages removed first)
    - Detect 30-minute inactivity timeout via `lastActivityAt` timestamp
    - Implement `createSession()`, `getSession()`, `isExpired()`, `addMessage()`, `clearSession()`
    - Handle "start over" / "reset conversation" by clearing context and creating a new session
    - _Requirements: 1.2, 1.4, 1.5, 6.1, 6.2, 6.3, 6.5_

  - [x] 3.2 Write property test for session history bounded sliding window
    - **Property 1: Session history maintains a bounded sliding window**
    - **Validates: Requirements 1.2, 6.2**

  - [x] 3.3 Write property test for session expiry by inactivity duration
    - **Property 2: Session expiry is determined by inactivity duration**
    - **Validates: Requirements 1.5, 6.5**

- [x] 4. Implement input validation and date validation
  - [x] 4.1 Create input validation and date validation utilities
    - Create `lib/validation.ts`
    - Implement message validation: reject empty strings, whitespace-only strings, and messages > 1000 characters
    - Implement date validation: reject check-out on or before check-in, reject check-in in past, validate ISO date format
    - Return typed `DateValidationResult` with appropriate error codes
    - _Requirements: 1.1, 1.6, 3.6, 3.7_

  - [x] 4.2 Write property test for whitespace-only message rejection
    - **Property 3: Whitespace-only messages are rejected**
    - **Validates: Requirements 1.6**

  - [x] 4.3 Write property test for date validation rejecting invalid booking dates
    - **Property 4: Date validation rejects invalid booking dates**
    - **Validates: Requirements 3.6, 3.7**

- [x] 5. Checkpoint - Core data and validation layer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Booking Engine
  - [x] 6.1 Create the Booking Engine module
    - Create `lib/booking-engine.ts` implementing the `BookingEngine` interface
    - Implement `checkAvailability()`: query Mock Data Store, return available rooms (max 3 options)
    - Implement `createBooking()`: validate dates, check availability, create reservation record with confirmation number (format: `STZ-YYYYMMDD-NNN`), decrement availability for each reserved date
    - Implement `cancelBooking()`: validate confirmation number exists and belongs to session, mark as cancelled, increment availability for each reserved date
    - Implement `validateDates()`: delegate to validation utility
    - Suggest alternatives when no matching rooms available
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 5.6_

  - [x] 6.2 Write property test for availability results capped at 3
    - **Property 5: Availability results are capped at 3 options**
    - **Validates: Requirements 3.3**

- [x] 7. Implement FAQ Module
  - [x] 7.1 Create the FAQ Module
    - Create `lib/faq-module.ts` implementing the `FAQModule` interface
    - Implement `getHotelInfo()`: route topic to appropriate data retrieval method
    - Implement `getCheckInTime()`, `getCheckOutTime()`, `getAmenities()`, `getPolicy()`, `getRoomPricing()`
    - Return `null` for topics not covered (triggers "contact front desk" response)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 8. Implement Hotel Agent with OpenAI Agents SDK
  - [x] 8.1 Create the Hotel Agent module with tool definitions
    - Create `lib/hotel-agent.ts`
    - Define the `Agent` instance with GPT-4o-mini model, dynamic system prompt (Sophia — Indian English concierge for Saltystaz Gurgaon), and tools
    - Define `check_availability` tool with Zod schema: `checkInDate`, `checkOutDate`, optional `roomType`; execute delegates to Booking Engine
    - Define `create_booking` tool with Zod schema: `checkInDate`, `checkOutDate`, `roomType`, `guestName`; execute delegates to Booking Engine
    - Define `cancel_booking` tool with Zod schema: `confirmationNumber`; execute delegates to Booking Engine
    - Define `get_hotel_info` tool with Zod schema: `topic` enum; execute delegates to FAQ Module
    - Craft system prompt with Indian English tone, hotel personality, tone matching instructions, context about Saltystaz Gurgaon, dynamic today's date, and strict topic boundary (hotel-only questions)
    - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 4.6, 7.1, 7.2, 7.3_

- [x] 9. Implement API Route Handler
  - [x] 9.1 Create the `/api/chat` POST route handler
    - Create `app/api/chat/route.ts`
    - Validate incoming request: non-empty message, ≤ 1000 characters
    - Retrieve or create session via Session Manager
    - Handle session states: `awaiting_name` (capture name, send welcome greeting) vs `active` (run agent)
    - Build conversation context from session history for the agent
    - Invoke agent via `run(hotelAgent, userMessage)` with conversation context
    - Extract `result.finalOutput` as reply
    - Store messages in session history
    - Handle errors: OpenAI timeout (503), rate limit (429), auth failure (500), generic agent errors (503)
    - Return `ChatResponse` with sessionId, reply, and optional metadata
    - _Requirements: 1.1, 1.5, 1.6, 6.1, 6.5, 6.6_

- [x] 10. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement Chat UI
  - [x] 11.1 Create the Chat UI page component
    - Create `app/page.tsx` as the single-page chat interface
    - Implement `ChatState` management: messages, sessionId, guestName, isLoading, error
    - Render conversation history in chronological order with visual distinction between user, assistant, and system messages
    - Implement message input with send button and Enter key support
    - Display loading indicator while awaiting response
    - Auto-scroll to latest message on new messages
    - Handle session initialization flow: prompt for name → display welcome greeting
    - Display error messages as visually distinct system messages
    - Show retry button on network failure
    - Handle session expiry: auto-start new session and notify guest
    - Style with Tailwind CSS for a clean, accessible chat interface
    - _Requirements: 1.1, 6.1, 6.3, 6.4, 6.5, 6.6_

  - [x] 11.2 Write unit tests for Chat UI
    - Test message rendering and chronological order
    - Test loading state display
    - Test error message display
    - Test session initialization flow
    - _Requirements: 6.1, 6.4_

- [x] 12. Integration wiring and end-to-end validation
  - [x] 12.1 Wire all components together and verify end-to-end flow
    - Ensure the API route correctly connects Session Manager → Hotel Agent → Booking Engine / FAQ Module → Mock Data Store
    - Verify the full conversation flow: name → welcome → question → tool call → response
    - Verify booking flow: inquiry → details → availability → confirmation
    - Verify cancellation flow within same session
    - Verify session timeout and restart behavior
    - Add environment variable handling for `OPENAI_API_KEY`
    - _Requirements: 1.1, 1.4, 3.1, 3.4, 3.8, 6.1, 6.5_

  - [x] 12.2 Write integration tests with mocked OpenAI API
    - Use MSW to mock OpenAI API calls made by the Agents SDK
    - Test full conversation flow: name → welcome → question → response
    - Test booking flow end-to-end
    - Test error scenarios: timeout, rate limit, auth failure
    - _Requirements: 1.1, 1.5, 3.1, 6.1_

- [x] 13. Final checkpoint - All tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The OpenAI Agents SDK handles the agent loop automatically — no manual function-call orchestration needed
- All data is in-memory; no database setup required
- The system resets on server restart by design

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "3.2", "3.3", "4.2", "4.3"] },
    { "id": 4, "tasks": ["6.1", "7.1"] },
    { "id": 5, "tasks": ["6.2", "8.1"] },
    { "id": 6, "tasks": ["9.1"] },
    { "id": 7, "tasks": ["11.1"] },
    { "id": 8, "tasks": ["11.2", "12.1"] },
    { "id": 9, "tasks": ["12.2"] }
  ]
}
```
