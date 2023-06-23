import { LightningElement, wire } from "lwc";
import { publish, MessageContext } from "lightning/messageService";
import CLMC from "@salesforce/messageChannel/CopipeLabMessageChannel__c";

const COMMAND_DELAY = 1000;
export default class Command extends LightningElement {
  @wire(MessageContext) messageContext;
  title = "this is command component.";
  command = "command";

  // private
  timeoutId;

  handleInput(event) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      publish(this.messageContext, CLMC, { command: event.detail.value });
    }, COMMAND_DELAY);
  }
}
