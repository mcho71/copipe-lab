public class DemoDataLoader implements Queueable {
    private Integer batchNumber;
    private Integer totalBatches;
    private Integer batchSize;

    public DemoDataLoader(Integer batchNumber, Integer totalBatches, Integer batchSize) {
        this.batchNumber = batchNumber;
        this.totalBatches = totalBatches;
        this.batchSize = batchSize;
    }

    public void execute(QueueableContext ctx) {
        List<Account> accounts = new List<Account>();
        Integer startIndex = batchNumber * batchSize;
        for (Integer i = 0; i < batchSize; i++) {
            Integer idx = startIndex + i;
            accounts.add(new Account(
                Name = 'TEST-' + String.valueOf(idx).leftPad(5, '0'),
                Industry = 'Technology',
                BillingCity = 'Tokyo'
            ));
        }
        insert accounts;
        System.debug('Batch #' + batchNumber + ' 完了: ' + accounts.size() + '件投入');

        if (batchNumber + 1 < totalBatches) {
            System.enqueueJob(
                new DemoDataLoader(batchNumber + 1, totalBatches, batchSize)
            );
        } else {
            System.debug('全データ投入完了: ' + (totalBatches * batchSize) + '件');
        }
    }
}
