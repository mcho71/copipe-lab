import { LightningElement, track } from 'lwc';
import loadAccounts from '@salesforce/apex/AccountCursorController.loadAccounts';

const PAGE_SIZE = 50;

export default class AccountCursorList extends LightningElement {
    @track records = [];
    cursor = null;
    nextOffset = 0;
    totalRecords = 0;
    hasMore = true;
    isLoading = false;
    error = null;

    connectedCallback() {
        this.handleLoadMore();
    }

    async handleLoadMore() {
        if (this.isLoading) return;
        this.isLoading = true;
        this.error = null;
        try {
            const result = await loadAccounts({
                cursor: this.cursor,
                offset: this.nextOffset,
                pageSize: PAGE_SIZE
            });
            console.log('[AccountCursor] result', JSON.stringify(result, null, 2));
            console.log('[AccountCursor] cursor', JSON.stringify(result.cursor, null, 2));
            this.cursor = result.cursor;
            this.records = [...this.records, ...result.records];
            this.nextOffset = result.nextOffset;
            this.totalRecords = result.totalRecords;
            this.hasMore = result.hasMore;
            console.log('[AccountCursor] state', JSON.stringify({
                loaded: this.records.length,
                total: this.totalRecords,
                nextOffset: this.nextOffset,
                hasMore: this.hasMore
            }, null, 2));
        } catch (e) {
            this.error = e.body?.message ?? e.message;
        } finally {
            this.isLoading = false;
        }
    }

    get countLabel() {
        return `${this.records.length} / ${this.totalRecords} 件`;
    }

    get loadMoreLabel() {
        return `次の${PAGE_SIZE}件を読み込む`;
    }
}
