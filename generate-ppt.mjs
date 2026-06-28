import PptxGenJS from 'pptxgenjs';

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Saltystaz Gurgaon';
pptx.title = 'AI Chat Assistant - Sophia';

// Color palette
const PURPLE = '667eea';
const DARK = '1a1a2e';
const GOLD = 'ffd700';
const GREEN = '34e89e';
const LIGHT_BG = 'f8f9fa';

// ===== SLIDE 1: Title =====
let slide = pptx.addSlide();
slide.background = { fill: PURPLE };
slide.addText('🏨 Saltystaz Gurgaon', { x: 0.5, y: 1.5, w: '95%', h: 1.2, fontSize: 44, bold: true, color: 'FFFFFF', align: 'center' });
slide.addText('AI Chat Assistant — Proof of Concept', { x: 0.5, y: 2.8, w: '95%', h: 0.8, fontSize: 24, color: 'FFFFFF', align: 'center' });
slide.addText('Enhancing guest experience through intelligent conversation', { x: 0.5, y: 4.0, w: '95%', h: 0.6, fontSize: 16, color: 'E0E0FF', align: 'center' });
slide.addText('AI-Powered  •  Next.js  •  OpenAI Agents SDK', { x: 0.5, y: 5.0, w: '95%', h: 0.5, fontSize: 14, color: 'D0D0FF', align: 'center' });
slide.addText('June 2026', { x: 0.5, y: 6.5, w: '95%', h: 0.4, fontSize: 12, color: 'B0B0DD', align: 'center' });

// ===== SLIDE 2: Problem Statement =====
slide = pptx.addSlide();
slide.background = { fill: DARK };
slide.addText('💡 The Problem', { x: 0.5, y: 0.3, w: '95%', h: 0.8, fontSize: 32, bold: true, color: 'FFFFFF' });
const problems = [
  '📞  Guests call the front desk for common queries',
  '⏳  Wait times increase during peak hours',
  '🔁  Repetitive questions consume staff bandwidth',
  '📝  Booking process requires multiple steps',
  '🌙  No 24/7 instant assistance available',
];
problems.forEach((text, i) => {
  slide.addText(text, { x: 0.8, y: 1.4 + i * 0.7, w: 7, h: 0.6, fontSize: 18, color: 'FFFFFF' });
});
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 8.5, y: 1.8, w: 4, h: 3.5, fill: { color: '2a2a4e' }, rectRadius: 0.1 });
slide.addText('Traditional Process', { x: 8.5, y: 2.2, w: 4, h: 0.5, fontSize: 16, bold: true, color: GOLD, align: 'center' });
slide.addText('Guest → Call → Wait → Agent → Answer', { x: 8.5, y: 3.0, w: 4, h: 0.5, fontSize: 13, color: 'FFFFFF', align: 'center' });
slide.addText('Average wait: 3-5 minutes', { x: 8.5, y: 3.8, w: 4, h: 0.5, fontSize: 12, color: 'AAAAAA', align: 'center' });

