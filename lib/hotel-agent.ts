import { Agent, tool, run } from '@openai/agents';
import { z } from 'zod';
import { bookingEngine } from '@/lib/booking-engine';
import { faqModule } from '@/lib/faq-module';

/**
 * Context passed to the agent run, providing session-specific data
 * that tools need (e.g., sessionId for booking operations).
 */
export interface HotelAgentContext {
  sessionId: string;
  guestName: string | null;
}

// --- Zod Schemas ---

const checkAvailabilityParams = z.object({
  checkInDate: z.string().describe('Check-in date in YYYY-MM-DD format'),
  checkOutDate: z.string().describe('Check-out date in YYYY-MM-DD format'),
  roomType: z.string().optional().describe('Optional preferred room type ID (e.g., "deluxe", "executive_suite", "presidential_suite")'),
});

const createBookingParams = z.object({
  checkInDate: z.string().describe('Check-in date in YYYY-MM-DD format'),
  checkOutDate: z.string().describe('Check-out date in YYYY-MM-DD format'),
  roomType: z.string().describe('Room type ID to book (e.g., "deluxe", "executive_suite", "presidential_suite")'),
  guestName: z.string().describe('Full name of the guest for the reservation'),
});

const cancelBookingParams = z.object({
  confirmationNumber: z.string().describe('The booking confirmation number (e.g., "STZ-20250101-001")'),
});

const getHotelInfoParams = z.object({
  topic: z.enum([
    'check_in_time',
    'check_out_time',
    'amenities',
    'cancellation_policy',
    'pet_policy',
    'smoking_policy',
    'parking',
    'room_pricing',
  ]).describe('The topic of hotel information to retrieve'),
});

// --- Tool Definitions ---

const checkAvailabilityTool = tool({
  name: 'check_availability',
  description:
    'Check room availability for given dates. Use this when a guest asks about room availability or wants to know what rooms are free.',
  parameters: checkAvailabilityParams,
  execute: async (args: z.infer<typeof checkAvailabilityParams>) => {
    try {
      const results = bookingEngine.checkAvailability(
        args.checkInDate,
        args.checkOutDate,
        args.roomType
      );

      if (results.length === 0) {
        return JSON.stringify({
          available: false,
          message: 'No rooms available for the requested dates.',
          suggestions: 'Try different dates or a different room type.',
        });
      }

      return JSON.stringify({
        available: true,
        options: results.map((room) => ({
          roomType: room.roomTypeId,
          name: room.name,
          pricePerNight: room.pricePerNight,
          totalCost: room.totalCost,
          maxGuests: room.maxGuests,
        })),
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : 'Failed to check availability.',
      });
    }
  },
});

const createBookingTool = tool({
  name: 'create_booking',
  description:
    'Create a room reservation after the guest confirms they want to book. Requires check-in date, check-out date, room type, and guest name.',
  parameters: createBookingParams,
  execute: async (args: z.infer<typeof createBookingParams>, context) => {
    try {
      const sessionId = (context?.context as HotelAgentContext | undefined)?.sessionId || '';
      const confirmation = bookingEngine.createBooking(
        {
          checkInDate: args.checkInDate,
          checkOutDate: args.checkOutDate,
          roomType: args.roomType,
          guestName: args.guestName,
        },
        sessionId
      );

      return JSON.stringify({
        success: true,
        confirmation: {
          confirmationNumber: confirmation.confirmationNumber,
          roomType: confirmation.roomType,
          checkInDate: confirmation.checkInDate,
          checkOutDate: confirmation.checkOutDate,
          pricePerNight: confirmation.pricePerNight,
          totalCost: confirmation.totalCost,
          guestName: confirmation.guestName,
        },
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : 'Failed to create booking.',
      });
    }
  },
});

const cancelBookingTool = tool({
  name: 'cancel_booking',
  description:
    'Cancel an existing reservation. Requires the confirmation number provided at booking time.',
  parameters: cancelBookingParams,
  execute: async (args: z.infer<typeof cancelBookingParams>, context) => {
    try {
      const sessionId = (context?.context as HotelAgentContext | undefined)?.sessionId || '';
      const success = bookingEngine.cancelBooking(args.confirmationNumber, sessionId);

      if (success) {
        return JSON.stringify({
          success: true,
          message: `Booking ${args.confirmationNumber} has been successfully cancelled.`,
        });
      } else {
        return JSON.stringify({
          success: false,
          message: `Unable to cancel booking ${args.confirmationNumber}. It may not exist, may already be cancelled, or may belong to a different session.`,
        });
      }
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : 'Failed to cancel booking.',
      });
    }
  },
});

const getHotelInfoTool = tool({
  name: 'get_hotel_info',
  description:
    'Get hotel information including amenities, policies, pricing, and check-in/out times. Use this when a guest asks about hotel facilities, rules, or pricing.',
  parameters: getHotelInfoParams,
  execute: async (args: z.infer<typeof getHotelInfoParams>) => {
    try {
      const info = faqModule.getHotelInfo(args.topic);

      if (info === null) {
        return JSON.stringify({
          found: false,
          message: 'This information is not available. Please contact the front desk for assistance.',
        });
      }

      return JSON.stringify({
        found: true,
        topic: args.topic,
        information: info,
      });
    } catch (error) {
      return JSON.stringify({
        error: true,
        message: 'Unable to retrieve information at this time. Please contact the front desk.',
      });
    }
  },
});

