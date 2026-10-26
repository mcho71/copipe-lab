@IsTest
private class CalendarControllerTest {
    @IsTest
    static void getsAndMovesMyEvents() {
        Datetime base = Datetime.newInstanceGmt(2026, 10, 28, 1, 0, 0);
        Event e = new Event(Subject = 'Test', StartDateTime = base, EndDateTime = base.addHours(1));
        insert e;

        List<CalendarController.CalEvent> events =
            CalendarController.getMyEvents(base.addDays(-1), base.addDays(1));
        Assert.areEqual(1, events.size());

        CalendarController.moveEvent(e.Id, base.addHours(2), base.addHours(3));
        Event moved = [SELECT StartDateTime FROM Event WHERE Id = :e.Id];
        Assert.areEqual(base.addHours(2), moved.StartDateTime);
    }
}
