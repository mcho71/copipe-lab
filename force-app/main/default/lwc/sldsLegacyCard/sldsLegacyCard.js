import { LightningElement } from 'lwc';

export default class SldsLegacyCard extends LightningElement {
    title = '営業案件レポート';
    description = '今四半期のパイプライン状況';

    metrics = [
        { id: 'open', label: 'Open 案件', value: 42, severity: 'success' },
        { id: 'slipping', label: 'スリッピング', value: 7, severity: 'warning' },
        { id: 'lost', label: 'クローズ Lost', value: 3, severity: 'error' }
    ];

    get itemsWithClass() {
        return this.metrics.map((m) => ({
            ...m,
            valueClass: `metric-value metric-${m.severity}`
        }));
    }
}
