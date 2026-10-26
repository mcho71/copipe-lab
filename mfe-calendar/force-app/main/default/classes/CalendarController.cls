/**
 * Host-side data access for the calendar microfrontend.
 * The guest (React in an iframe) never calls Salesforce; it only sends events.
 */
public with sharing class CalendarController {
    public class CalEvent {
        @AuraEnabled public Id id;
        @AuraEnabled public String subject;
        @AuraEnabled public Datetime startDateTime;
        @AuraEnabled public Datetime endDateTime;
    }

    @AuraEnabled(cacheable=true)
    public static List<CalEvent> getMyEvents(Datetime startAt, Datetime endAt) {
        List<CalEvent> result = new List<CalEvent>();
        for (Event e : [
            SELECT Id, Subject, StartDateTime, EndDateTime
            FROM Event
            WHERE OwnerId = :UserInfo.getUserId()
              AND IsAllDayEvent = false
              AND StartDateTime >= :startAt
              AND StartDateTime < :endAt
            ORDER BY StartDateTime
            LIMIT 200
        ]) {
            CalEvent c = new CalEvent();
            c.id = e.Id;
            c.subject = e.Subject;
            c.startDateTime = e.StartDateTime;
            c.endDateTime = e.EndDateTime;
            result.add(c);
        }
        return result;
    }

    @AuraEnabled
    public static void moveEvent(Id eventId, Datetime startDateTime, Datetime endDateTime) {
        update new Event(Id = eventId, StartDateTime = startDateTime, EndDateTime = endDateTime);
    }
}
