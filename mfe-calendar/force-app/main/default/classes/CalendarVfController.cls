/**
 * Controller for the Visualforce version of the calendar (calendarVf page).
 * The React bundle in the static resource calls these with JavaScript Remoting;
 * the queries themselves are CalendarController's.
 */
public with sharing class CalendarVfController {
    @RemoteAction
    public static List<CalendarController.CalEvent> getMyEvents(String startAt, String endAt) {
        return CalendarController.getMyEvents(parse(startAt), parse(endAt));
    }

    @RemoteAction
    public static void moveEvent(String eventId, String startDateTime, String endDateTime) {
        CalendarController.moveEvent(eventId, parse(startDateTime), parse(endDateTime));
    }

    // The page sends ISO 8601 strings (Date.prototype.toISOString).
    private static Datetime parse(String iso) {
        return (Datetime) JSON.deserialize('"' + iso + '"', Datetime.class);
    }
}
