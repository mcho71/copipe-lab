public with sharing class AccountCursorController {

    public class LoadResult {
        @AuraEnabled public Database.PaginationCursor cursor;
        @AuraEnabled public List<Account> records;
        @AuraEnabled public Integer nextOffset;
        @AuraEnabled public Integer totalRecords;
        @AuraEnabled public Boolean hasMore;
    }

    @AuraEnabled(cacheable=false)
    public static LoadResult loadAccounts(
        Database.PaginationCursor cursor,
        Integer offset,
        Integer pageSize
    ) {
        if (cursor == null) {
            cursor = Database.getPaginationCursor(
                'SELECT Id, Name, Industry, Type, BillingCity FROM Account ORDER BY Name',
                AccessLevel.USER_MODE
            );
        }

        Database.CursorFetchResult fetchResult = cursor.fetchPage(offset, pageSize);

        LoadResult result = new LoadResult();
        result.cursor = cursor;
        result.records = fetchResult.getRecords();
        result.nextOffset = fetchResult.getNextIndex();
        result.totalRecords = cursor.getNumRecords();
        result.hasMore = fetchResult.getNextIndex() > 0 && fetchResult.getNextIndex() < cursor.getNumRecords();
        return result;
    }
}
