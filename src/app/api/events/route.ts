import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/auth';
import { getAllEvents, createEvent, getEventsByDateRange } from '@/lib/db';

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (start && end) {
    const events = await getEventsByDateRange(start, end);
    return NextResponse.json({ events });
  }

  const events = await getAllEvents();
  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    if (!body.title || !body.start) {
      return NextResponse.json(
        { error: 'title and start are required' },
        { status: 400 }
      );
    }

    const event = await createEvent({
      title: body.title,
      description: body.description,
      start: body.start,
      end: body.end,
      allDay: body.allDay || false,
      source: body.source || 'api',
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
