// @IsTest(testFor='ApexClass:DemoCalcService') で明示的に紐づけ
@IsTest(testFor='ApexClass:DemoCalcService')
private class DemoCalcServiceTest {
    @IsTest
    static void testAdd() {
        Assert.areEqual(5, DemoCalcService.add(2, 3));
    }

    @IsTest
    static void testMultiply() {
        Assert.areEqual(6, DemoCalcService.multiply(2, 3));
    }

    @IsTest
    static void testSubtract() {
        Assert.areEqual(1, DemoCalcService.subtract(3, 2));
    }
}
