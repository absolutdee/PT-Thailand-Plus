// GoogleCalendarService.js
import { gapi } from 'gapi-script';

class GoogleCalendarService {
  constructor() {
    this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
    this.SCOPES = 'https://www.googleapis.com/auth/calendar';
    this.isInitialized = false;
  }

  // Initialize Google API
  async initialize(apiKey, clientId) {
    try {
      await gapi.load('client:auth2', async () => {
        await gapi.client.init({
          apiKey: apiKey,
          clientId: clientId,
          discoveryDocs: [this.DISCOVERY_DOC],
          scope: this.SCOPES
        });
        this.isInitialized = true;
      });
    } catch (error) {
      console.error('Error initializing Google Calendar API:', error);
    }
  }

  // Sign in to Google
  async signIn() {
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      return true;
    } catch (error) {
      console.error('Error signing in:', error);
      return false;
    }
  }

  // Sign out from Google
  async signOut() {
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      return false;
    }
  }

  // Check if user is signed in
  isSignedIn() {
    const authInstance = gapi.auth2.getAuthInstance();
    return authInstance && authInstance.isSignedIn.get();
  }

  // Create event in Google Calendar
  async createEvent(sessionData) {
    if (!this.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const event = {
      summary: `เทรนกับ ${sessionData.clientName}`,
      description: `ประเภท: ${sessionData.type}\nสถานที่: ${sessionData.location}\nหมายเหตุ: ${sessionData.notes || 'ไม่มี'}`,
      start: {
        dateTime: `${sessionData.date}T${sessionData.startTime}:00`,
        timeZone: 'Asia/Bangkok'
      },
      end: {
        dateTime: `${sessionData.date}T${sessionData.endTime}:00`,
        timeZone: 'Asia/Bangkok'
      },
      location: sessionData.location,
      attendees: sessionData.clientEmail ? [
        { email: sessionData.clientEmail }
      ] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 } // 30 minutes before
        ]
      },
      colorId: this.getColorBySessionType(sessionData.type)
    };

    try {
      const response = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        sendUpdates: 'all' // Send invitations to attendees
      });
      
      return {
        success: true,
        eventId: response.result.id,
        htmlLink: response.result.htmlLink
      };
    } catch (error) {
      console.error('Error creating event:', error);
      return { success: false, error: error.message };
    }
  }

  // Update event in Google Calendar
  async updateEvent(eventId, sessionData) {
    if (!this.isSignedIn()) {
      throw new Error('User not signed in');
    }

    const event = {
      summary: `เทรนกับ ${sessionData.clientName}`,
      description: `ประเภท: ${sessionData.type}\nสถานที่: ${sessionData.location}\nหมายเหตุ: ${sessionData.notes || 'ไม่มี'}`,
      start: {
        dateTime: `${sessionData.date}T${sessionData.startTime}:00`,
        timeZone: 'Asia/Bangkok'
      },
      end: {
        dateTime: `${sessionData.date}T${sessionData.endTime}:00`,
        timeZone: 'Asia/Bangkok'
      },
      location: sessionData.location,
      attendees: sessionData.clientEmail ? [
        { email: sessionData.clientEmail }
      ] : [],
      colorId: this.getColorBySessionType(sessionData.type)
    };

    try {
      const response = await gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event,
        sendUpdates: 'all'
      });
      
      return { success: true, event: response.result };
    } catch (error) {
      console.error('Error updating event:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete event from Google Calendar
  async deleteEvent(eventId) {
    if (!this.isSignedIn()) {
      throw new Error('User not signed in');
    }

    try {
      await gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all'
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting event:', error);
      return { success: false, error: error.message };
    }
  }

  // Get events from Google Calendar
  async getEvents(startDate, endDate) {
    if (!this.isSignedIn()) {
      throw new Error('User not signed in');
    }

    try {
      const response = await gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return {
        success: true,
        events: response.result.items || []
      };
    } catch (error) {
      console.error('Error fetching events:', error);
      return { success: false, error: error.message };
    }
  }

  // Check for time conflicts
  async checkConflicts(startDateTime, endDateTime, excludeEventId = null) {
    if (!this.isSignedIn()) {
      return { hasConflict: false };
    }

    try {
      const response = await gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: startDateTime,
        timeMax: endDateTime,
        showDeleted: false,
        singleEvents: true
      });

      const conflictingEvents = response.result.items.filter(event => {
        // Exclude the event being edited
        if (excludeEventId && event.id === excludeEventId) {
          return false;
        }
        
        // Check for time overlap
        const eventStart = new Date(event.start.dateTime || event.start.date);
        const eventEnd = new Date(event.end.dateTime || event.end.date);
        const checkStart = new Date(startDateTime);
        const checkEnd = new Date(endDateTime);

        return (checkStart < eventEnd && checkEnd > eventStart);
      });

      return {
        hasConflict: conflictingEvents.length > 0,
        conflictingEvents
      };
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return { hasConflict: false };
    }
  }

  // Get color ID based on session type
  getColorBySessionType(type) {
    const colorMap = {
      'Personal Training': '1', // Blue
      'Weight Loss Program': '11', // Red
      'Muscle Building': '10', // Green
      'Rehabilitation': '5', // Yellow
      'Group Training': '9' // Purple
    };
    return colorMap[type] || '1';
  }

  // Import events to local sessions
  convertGoogleEventToSession(event) {
    const startDateTime = new Date(event.start.dateTime || event.start.date);
    const endDateTime = new Date(event.end.dateTime || event.end.date);

    return {
      id: `google_${event.id}`,
      googleEventId: event.id,
      clientName: this.extractClientNameFromSummary(event.summary),
      date: startDateTime.toISOString().split('T')[0],
      startTime: startDateTime.toTimeString().slice(0, 5),
      endTime: endDateTime.toTimeString().slice(0, 5),
      type: this.extractTypeFromDescription(event.description),
      location: event.location || '',
      status: 'confirmed',
      notes: event.description || '',
      source: 'google_calendar'
    };
  }

  // Helper functions
  extractClientNameFromSummary(summary) {
    const match = summary.match(/เทรนกับ (.+)/);
    return match ? match[1] : summary;
  }

  extractTypeFromDescription(description) {
    if (!description) return 'Personal Training';
    const match = description.match(/ประเภท: (.+)/);
    return match ? match[1] : 'Personal Training';
  }
}

export default GoogleCalendarService;