// ===== SLIDE 3: Solution =====
slide = pptx.addSlide();
slide.background = { fill: '0f3443' };
slide.addText('✨ Our Solution: Meet Sophia', { x: 0.5, y: 0.3, w: '95%', h: 0.8, fontSize: 32, bold: true, color: 'FFFFFF' });
const solutions = [
  '→  AI concierge available 24/7 instantly',
  '→  Natural conversation in Indian English',
  '→  Handles bookings, FAQs, and policies',
  '→  Adapts tone — formal or casual',
  '→  Focused strictly on hotel services',
];
solutions.forEach((text, i) => {
  slide.addText(text, { x: 0.8, y: 1.4 + i * 0.7, w: 7, h: 0.6, fontSize: 18, color: 'FFFFFF' });
});
// Chat mockup
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 8.3, y: 1.2, w: 4.5, h: 5.5, fill: { color: 'FFFFFF' }, rectRadius: 0.15 });
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 8.3, y: 1.2, w: 4.5, h: 0.8, fill: { color: PURPLE }, rectRadius: 0.05 });
slide.addText('🏨 Sophia - Concierge', { x: 8.4, y: 1.3, w: 4.3, h: 0.6, fontSize: 12, bold: true, color: 'FFFFFF' });
slide.addText("Hi! I'm Sophia. What's your name?", { x: 8.6, y: 2.2, w: 3, h: 0.4, fontSize: 10, color: '666666', italic: true, align: 'center' });
slide.addText('Priya', { x: 10.5, y: 2.8, w: 1.8, h: 0.4, fontSize: 10, color: 'FFFFFF', fill: { color: PURPLE }, align: 'center' });
slide.addText('Welcome Priya! How may I assist you?', { x: 8.6, y: 3.4, w: 3.2, h: 0.5, fontSize: 10, color: '333333', fill: { color: 'F1F1F1' } });
slide.addText('Book a room for tomorrow', { x: 9.8, y: 4.1, w: 2.8, h: 0.4, fontSize: 10, color: 'FFFFFF', fill: { color: PURPLE }, align: 'center' });
slide.addText('Found 3 options! Deluxe ₹8,500...', { x: 8.6, y: 4.7, w: 3.2, h: 0.5, fontSize: 10, color: '333333', fill: { color: 'F1F1F1' } });

// ===== SLIDE 4: Key Features =====
slide = pptx.addSlide();
slide.background = { fill: DARK };
slide.addText('🎯 Key Features', { x: 0.5, y: 0.3, w: '95%', h: 0.8, fontSize: 32, bold: true, color: 'FFFFFF' });

const features = [
  { icon: '🤖', title: 'AI Conversation', desc: 'Natural language with GPT-4o-mini' },
  { icon: '🏨', title: 'Room Booking', desc: 'Check, book, and cancel rooms' },
  { icon: '📋', title: 'Hotel FAQ', desc: 'Policies, amenities, timings' },
  { icon: '🎭', title: 'Tone Matching', desc: 'Formal or casual adaptation' },
  { icon: '🔒', title: 'Topic Boundary', desc: 'Hotel-only responses' },
  { icon: '💬', title: 'Session Memory', desc: '50 message context window' },
];
features.forEach((f, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const x = 0.5 + col * 4.2;
  const y = 1.5 + row * 2.8;
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w: 3.8, h: 2.4, fill: { color: '2a2a4e' }, rectRadius: 0.1 });
  slide.addText(f.icon, { x, y: y + 0.2, w: 3.8, h: 0.7, fontSize: 28, align: 'center' });
  slide.addText(f.title, { x, y: y + 0.9, w: 3.8, h: 0.5, fontSize: 15, bold: true, color: 'FFFFFF', align: 'center' });
  slide.addText(f.desc, { x, y: y + 1.5, w: 3.8, h: 0.5, fontSize: 12, color: 'CCCCCC', align: 'center' });
});

// ===== SLIDE 5: Architecture =====
slide = pptx.addSlide();
slide.background = { fill: LIGHT_BG };
slide.addText('🏗️ System Architecture', { x: 0.5, y: 0.3, w: '95%', h: 0.8, fontSize: 32, bold: true, color: '2d3436' });

// Browser layer
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 3.5, y: 1.3, w: 6, h: 0.8, fill: { color: 'E8F4FD' }, line: { color: '4facfe', width: 1.5 }, rectRadius: 0.05 });
slide.addText('Browser — Chat UI (React)', { x: 3.5, y: 1.3, w: 6, h: 0.8, fontSize: 14, bold: true, color: '333333', align: 'center' });

// Arrow
slide.addText('↓ POST /api/chat', { x: 5.5, y: 2.2, w: 2, h: 0.4, fontSize: 10, color: '666666', align: 'center' });

