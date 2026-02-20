// 1-2. レコードタイプ別選択リスト値取得デモ
// ConnectApi.RecordUi.getPicklistValuesByRecordType()
// Spring '26 で追加。従来の UI API へのHTTPコールアウトが不要に。

// Master レコードタイプの ID を取得（isMaster() で環境によらず取得）
Id rtId;
for (Schema.RecordTypeInfo rti : Schema.SObjectType.Account.getRecordTypeInfos()) {
    if (rti.isMaster()) {
        rtId = rti.getRecordTypeId();
        System.debug('RecordType: ' + rti.getName() + ' / ID: ' + rtId);
        break;
    }
}

// ★ Spring '26 新メソッド: Apex から直接ピックリスト値を取得
ConnectApi.PicklistValuesCollection result =
    ConnectApi.RecordUi.getPicklistValuesByRecordType('Account', rtId);

// 結果を JSON で出力
System.debug('=== PicklistValuesCollection (JSON) ===');
System.debug(JSON.serializePretty(result));
