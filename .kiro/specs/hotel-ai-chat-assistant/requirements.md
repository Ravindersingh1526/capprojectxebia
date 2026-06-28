# Requirements Document

## Introduction

The Hotel AI Chat Assistant is a proof-of-concept AI-powered conversational interface for Saltystaz Gurgaon hotel. It demonstrates how AI can improve productivity, efficiency, and customer experience by handling common guest inquiries, assisting with room bookings, and adapting its communication style to match the user's tone with an Indian English conversational style. The system uses GPT-4.1 as the underlying AI model and mock data for room availability and hotel information, making it suitable for demonstration purposes without requiring a real hotel backend.

## Glossary

- **Chat_Assistant**: The AI-powered conversational system (named Sophia) that interacts with hotel guests
- **Guest**: A user interacting with the Chat_Assistant through the chat interface
- **Tone_Analyzer**: The component responsible for detecting and classifying the Guest's communication style
- **Booking_Engine**: The component responsible for handling room reservation requests using mock data
- **FAQ_Module**: The component responsible for answering common hotel-related questions
- **Mock_Data_Store**: The in-memory data source containing hotel room inventory, availability, pricing, and policy information
- **Conversation_Session**: A single continuous interaction between a Guest and the Chat_Assistant
- **Tone**: The communication style classification, either formal or casual, with an Indian English flavor
- **GPT-4o-mini**: The OpenAI large language model used as the AI backbone for generating responses
- **Hotel_Name**: Saltystaz Gurgaon

## Requirements

### Requirement 1: Conversational Interaction

**User Story:** As a guest, I want to have a natural conversation with the hotel assistant, so that I can get help without navigating complex menus or forms.

#### Acceptance Criteria

1. WHEN a Guest sends a text message of up to 1000 characters, THE Chat_Assistant SHALL respond with a text reply that addresses the topic or intent of the Guest's message within 3 seconds
2. WHILE a Conversation_Session is active, THE Chat_Assistant SHALL maintain context of at least the most recent 50 messages in the session
3. IF the Chat_Assistant cannot determine the intent of a Guest message, THEN THE Chat_Assistant SHALL ask a clarifying question rather than providing an unrelated response
4. THE Chat_Assistant SHALL support conversations of at least 20 turns without requiring the Guest to repeat previously stated information
5. IF a Conversation_Session has been inactive for more than 30 minutes, THEN THE Chat_Assistant SHALL end the session and inform the Guest that a new conversation has started
6. IF a Guest sends an empty or whitespace-only message, THEN THE Chat_Assistant SHALL prompt the Guest to enter a message

### Requirement 2: Tone Matching

**User Story:** As a guest, I want the assistant to communicate in a style that matches my own, so that the interaction feels natural and comfortable.

#### Acceptance Criteria

1. WHEN a Guest sends a message, THE Tone_Analyzer SHALL classify the message tone as either formal or casual based on vocabulary, sentence structure, and punctuation
2. WHILE a Guest communicates in a formal tone, THE Chat_Assistant SHALL respond using formal Indian English language, complete sentences, and professional greetings (e.g., "Namaste", "Good day")
3. WHILE a Guest communicates in a casual tone, THE Chat_Assistant SHALL respond using relaxed Indian English language, contractions, and friendly greetings (e.g., "Hey there!", "Sure thing")
4. WHEN a Guest changes tone mid-conversation, THE Chat_Assistant SHALL adapt its response style to match the new tone within the next reply
5. IF the Tone_Analyzer cannot determine the tone of a message, THEN THE Chat_Assistant SHALL default to a warm, formal Indian English tone

### Requirement 3: Room Booking Assistance

**User Story:** As a guest, I want to book a room through the chat assistant, so that I can make a reservation quickly without leaving the conversation.

#### Acceptance Criteria

1. WHEN a Guest requests a room booking, THE Booking_Engine SHALL ask for check-in date, check-out date, and room type preferences; IF any required detail is missing after the Guest's response, THE Booking_Engine SHALL re-prompt for the missing information
2. WHEN all required booking details are provided, THE Booking_Engine SHALL check room availability in the Mock_Data_Store
3. WHEN rooms matching the Guest's criteria are available, THE Chat_Assistant SHALL present up to 3 available options with room type, price per night, and total cost
4. WHEN a Guest confirms a booking selection, THE Booking_Engine SHALL create a reservation record and return a confirmation number, room type, dates, and total cost
5. IF no rooms matching the Guest's criteria are available, THEN THE Chat_Assistant SHALL suggest alternative dates or room types from the Mock_Data_Store
6. IF a Guest provides an invalid date range (check-out before check-in), THEN THE Chat_Assistant SHALL inform the Guest of the error and request corrected dates
7. IF a Guest provides a check-in date in the past, THEN THE Chat_Assistant SHALL inform the Guest that past dates are not valid and request a future date
8. IF a Guest requests to cancel a booking during the same session, THE Booking_Engine SHALL mark the reservation as cancelled and confirm the cancellation to the Guest