// Server layer
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 1, y: 2.7, w: 11, h: 3.2, fill: { color: 'F0F0F0' }, line: { color: 'CCCCCC', width: 1 }, rectRadius: 0.1 });
slide.addText('Next.js Server', { x: 1.2, y: 2.8, w: 3, h: 0.4, fontSize: 11, bold: true, color: '555555' });

const boxes = [
  { x: 1.5, y: 3.3, label: 'Session\nManager' },
  { x: 4.0, y: 3.3, label: 'Hotel\nAgent' },
  { x: 6.5, y: 3.3, label: 'Input\nValidation' },
  { x: 2.0, y: 4.8, label: 'Booking\nEngine' },
  { x: 4.5, y: 4.8, label: 'FAQ\nModule' },
  { x: 7.0, y: 4.8, label: 'Mock Data\nStore' },
];
boxes.forEach(b => {
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: b.x, y: b.y, w: 2.2, h: 1.0, fill: { color: 'FFFFFF' }, line: { color: PURPLE, width: 1 }, rectRadius: 0.05 });
  slide.addText(b.label, { x: b.x, y: b.y, w: 2.2, h: 1.0, fontSize: 11, color: '333333', align: 'center', valign: 'middle' });
});

// External API
slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 3.5, y: 6.2, w: 6, h: 0.8, fill: { color: 'FFF3E0' }, line: { color: 'FF9800', width: 1.5 }, rectRadius: 0.05 });
slide.addText('OpenAI GPT-4o-mini (External API)', { x: 3.5, y: 6.2, w: 6, h: 0.8, fontSize: 14, bold: true, color: '333333', align: 'center' });

// ===== SLIDE 6: Tech Stack =====
slide = pptx.addSlide();
slide.background = { fill: DARK };
slide.addText('🛠️ Technology Stack', { x: 0.5, y: 0.3, w: '95%', h: 0.8, fontSize: 32, bold: true, color: 'FFFFFF' });

const techs = ['Next.js 16', 'TypeScript', 'React 19', 'Tailwind CSS', 'OpenAI Agents SDK', 'GPT-4o-mini', 'Zod', 'Vitest', 'fast-check'];
techs.forEach((t, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const x = 1.5 + col * 3.8;
  const y = 1.5 + row * 1.2;
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w: 3.4, h: 0.8, fill: { color: '2a2a4e' }, line: { color: '4a4a7e', width: 1 }, rectRadius: 0.05 });
  slide.addText(t, { x, y, w: 3.4, h: 0.8, fontSize: 14, color: 'FFFFFF', align: 'center', valign: 'middle' });
});

const highlights = [
  '→  Single command setup: npm run dev',
  '→  No database — all in-memory mock data',
  '→  Agent SDK handles tool calling automatically',
  '→  Property-based testing for correctness',
];
highlights.forEach((text, i) => {
  slide.addText(text, { x: 1.5, y: 5.2 + i * 0.55, w: 10, h: 0.5, fontSize: 15, color: 'CCCCCC' });
});

// ===== SLIDE 7: How It Works =====
slide = pptx.addSlide();
slide.background = { fill: '1565C0' };
slide.addText('⚡ How It Works', { x: 0.5, y: 0.3, w: '95%', h: 0.8, fontSize: 32, bold: true, color: 'FFFFFF' });

const steps = [
  { num: '1', text: 'Guest sends\nmessage' },
  { num: '2', text: 'API validates\n& routes' },
  { num: '3', text: 'Agent decides\naction' },
  { num: '4', text: 'Tool executes\n(book/FAQ)' },
  { num: '5', text: 'Response\ndelivered' },
];
steps.forEach((s, i) => {
  const x = 0.5 + i * 2.5;
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 2.0, w: 2.2, h: 2.5, fill: { color: '1976D2' }, rectRadius: 0.1 });
  slide.addText(s.num, { x, y: 2.2, w: 2.2, h: 0.8, fontSize: 28, bold: true, color: GOLD, align: 'center' });
  slide.addText(s.text, { x, y: 3.2, w: 2.2, h: 1.0, fontSize: 13, color: 'FFFFFF', align: 'center', valign: 'middle' });
  if (i < 4) {
    slide.addText('→', { x: x + 2.1, y: 2.8, w: 0.5, h: 0.8, fontSize: 24, color: 'FFFFFF', align: 'center' });
  }
});
slide.addText('The AI agent autonomously decides when to call tools vs reply directly', { x: 0.5, y: 5.5, w: '95%', h: 0.5, fontSize: 16, color: 'E0E0FF', align: 'center' });

