import { LightningElement, wire } from "lwc";
import { MessageContext, subscribe } from "lightning/messageService";
import CLMC from "@salesforce/messageChannel/CopipeLabMessageChannel__c";

export default class Anagram extends LightningElement {
  output = "no input...";
  @wire(MessageContext) messageContext;
  subscription = null;

  connectedCallback() {
    this.subscription = subscribe(this.messageContext, CLMC, (message) => {
      this.output = this.anagram(message.command);
    });
  }

  anagram(str) {
    return str.split("").reverse().join("");
  }
}