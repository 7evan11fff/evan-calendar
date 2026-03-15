import { Redis } from '@upstash/redis';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO date string
  end?: string; // ISO date string
  allDay?: boolean;
  source?: string; // Where the event came from (email, browser, manual, etc.)
  createdAt: string;
  updatedAt: string;
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const EVENTS_KEY = 'calendar:events';

export async function getAllEvents(): Promise<CalendarEvent[]> {
  const events = await redis.hgetall<Record<string, CalendarEvent>>(EVENTS_KEY);
  if (!events) return [];
  return Object.values(events);
}

export async function getEventById(id: string): Promise<CalendarEvent | null> {
  const event = await redis.hget<CalendarEvent>(EVENTS_KEY, id);
  return event || null;
}

export async function createEvent(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  
  const newEvent: CalendarEvent = {
    ...event,
    id,
    createdAt: now,
    updatedAt: now,
  };
  
  await redis.hset(EVENTS_KEY, { [id]: newEvent });
  return newEvent;
}

export async function updateEvent(id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>): Promise<CalendarEvent | null> {
  const existing = await getEventById(id);
  if (!existing) return null;
  
  const updatedEvent: CalendarEvent = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await redis.hset(EVENTS_KEY, { [id]: updatedEvent });
  return updatedEvent;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const result = await redis.hdel(EVENTS_KEY, id);
  return result > 0;
}

export async function searchEvents(query: string): Promise<CalendarEvent[]> {
  const events = await getAllEvents();
  const lower = query.toLowerCase();
  return events.filter(e => 
    e.title.toLowerCase().includes(lower) ||
    e.description?.toLowerCase().includes(lower)
  );
}

export async function getEventsByDateRange(start: string, end: string): Promise<CalendarEvent[]> {
  const events = await getAllEvents();
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  return events.filter(e => {
    const eventStart = new Date(e.start);
    return eventStart >= startDate && eventStart <= endDate;
  });
}