// ===== SLIDE 8: Room Types =====
slide = pptx.addSlide();
slide.background = { fill: 'E91E63' };
slide.addText('🛏️ Room Categories', { x: 0.5, y: 0.3, w: '95%', h: 0.8, fontSize: 32, bold: true, color: 'FFFFFF' });

const rooms = [
  { icon: '🏠', name: 'Deluxe Room', price: '₹8,500/night', desc: 'Max 2 guests • City view • King bed' },
  { icon: '🏢', name: 'Executive Suite', price: '₹15,000/night', desc: 'Max 4 guests • Lounge • Living area' },
  { icon: '👑', name: 'Presidential Suite', price: '₹35,000/night', desc: 'Max 6 guests • Butler • Jacuzzi' },
];
rooms.forEach((r, i) => {
  const x = 0.8 + i * 4.2;
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y: 1.5, w: 3.8, h: 4.0, fill: { color: 'C2185B' }, rectRadius: 0.1 });
  slide.addText(r.icon, { x, y: 1.7, w: 3.8, h: 1.0, fontSize: 36, align: 'center' });
  slide.addText(r.name, { x, y: 2.7, w: 3.8, h: 0.6, fontSize: 18, bold: true, color: 'FFFFFF', align: 'center' });
  slide.addText(r.price, { x, y: 3.4, w: 3.8, h: 0.6, fontSize: 20, bold: true, color: GOLD, align: 'center' });
  slide.addText(r.desc, { x, y: 4.2, w: 3.8, h: 0.6, fontSize: 12, color: 'FFCCDD', align: 'center' });
});
slide.addText('90 days of availability  •  Real-time booking with confirmation numbers', { x: 0.5, y: 6.2, w: '95%', h: 0.5, fontSize: 14, color: 'FFCCDD', align: 'center' });

// ===== SLIDE 9: Testing =====
slide = pptx.addSlide();
slide.background = { fill: LIGHT_BG };
slide.addText('✅ Testing & Quality', { x: 0.5, y: 0.3, w: '95%', h: 0.8, fontSize: 32, bold: true, color: '2d3436' });

const stats = [
  { num: '151', label: 'Tests Passing' },
  { num: '16', label: 'Test Files' },
  { num: '7', label: 'Property Tests' },
  { num: '100%', label: 'Build Pass' },
];
stats.forEach((s, i) => {
  const x = 1.0 + i * 3.2;
  slide.addText(s.num, { x, y: 1.5, w: 2.8, h: 1.0, fontSize: 40, bold: true, color: PURPLE, align: 'center' });
  slide.addText(s.label, { x, y: 2.5, w: 2.8, h: 0.5, fontSize: 14, color: '666666', align: 'center' });
});

const testTypes = [
  '→  Unit tests for every module',
  '→  Property-based tests (100 iterations each)',
  '→  Integration tests with mocked AI responses',
  '→  UI component tests with React Testing Library',
];
testTypes.forEach((text, i) => {
  slide.addText(text, { x: 1.5, y: 3.8 + i * 0.6, w: 10, h: 0.5, fontSize: 16, color: '444444' });
});

// ===== SLIDE 10: Demo Scenarios =====
slide = pptx.addSlide();
slide.background = { fill: DARK };
slide.addText('🎬 Demo Scenarios', { x: 0.5, y: 0.3, w: '95%', h: 0.8, fontSize: 32, bold: true, color: 'FFFFFF' });

