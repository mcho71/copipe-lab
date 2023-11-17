import { LightningElement, track } from "lwc";
import { subscribe } from "lightning/empApi";
import Id from "@salesforce/user/Id";
import publish from "@salesforce/apex/PlatformEventService.publish";

const channel = "/event/CopipeLabEvent__e";
const COMMAND_DELAY = 1000;
// prettier-ignore
const nameList = [
  'Time', 'Past', 'Future', 'Dev', 'Fly', 'Flying', 'Soar', 'Soaring', 'Power', 'Falling', 'Fall', 'Jump', 'Cliff', 'Mountain', 'Rend', 'Red', 'Blue', 'Green', 'Yellow', 'Gold', 'Demon', 'Demonic', 'Panda', 'Cat', 'Kitty', 'Kitten', 'Zero', 'Memory', 'Trooper', 'XX', 'Bandit', 'Fear', 'Light', 'Glow', 'Tread', 'Deep', 'Deeper', 'Deepest', 'Mine', 'Your', 'Worst', 'Enemy', 'Hostile', 'Force', 'Video', 'Game', 'Donkey', 'Mule', 'Colt', 'Cult', 'Cultist', 'Magnum', 'Gun', 'Assault', 'Recon', 'Trap', 'Trapper', 'Redeem', 'Code', 'Script', 'Writer', 'Near', 'Close', 'Open', 'Cube', 'Circle', 'Geo', 'Genome', 'Germ', 'Spaz', 'Shot', 'Echo', 'Beta', 'Alpha', 'Gamma', 'Omega', 'Seal', 'Squid', 'Money', 'Cash', 'Lord', 'King', 'Duke', 'Rest', 'Fire', 'Flame', 'Morrow', 'Break', 'Breaker', 'Numb', 'Ice', 'Cold', 'Rotten', 'Sick', 'Sickly', 'Janitor', 'Camel', 'Rooster', 'Sand', 'Desert', 'Dessert', 'Hurdle', 'Racer', 'Eraser', 'Erase', 'Big', 'Small', 'Short', 'Tall', 'Sith', 'Bounty', 'Hunter', 'Cracked', 'Broken', 'Sad', 'Happy', 'Joy', 'Joyful', 'Crimson', 'Destiny', 'Deceit', 'Lies', 'Lie', 'Honest', 'Destined', 'Bloxxer', 'Hawk', 'Eagle', 'Hawker', 'Walker', 'Zombie', 'Sarge', 'Capt', 'Captain', 'Punch', 'One', 'Two', 'Uno', 'Slice', 'Slash', 'Melt', 'Melted', 'Melting', 'Fell', 'Wolf', 'Hound', 'Legacy', 'Sharp', 'Dead', 'Mew', 'Chuckle', 'Bubba', 'Bubble', 'Sandwich', 'Smasher', 'Extreme', 'Multi', 'Universe', 'Ultimate', 'Death', 'Ready', 'Monkey', 'Elevator', 'Wrench', 'Grease', 'Head', 'Theme', 'Grand', 'Cool', 'Kid', 'Boy', 'Girl', 'Vortex', 'Paradox'
];

export default class PlatformEventSample extends LightningElement {
  nickname = nameList[Math.floor(Math.random() * nameList.length)];
  message = `Welcome to Copipe Lab! Your Nickame is "${this.nickname}"! \nTry Messaging!`;
  @track
  logs = [];
  timeoutId;

  connectedCallback() {
    console.log(subscribe);
    subscribe(channel, -1, (event) => {
      console.log(JSON.stringify(event));
      console.log("logs", JSON.stringify(this.logs));
      this.logs.unshift(event);
    });
    this.publishMe();
  }

  handleInput(event) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      publish({
        userId: Id,
        nickname: this.nickname,
        message: event.detail.value
      }).then((res) => {
        console.log(res);
        console.log("logs", JSON.stringify(this.logs));
      });
    }, COMMAND_DELAY);
  }

  publishMe() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      publish({
        userId: Id,
        nickname: this.nickname,
        message:
          "I joined the chat room!" +
          document.title +
          "   href: " +
          window.location.href
      }).then((res) => {
        console.log(res);
        console.log("logs", JSON.stringify(this.logs));
      });
    }, COMMAND_DELAY);
  }
}
