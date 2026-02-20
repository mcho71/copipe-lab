@IsTest
private class DemoUnrelatedTest {
    @IsTest
    static void testUnrelated() {
        // DemoCalcService とは無関係なテスト
        // RunRelevantTests 実行時にはスキップされることをデモする
        Account a = new Account(Name = 'Test Account');
        insert a;
        Account fetched = [SELECT Name FROM Account WHERE Id = :a.Id];
        Assert.areEqual('Test Account', fetched.Name);
    }
}
