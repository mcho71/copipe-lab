import { LightningElement, track } from "lwc";
import { subscribe } from "lightning/empApi";
import Id from "@salesforce/user/Id";
import publish from "@salesforce/apex/PlatformEventService.publishViewing";
/**
 * @typedef {{UserId__c: string, Action__c: string, PageUrl__c: string, PageTitle__c: string, CreatedById: string, CreatedDate: string}} ViewingMemberEvent
 */

const channel = "/event/ViewingMemberEvent__e";
const convertViewingUserEvent = (/** @type {ViewingMemberEvent} */ event) => ({
  userId: event.UserId__c,
  pageUrl: event.PageUrl__c,
	pageTitle: event.PageTitle__c,
	createdDate: new Date(event.CreatedDate)
});
const handlePublish = (promise) => {
  promise
    .then((res) => {
      console.log("publish result", JSON.stringify(res));
    })
    .catch((err) => {
      console.error("publish error", JSON.stringify(err));
    });
};

export default class ViewingUserList extends LightningElement {
  /**
   * @type {{userId: string, pageUrl: string, pageTitle: string, createdDate: Date }[]}
   */
  @track
  viewingUserList = [];
  connectedCallback() {
    subscribe(
      channel,
      -1,
      (/** @type {{data: {payload: ViewingMemberEvent}}} */ event) => {
        const index = this.viewingUserList.findIndex(
          (e) => e.userId === event.data.payload.UserId__c
        );

        if (event.data.payload.Action__c === "Leaving") {
          if (index === -1) {
            return;
          }
          this.viewingUserList.splice(index, 1);
        } else if (event.data.payload.Action__c === "Viewing") {
          if (index >= 0) {
            this.viewingUserList.splice(index, 1);
          }
          this.viewingUserList.unshift(
            convertViewingUserEvent(event.data.payload)
          );
        }
      }
    )
      .then((res) => {
        console.log("subscribe result", JSON.stringify(res));
      })
      .catch((err) => {
        console.error("subscribe error", JSON.stringify(err));
      });
    this.publishViewing();
  }

  disconnectedCallback() {
    handlePublish(
      publish({
        userId: Id,
        action: "Leaving",
        pageUrl: window.location.href
      })
    );
  }

  publishViewing() {
    handlePublish(
      publish({
        userId: Id,
        action: "Viewing",
        pageUrl: window.location.href,
				pageTitle: document.title
      })
    );
  }
}
