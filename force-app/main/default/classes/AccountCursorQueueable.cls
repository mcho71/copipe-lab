public class AccountCursorQueueable implements Queueable {

    private Database.Cursor cursor;
    private Integer position;
    private Integer batchSize;
    private Integer jobCount;

    public AccountCursorQueueable(Database.Cursor cursor, Integer position, Integer batchSize, Integer jobCount) {
        this.cursor    = cursor;
        this.position  = position;
        this.batchSize = batchSize;
        this.jobCount  = jobCount;
    }

    public void execute(QueueableContext ctx) {
        List<Account> batch = cursor.fetch(position, batchSize);

        // ここに実際の処理を書く（集計・更新など）
        System.debug('Job #' + jobCount
            + ' | position: ' + position
            + ' 〜 ' + (position + batch.size() - 1)
            + ' | 件数: ' + batch.size()
            + ' | 先頭: ' + batch[0].Name);

        Integer nextPosition = position + batch.size();
        if (nextPosition < cursor.getNumRecords()) {
            System.enqueueJob(new AccountCursorQueueable(
                cursor, nextPosition, batchSize, jobCount + 1
            ));
        } else {
            System.debug('完了 | 全' + cursor.getNumRecords() + '件処理しました');
        }
    }
}
