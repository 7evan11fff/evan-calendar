# Evan's Calendar

Personal calendar app with API access for automated event creation.

## Setup

### 1. Create Upstash Redis Database (Free)

1. Go to [console.upstash.com](https://console.upstash.com)
2. Create a new Redis database (free tier)
3. Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### 2. Deploy to Vercel

```bash
cd evan-calendar
vercel login
vercel
```

When prompted, add these environment variables in the Vercel dashboard:
- `API_KEY` - Your secret API key for programmatic access
- `WEB_PASSWORD` - Password to access the web UI
- `UPSTASH_REDIS_REST_URL` - From Upstash
- `UPSTASH_REDIS_REST_TOKEN` - From Upstash

### 3. Access

- **Web UI**: Visit your Vercel URL, enter your password
- **API**: Use Bearer token authentication

## API Usage

All API endpoints require `Authorization: Bearer <API_KEY>` header.

### List all events
```bash
GET /api/events
```

### Get events in date range
```bash
GET /api/events?start=2026-03-01&end=2026-03-31
```

### Create event
```bash
POST /api/events
{
  "title": "Meeting",
  "description": "Team sync",
  "start": "2026-03-15T10:00:00Z",
  "end": "2026-03-15T11:00:00Z",
  "allDay": false,
  "source": "email"
}
```

### Update event
```bash
PATCH /api/events/{id}
{
  "title": "Updated title"
}
```

### Delete event
```bash
DELETE /api/events/{id}
```

## Automated Event Discovery

OpenClaw will scan twice daily (12am and 12pm) for events from:
- Email
- Browser tabs
- Local files
- Other configured sources

Events are tagged with their source for easy identification.
