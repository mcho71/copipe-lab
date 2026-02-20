// @IsTest(critical=true) で RunRelevantTests 時も必ず実行される
@IsTest(critical=true)
private class DemoCriticalTest {
    @IsTest
    static void alwaysRuns() {
        Assert.isTrue(true, 'このテストは常に実行される');
    }
}
