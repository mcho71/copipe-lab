// 1-3. PDF生成の強化デモ
// Blob.toPdf() が Visualforce と同じレンダリングエンジンを使用。
// CJK言語（日本語含む）に完全対応。

String html = '<html><head>'
    + '<style>body { font-family: sans-serif; font-size: 14px; }'
    + 'h1 { color: #1a73e8; } table { border-collapse: collapse; width: 100%; margin-top: 16px; }'
    + 'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }'
    + 'th { background-color: #f2f2f2; }</style>'
    + '</head><body>'
    + '<h1>Spring \'26 PDF生成デモ</h1>'
    + '<p>Blob.toPdf() が CJK 文字に完全対応しました。</p>'
    + '<h2>日本語テスト</h2>'
    + '<p>漢字: 東京都渋谷区 / ひらがな: さくらが咲いた / カタカナ: サーバーレス</p>'
    + '<table>'
    + '<tr><th>取引先名</th><th>業種</th><th>都市</th></tr>'
    + '<tr><td>株式会社テスト</td><td>テクノロジー</td><td>東京</td></tr>'
    + '<tr><td>サンプル合同会社</td><td>製造</td><td>大阪</td></tr>'
    + '<tr><td>デモ有限会社</td><td>金融</td><td>名古屋</td></tr>'
    + '</table>'
    + '<p style="margin-top: 24px; color: #666;">生成日時: ' + String.valueOf(Datetime.now()) + '</p>'
    + '</body></html>';

// ★ Spring '26 強化: CJK 文字が正しくレンダリングされる
Blob pdfBlob = Blob.toPdf(html);
System.debug('PDF生成成功: ' + pdfBlob.size() + ' bytes');

// ContentVersion に保存（「ファイル」タブで PDF を確認可能）
ContentVersion cv = new ContentVersion();
cv.Title = 'CJK_PDF_Demo_Spring26';
cv.PathOnClient = 'CJK_PDF_Demo_Spring26.pdf';
cv.VersionData = pdfBlob;
insert cv;

System.debug('ContentVersion ID: ' + cv.Id);
System.debug('>>> Salesforce の「ファイル」タブで "CJK_PDF_Demo_Spring26" を開いて日本語が正しく表示されることを確認してください');
