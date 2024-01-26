import { getRecord } from "lightning/uiRecordApi";
import { LightningElement, api, wire } from "lwc";
import NAME_FIELD from "@salesforce/schema/User.Name";
import SMALL_PHOTO_URL_FIELD from "@salesforce/schema/User.SmallPhotoUrl";

export default class UserInfo extends LightningElement {
  @api
  userId;

	user;
  @wire(getRecord, { recordId: "$userId", fields: [NAME_FIELD, SMALL_PHOTO_URL_FIELD] })
	setUser({data, error}) {
		if (data) {
			this.user = Object.keys(data.fields).reduce((acc, key) => {
				acc[key] = data.fields[key].value;
				return acc;
			}, {});
		} else if (error) {
			console.error(error);
		}
	}
}
