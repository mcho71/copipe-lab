@IsTest
private class CalendarVfControllerTest {
    @IsTest
    static void getsAndMovesMyEventsWithIsoStrings() {
        Datetime base = Datetime.newInstanceGmt(2026, 10, 28, 1, 0, 0);
        Event e = new Event(Subject = 'Test', StartDateTime = base, EndDateTime = base.addHours(1));
        insert e;

        Assert.areEqual(1, CalendarVfController.getMyEvents('2026-10-27T00:00:00.000Z', '2026-10-29T00:00:00.000Z').size());

        CalendarVfController.moveEvent(e.Id, '2026-10-28T03:00:00.000Z', '2026-10-28T04:00:00.000Z');
        Event moved = [SELECT StartDateTime FROM Event WHERE Id = :e.Id];
        Assert.areEqual(base.addHours(2), moved.StartDateTime);
    }
}
