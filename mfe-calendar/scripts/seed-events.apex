// Sample events for the current demo week (times are JST: GMT+9).
List<Event> events = new List<Event>();
Integer[][] rows = new Integer[][] {
    new Integer[] { 12, 10, 0, 60 },   // Mon 10:00 (60 min)
    new Integer[] { 13, 14, 0, 90 },   // Tue 14:00 (90 min)
    new Integer[] { 14, 12, 15, 45 },  // Wed 12:15 (45 min)
    new Integer[] { 15, 16, 0, 60 },   // Thu 16:00 (60 min)
    new Integer[] { 16, 11, 0, 60 }    // Fri 11:00 (60 min)
};
String[] subjects = new String[] { '週次定例', '顧客打ち合わせ', 'ゆるっとSalesforce #79', '1on1', 'コードレビュー' };
for (Integer i = 0; i < rows.size(); i++) {
    Integer[] r = rows[i];
    Datetime startAt = Datetime.newInstanceGmt(2026, 10, r[0], r[1] - 9, r[2], 0);
    events.add(new Event(Subject = subjects[i], StartDateTime = startAt, EndDateTime = startAt.addMinutes(r[3])));
}
insert events;
System.debug('inserted ' + events.size());
