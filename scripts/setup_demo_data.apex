// 20,000件の Account を投入 (5,000件 × 4バッチの Queueable チェーン)
System.enqueueJob(new DemoDataLoader(0, 4, 5000));