### Requirement 4: FAQ and Hotel Information

**User Story:** As a guest, I want to ask questions about the hotel's services and policies, so that I can plan my stay without calling the front desk.

#### Acceptance Criteria

1. WHEN a Guest asks about check-in time, THE FAQ_Module SHALL respond with the hotel check-in time from the Mock_Data_Store within 5 seconds
2. WHEN a Guest asks about check-out time, THE FAQ_Module SHALL respond with the hotel check-out time from the Mock_Data_Store within 5 seconds
3. WHEN a Guest asks about hotel amenities, THE FAQ_Module SHALL respond with the complete list of available amenities from the Mock_Data_Store within 5 seconds
4. WHEN a Guest asks about a hotel policy (cancellation, pets, smoking, or parking), THE FAQ_Module SHALL respond with the policy matching the specific topic asked about from the Mock_Data_Store
5. WHEN a Guest asks about room pricing, THE FAQ_Module SHALL respond with pricing details for available room types from the Mock_Data_Store
6. IF a Guest asks a question not covered by the Mock_Data_Store, THEN THE Chat_Assistant SHALL respond with a message indicating the information is not available and suggesting the Guest contact the front desk
7. IF the Mock_Data_Store is unavailable when the Guest asks a question, THEN THE FAQ_Module SHALL respond with a message indicating the information cannot be retrieved at this time and suggesting the Guest contact the front desk

### Requirement 5: Mock Data Management

**User Story:** As a developer, I want the system to use realistic mock data, so that the demonstration accurately represents a real hotel scenario.

#### Acceptance Criteria

1. THE Mock_Data_Store SHALL contain at least 3 distinct room types, each with a non-empty name, a non-empty description, a maximum guest capacity between 1 and 10, and a positive nightly rate
2. THE Mock_Data_Store SHALL contain availability data for each room type for a minimum of 90 days from the current date, indicating the number of bookable units per room type per day
3. THE Mock_Data_Store SHALL contain hotel policies for cancellation, check-in time, check-out time, pet policy, smoking policy, and parking information, each as a non-empty text value
4. THE Mock_Data_Store SHALL contain a list of at least 5 hotel amenities, each with a non-empty name and a non-empty description
5. WHEN the Chat_Assistant starts, THE Mock_Data_Store SHALL be initialized with all required data without external dependencies
6. WHEN the Booking_Engine creates a reservation for a room type on a given date, THE Mock_Data_Store SHALL decrement the available units for that room type on each reserved date by one

### Requirement 6: Conversation Session Management

**User Story:** As a guest, I want to start a new conversation or continue chatting without losing context, so that my experience is seamless.

#### Acceptance Criteria

1. WHEN a Guest opens the chat interface, THE Chat_Assistant SHALL initiate a new Conversation_Session, ask for the Guest's name, and display a welcome greeting "Welcome to Saltystaz Gurgaon" addressing the Guest by name within 2 seconds
2. WHILE a Conversation_Session is active, THE Chat_Assistant SHALL retain up to 50 messages of history and use them as context for generating responses
3. WHEN a Guest sends a message containing a phrase such as "start over" or "reset conversation", THE Chat_Assistant SHALL clear the current session context, begin a new Conversation_Session, ask for the Guest's name again, and display a new welcome greeting
4. THE Chat_Assistant SHALL display the conversation history to the Guest in chronological order with the most recent message visible
5. IF a Conversation_Session has been inactive for more than 30 minutes, THEN THE Chat_Assistant SHALL end the session and, upon the Guest's next message, start a new Conversation_Session while informing the Guest that the previous session has expired
6. IF the Chat_Assistant fails to create or restore a Conversation_Session, THEN THE Chat_Assistant SHALL display an error message indicating the failure and prompt the Guest to try again

### Requirement 7: Topic Boundary Enforcement

**User Story:** As a hotel manager, I want the assistant to only answer hotel-related questions, so that it stays focused on its purpose and doesn't provide irrelevant information.

#### Acceptance Criteria

1. IF a Guest asks a question unrelated to the hotel (e.g., programming, science, politics, general knowledge), THEN THE Chat_Assistant SHALL politely decline and redirect the Guest to hotel-related topics
2. THE Chat_Assistant SHALL only respond to topics related to: room bookings, availability, pricing, hotel amenities, hotel policies, check-in/check-out, and local travel tips relevant to the Guest's stay
3. WHEN declining an off-topic question, THE Chat_Assistant SHALL respond with a friendly message indicating it can help with hotel-related inquiries and ask how it can assist with the Guest's stay
