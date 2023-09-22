import { LightningElement, track, wire } from "lwc";
import getRecords from "@salesforce/apex/CopipeLabController.getRecords";
import { deleteRecord, getRecord } from "lightning/uiRecordApi";
import { publish, MessageContext } from "lightning/messageService";
import CLMC from "@salesforce/messageChannel/CopipeLabMessageChannel__c";

const KEY_FIELD = "Id";
const COLUMNS = [
  {
    label: "Id",
    fieldName: "Id"
  },
  { label: "Name", fieldName: "Name" },
  {
    type: "action",
    typeAttributes: {
      rowActions: [
        { label: "Edit", name: "edit" },
        { label: "Streaming", name: "streaming" },
        { label: "Delete", name: "delete" }
      ]
    }
  }
];

export default class List extends LightningElement {
  @wire(MessageContext) messageContext;
  @track
  _records;
  get records() {
    return this._records ?? [];
  }
  columns = COLUMNS;
  keyField = KEY_FIELD;

  async connectedCallback() {
    this._records = await getRecords();
  }

  async handleRowAction(event) {
    console.log(JSON.stringify(event.detail));
    if (event.detail.action.name === "delete") {
      await deleteRecord(event.detail.row.Id);
      this._records = await getRecords();
    } else if (event.detail.action.name === "edit") {
      console.log("edit");
    } else if (event.detail.action.name === "streaming") {
      publish(this.messageContext, CLMC, { command: event.detail.row.Name });
    }
  }
}
