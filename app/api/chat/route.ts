import { sessionManager } from '@/lib/session-manager';
import { runHotelAgent, HotelAgentContext } from '@/lib/hotel-agent';
import { validateMessage } from '@/lib/validation';
import { ChatMessage, ChatResponse } from '@/lib/types';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: 'Service configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { sessionId, message } = body as { sessionId?: string; message: string };

    // Validate message
    const validation = validateMessage(message);
    if (!validation.valid) {
      return Response.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Session management
    let session;
    let metadata: ChatResponse['metadata'] = undefined;

    if (sessionId) {
      session = sessionManager.getSession(sessionId);

      if (session && sessionManager.isExpired(session)) {
        // Session expired — create a new one and flag it
        session = sessionManager.createSession();
        metadata = { sessionExpired: true };
      } else if (!session) {
        // Session not found — create a new one
        session = sessionManager.createSession();
      }
    } else {
      // No sessionId provided — create a new session
      session = sessionManager.createSession();
    }

    // Handle session state: awaiting_name
    if (session.state === 'awaiting_name') {
      // Treat the message as the guest's name
      session.guestName = message.trim();
      session.state = 'active';

      // Store user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      sessionManager.addMessage(session.id, userMessage);

      // Generate welcome greeting
      const reply = `Welcome to Saltystaz Gurgaon, ${session.guestName}! I'm Sophia, your concierge. How may I assist you today?`;

      // Store assistant reply
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };
      sessionManager.addMessage(session.id, assistantMessage);

      const response: ChatResponse = {
        sessionId: session.id,
        reply,
        ...(metadata && { metadata }),
      };

      return Response.json(response);
    }

    // Handle session state: active — run agent
    // Store user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    sessionManager.addMessage(session.id, userMessage);

    // Build conversation context from session history for the agent
    const conversationHistory = session.messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // Run the hotel agent with conversation context
    const agentContext: HotelAgentContext = {
      sessionId: session.id,
      guestName: session.guestName,
    };

    // Pass full conversation history if available, otherwise just the message
    const agentInput = conversationHistory.length > 1
      ? conversationHistory
      : message;

    const result = await runHotelAgent(agentInput, agentContext);
    const reply = result.finalOutput;

    // Store assistant reply
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: reply,
      timestamp: new Date(),
    };
    sessionManager.addMessage(session.id, assistantMessage);

    const response: ChatResponse = {
      sessionId: session.id,
      reply,
      ...(metadata && { metadata }),
    };

    return Response.json(response);
  } catch (error: unknown) {
    // Log error for debugging
    console.error('[Chat API Error]', error instanceof Error ? error.message : error);

    // Error classification
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      const errorName = error.name.toLowerCase();

      // OpenAI timeout
      if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('timed out') ||
        errorName.includes('timeout')
      ) {
        return Response.json(
          { error: "I'm having trouble responding right now. Please try again." },
          { status: 503 }
        );
      }

      // Rate limit
      if (
        errorMessage.includes('rate limit') ||
        errorMessage.includes('429') ||
        errorMessage.includes('too many requests')
      ) {
        return Response.json(
          { error: "I'm a bit busy right now. Please try again in a moment." },
          { status: 429 }
        );
      }

      // Auth failure
      if (
        errorMessage.includes('authentication') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('invalid api key') ||
        errorMessage.includes('401')
      ) {
        return Response.json(
          { error: 'Service configuration error. Please contact support.' },
          { status: 500 }
        );
      }
    }

    // Generic agent error
    return Response.json(
      { error: "I'm having trouble responding right now. Please try again." },
      { status: 503 }
    );
  }
}