const demos = [
  { icon: '👋', title: 'Welcome Flow', desc: 'Name capture → personalized greeting' },
  { icon: '🔍', title: 'Room Inquiry', desc: '"Book a room for tomorrow" → options' },
  { icon: '✅', title: 'Booking Confirm', desc: 'Select room → confirmation number' },
  { icon: '❌', title: 'Off-Topic Block', desc: '"Tell me about JS" → polite redirect' },
];
demos.forEach((d, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 1.0 + col * 6.2;
  const y = 1.5 + row * 2.8;
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.5, h: 2.3, fill: { color: '2a2a4e' }, rectRadius: 0.1 });
  slide.addText(d.icon, { x: x + 0.3, y: y + 0.3, w: 1.2, h: 1.5, fontSize: 30, valign: 'middle' });
  slide.addText(d.title, { x: x + 1.5, y: y + 0.4, w: 3.5, h: 0.6, fontSize: 18, bold: true, color: 'FFFFFF' });
  slide.addText(d.desc, { x: x + 1.5, y: y + 1.1, w: 3.5, h: 0.6, fontSize: 13, color: 'CCCCCC' });
});

// ===== SLIDE 11: Impact =====
slide = pptx.addSlide();
slide.background = { fill: '0f3443' };
slide.addText('📈 Expected Impact', { x: 0.5, y: 0.3, w: '95%', h: 0.8, fontSize: 32, bold: true, color: 'FFFFFF' });

const impacts = [
  '⚡  Reduced wait times — instant AI responses',
  '🌙  24/7 availability — no staffing gaps',
  '✨  Consistent experience — same quality every time',
  '👥  Staff efficiency — focus on complex requests',
  '😊  Guest satisfaction — natural, warm interaction',
];
impacts.forEach((text, i) => {
  slide.addText(text, { x: 1.0, y: 1.5 + i * 0.9, w: 8, h: 0.7, fontSize: 18, color: 'FFFFFF' });
});

slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, { x: 8.5, y: 2.0, w: 4, h: 3.0, fill: { color: '1a5a6e' }, rectRadius: 0.1 });
slide.addText('⚡ With Sophia', { x: 8.5, y: 2.3, w: 4, h: 0.6, fontSize: 16, bold: true, color: GREEN, align: 'center' });
slide.addText('Guest → Type → Instant Response', { x: 8.5, y: 3.2, w: 4, h: 0.5, fontSize: 13, color: 'FFFFFF', align: 'center' });
slide.addText('Average: < 3 seconds', { x: 8.5, y: 3.9, w: 4, h: 0.5, fontSize: 12, color: 'AAAAAA', align: 'center' });

// ===== SLIDE 12: Thank You =====
slide = pptx.addSlide();
slide.background = { fill: PURPLE };
slide.addText('🙏 Thank You', { x: 0.5, y: 1.8, w: '95%', h: 1.2, fontSize: 48, bold: true, color: 'FFFFFF', align: 'center' });
slide.addText('Saltystaz Gurgaon AI Chat Assistant', { x: 0.5, y: 3.2, w: '95%', h: 0.8, fontSize: 22, color: 'E0E0FF', align: 'center' });
slide.addText('Powered by Sophia — your intelligent concierge', { x: 0.5, y: 4.2, w: '95%', h: 0.6, fontSize: 16, color: 'D0D0FF', align: 'center' });
slide.addText('Live Demo: localhost:3000', { x: 0.5, y: 5.5, w: '95%', h: 0.5, fontSize: 14, color: 'CCCCFF', align: 'center' });
slide.addText('Questions?', { x: 0.5, y: 6.2, w: '95%', h: 0.5, fontSize: 18, color: 'FFFFFF', align: 'center' });

// Generate
pptx.writeFile({ fileName: 'Saltystaz-AI-Chat-Assistant.pptx' })
  .then(() => console.log('✅ Presentation created: Saltystaz-AI-Chat-Assistant.pptx'))
  .catch(err => console.error('Error:', err));
