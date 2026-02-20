// ============================================================
// デモ STEP 3: Queueable ジョブ起動スクリプト
// ============================================================
// 事前に 02_AccountCursorQueueable.cls をデプロイしておくこと
// 実行方法:
//   sf apex run -o spring26-apex -f 03_demo_cursor_queueable.apex
// ジョブ結果確認:
//   sf data query -o spring26-apex \
//     -q "SELECT Status, CreatedDate FROM AsyncApexJob WHERE JobType='Queueable' ORDER BY CreatedDate DESC LIMIT 5"
// ============================================================

// LIMIT 1000 で5ジョブ分（200件×5）に絞る（Developer組織のチェーン上限対策）
Database.Cursor c = Database.getCursor(
    'SELECT Id, Name FROM Account WHERE Name LIKE \'TEST%\' ORDER BY Name LIMIT 1000'
);
System.debug('総件数: ' + c.getNumRecords());
System.enqueueJob(new AccountCursorQueueable(c, 0, 200, 1));
System.debug('Queueable ジョブを起動しました');
