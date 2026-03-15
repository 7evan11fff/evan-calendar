'use client';

import { useState, useEffect, useCallback } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end?: string;
  allDay?: boolean;
  source?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    allDay: false,
  });

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events', {
        headers: { 'Authorization': `Bearer ${getApiKey()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  function getApiKey(): string {
    // In production, this would be handled differently
    // For now, the cookie auth is used for web, this is just for internal calls
    return 'evan-cal-secret-key-2026';
  }

  function getDaysInMonth(date: Date): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: Date[] = [];
    
    // Add padding for days before the first of the month
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    
    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add padding for days after the last of the month
    const endPadding = 42 - days.length; // 6 weeks
    for (let i = 1; i <= endPadding; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  }

  function getEventsForDate(date: Date): CalendarEvent[] {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => e.start.startsWith(dateStr));
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  function isCurrentMonth(date: Date): boolean {
    return date.getMonth() === currentDate.getMonth();
  }

  function prevMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  }

  function openAddModal(date: Date) {
    setSelectedDate(date);
    setEditingEvent(null);
    const dateStr = date.toISOString().split('T')[0];
    setFormData({
      title: '',
      description: '',
      start: `${dateStr}T09:00`,
      end: `${dateStr}T10:00`,
      allDay: false,
    });
    setShowModal(true);
  }

  function openEditModal(event: CalendarEvent) {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      start: event.start.slice(0, 16),
      end: event.end?.slice(0, 16) || '',
      allDay: event.allDay || false,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events';
    const method = editingEvent ? 'PATCH' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getApiKey()}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          start: new Date(formData.start).toISOString(),
          end: formData.end ? new Date(formData.end).toISOString() : undefined,
          allDay: formData.allDay,
          source: 'web',
        }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchEvents();
      }
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  }

  async function handleDelete() {
    if (!editingEvent) return;
    
    if (!confirm('Delete this event?')) return;
    
    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getApiKey()}` },
      });

      if (res.ok) {
        setShowModal(false);
        fetchEvents();
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  }

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Evan&apos;s Calendar</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              ←
            </button>
            <span className="text-white font-medium min-w-[180px] text-center">
              {formatDate(currentDate)}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              →
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b border-zinc-800">
            {weekDays.map(day => (
              <div key={day} className="p-3 text-center text-zinc-400 text-sm font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {days.map((date, i) => {
              const dayEvents = getEventsForDate(date);
              const inMonth = isCurrentMonth(date);
              const today = isToday(date);

              return (
                <div
                  key={i}
                  onClick={() => openAddModal(date)}
                  className={`min-h-[120px] p-2 border-b border-r border-zinc-800 cursor-pointer hover:bg-zinc-800/50 transition-colors ${
                    !inMonth ? 'bg-zinc-900/50' : ''
                  }`}
                >
                  <div className={`text-sm mb-1 ${
                    today ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' :
                    inMonth ? 'text-white' : 'text-zinc-600'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(event);
                        }}
                        className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded truncate hover:bg-blue-600/30 transition-colors"
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-zinc-500 px-2">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            {events
              .filter(e => new Date(e.start) >= new Date())
              .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
              .slice(0, 5)
              .map(event => (
                <div
                  key={event.id}
                  onClick={() => openEditModal(event)}
                  className="flex items-start gap-4 p-3 bg-zinc-800/50 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors"
                >
                  <div className="text-center min-w-[50px]">
                    <div className="text-2xl font-bold text-white">
                      {new Date(event.start).getDate()}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {new Date(event.start).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                  <div>
                    <div className="text-white font-medium">{event.title}</div>
                    {event.description && (
                      <div className="text-sm text-zinc-400 mt-1">{event.description}</div>
                    )}
                    <div className="text-xs text-zinc-500 mt-1">
                      {new Date(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      {event.source && ` • ${event.source}`}
                    </div>
                  </div>
                </div>
              ))}
            {events.filter(e => new Date(e.start) >= new Date()).length === 0 && (
              <p className="text-zinc-500 text-center py-4">No upcoming events</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingEvent ? 'Edit Event' : 'New Event'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Start</label>
                  <input
                    type="datetime-local"
                    value={formData.start}
                    onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">End</label>
                  <input
                    type="datetime-local"
                    value={formData.end}
                    onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={formData.allDay}
                  onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                  className="rounded bg-zinc-800 border-zinc-700"
                />
                <label htmlFor="allDay" className="text-sm text-zinc-400">All day event</label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                {editingEvent && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="py-2 px-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingEvent ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