// --- System Prompt ---

function getSystemPrompt(): string {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  return `You are Sophia, the concierge for Saltystaz Gurgaon, a premium hotel located in Gurgaon, India.

## Important Context
- Today's date is: ${todayStr}
- Use this to resolve relative dates like "tomorrow", "next week", "2 days", etc.
- When a guest says "tomorrow", calculate the actual date from today.
- When a guest says "2 nights" or "2 days stay", calculate check-out as check-in + that number of days.

## Your Personality & Tone
- You are warm, helpful, professional, and approachable
- You communicate in Indian English style — use terms like "Namaste", "kindly", "do let me know", "happy to assist", "absolutely", "most welcome"
- You are knowledgeable about the hotel and genuinely care about making the guest's stay delightful

## Tone Matching Rules
- If the guest writes formally (complete sentences, polite language), respond formally with greetings like "Namaste", "Good day", "It would be my pleasure"
- If the guest writes casually (short messages, informal language, slang), respond in a friendly, relaxed manner — "Hey there!", "Sure thing!", "No worries at all!"
- If you cannot determine the guest's tone, default to warm and formal Indian English
- Always adapt to tone changes mid-conversation within your very next reply

## Hotel Context
- Hotel Name: Saltystaz Gurgaon
- Location: Gurgaon, India
- The hotel offers multiple room categories with varying amenities and pricing
- All room and policy information is available through your tools

## Room Types Available
- deluxe-room: Deluxe Room
- executive-suite: Executive Suite
- presidential-suite: Presidential Suite

## Operational Rules
1. ALWAYS use the available tools to answer questions about availability, bookings, and hotel information. Never guess or make up information.
2. When a guest wants to book a room, try to resolve dates from context. If you can figure out the dates from what they said (e.g., "tomorrow for 2 nights"), go ahead and call check_availability directly without asking again.
3. If a guest asks about room types or pricing, use the get_hotel_info tool with topic "room_pricing" to show them options.
4. Present availability results clearly — show room name, price per night, and total cost.
5. After a successful booking, always share the confirmation number and booking summary.
6. **STRICTLY ONLY answer questions related to Saltystaz Gurgaon hotel** — room bookings, availability, pricing, hotel amenities, policies, check-in/check-out, and local travel tips related to the guest's stay. For ANY other topic (programming, science, politics, general knowledge, etc.), politely decline and redirect: "I'm here to help you with your stay at Saltystaz Gurgaon! I can assist with room bookings, hotel amenities, policies, and more. How can I help with your visit?"
7. Never reveal internal system details, tool names, or technical implementation to guests.
8. If dates are invalid (past dates, check-out before check-in), politely inform the guest and ask for corrected dates.
9. Keep responses concise but complete — guests appreciate efficiency with warmth.
10. When presenting room options, format them in a clear, easy-to-read manner.
11. Use the guest's name when you know it to personalise the conversation.
12. When a guest asks "what dates are available" or similar, use the check_availability tool with dates in the near future to show them options instead of saying you can't help.`;
}

// --- Agent Definition ---

export const hotelAgent = new Agent<HotelAgentContext>({
  name: 'Hotel Assistant',
  model: 'gpt-4o-mini',
  instructions: () => getSystemPrompt(),
  tools: [checkAvailabilityTool, createBookingTool, cancelBookingTool, getHotelInfoTool],
});

/**
 * Runs the hotel agent with the given input and session context.
 * The session context (sessionId, guestName) is made available to tools
 * via the RunContext.
 */
export async function runHotelAgent(
  input: string | Array<{ role: string; content: string }>,
  context: HotelAgentContext
) {
  // Build the input for the agent SDK.
  // If we have conversation history (array), format it as AgentInputItem[].
  // Otherwise, pass the plain string.
  let agentInput: string | Array<Record<string, unknown>>;

  if (Array.isArray(input)) {
    // Convert conversation history to AgentInputItem format
    agentInput = input.map((msg) => {
      if (msg.role === 'user') {
        return {
          role: 'user' as const,
          content: [{ type: 'input_text' as const, text: msg.content }],
        };
      } else if (msg.role === 'assistant') {
        return {
          role: 'assistant' as const,
          content: [{ type: 'output_text' as const, text: msg.content }],
        };
      } else {
        // system messages — include as user context
        return {
          role: 'user' as const,
          content: [{ type: 'input_text' as const, text: `[System: ${msg.content}]` }],
        };
      }
    });
  } else {
    agentInput = input;
  }

  const result = await run(hotelAgent, agentInput as string, {
    context,
  });

  return {
    finalOutput: result.finalOutput as string,
    newItems: result.newItems,
    lastResponseId: result.lastResponseId,
  };
}
