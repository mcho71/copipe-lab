// ============================================================
// デモ STEP 1・2: SOQL OFFSET上限 vs Apex Cursor
// ============================================================
// 実行方法:
//   sf apex run -o spring26-apex -f 01_demo_offset_vs_cursor.apex
// ============================================================

// --- ① 従来のOFFSET（2000件が上限）---
System.debug('--- ① SOQL OFFSET 2001 ---');
try {
    List<Account> rows = [
        SELECT Id, Name FROM Account ORDER BY Name LIMIT 10 OFFSET 2001
    ];
    System.debug('取得件数: ' + rows.size());
} catch (Exception e) {
    System.debug('エラー: ' + e.getMessage());
}

// --- ② Apex Cursor で同じ位置（2001件目）---
System.debug('--- ② Cursor.fetch(2001, 10) ---');
Database.Cursor cursor = Database.getCursor(
    'SELECT Id, Name FROM Account ORDER BY Name'
);
List<Account> atOffset2001 = cursor.fetch(2001, 10);
System.debug('取得件数: ' + atOffset2001.size());
System.debug('先頭レコード: ' + atOffset2001[0].Name);

// --- ③ Apex Cursor で5000件目 ---
System.debug('--- ③ Cursor.fetch(5000, 10) ---');
List<Account> atOffset5000 = cursor.fetch(5000, 10);
System.debug('取得件数: ' + atOffset5000.size());
System.debug('先頭レコード: ' + atOffset5000[0].Name);

System.debug('--- 全体件数: ' + cursor.getNumRecords() + '件 ---');
