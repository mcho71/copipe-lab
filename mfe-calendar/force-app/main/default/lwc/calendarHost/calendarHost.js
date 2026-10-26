/**
 * Calendar host — the LWC side of the microfrontend.
 *
 * Reads the current user's events with Apex and hands them to the guest
 * (a React app in lightning-ui-embedding) as props. The guest sends
 * `eventmove` and `weekchange` events back; this component saves the move
 * with Apex and refreshes, so the new times flow back to the guest as props.
 */
import { LightningElement, wire } from "lwc";
import { refreshApex } from "@salesforce/apex";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import getMyEvents from "@salesforce/apex/CalendarController.getMyEvents";
import moveEvent from "@salesforce/apex/CalendarController.moveEvent";
import LANG from "@salesforce/i18n/lang";
import LOCALE from "@salesforce/i18n/locale";
import TIME_ZONE from "@salesforce/i18n/timeZone";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diffToMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

export default class CalendarHost extends LightningElement {
  src = "http://localhost:5175/";
  weekStart = startOfWeek(new Date()).toISOString();
  events = [];
  wiredEvents;

  get weekEnd() {
    return new Date(new Date(this.weekStart).getTime() + 7 * DAY_MS).toISOString();
  }

  @wire(getMyEvents, { startAt: "$weekStart", endAt: "$weekEnd" })
  handleEvents(result) {
    this.wiredEvents = result;
    if (result.data) {
      this.events = result.data.map((e) => ({
        id: e.id,
        subject: e.subject,
        start: e.startDateTime,
        end: e.endDateTime
      }));
    }
  }

  // A new object each time, so the guest's subscribe callback fires on change.
  // The host never answered the guest's ui-state subscription while props held
  // an array of objects, so the events go over as a JSON string instead.
  get hostProps() {
    return {
      weekStart: this.weekStart,
      eventsJson: JSON.stringify(this.events),
      lang: LANG,
      locale: LOCALE,
      timeZone: TIME_ZONE
    };
  }

  async handleEventMove(evt) {
    const { id, start, end } = evt.detail ?? {};
    if (!id) return;
    try {
      await moveEvent({ eventId: id, startDateTime: start, endDateTime: end });
      await refreshApex(this.wiredEvents);
      this.dispatchEvent(
        new ShowToastEvent({ title: "Event moved", message: "The event time was saved.", variant: "success" })
      );
    } catch (err) {
      await refreshApex(this.wiredEvents);
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Could not move the event",
          message: err?.body?.message ?? err?.message ?? "Unknown error",
          variant: "error"
        })
      );
    }
  }

  handleWeekChange(evt) {
    const { weekStart } = evt.detail ?? {};
    if (weekStart) this.weekStart = weekStart;
  }
}
