import { LightningElement, track, wire } from "lwc";
import { MessageContext, subscribe } from "lightning/messageService";
import CLMC from "@salesforce/messageChannel/CopipeLabMessageChannel__c";

export default class History extends LightningElement {
  @wire(MessageContext) messageContext;
  subscription = null;

  @track
  histories = [];

  connectedCallback() {
    this.subscription = subscribe(this.messageContext, CLMC, (message) => {
      console.log(message.command, this.histories);
      this.histories.push({
        command: message.command,
        subscribeAt: Date.now()
      });
    });
  }
}
