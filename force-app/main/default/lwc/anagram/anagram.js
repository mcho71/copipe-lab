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
      this.generateSVG(message.command);
    });
  }

  anagram(str) {
    return str.split("").reverse().join("");
  }

  generateSVG(str) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xlink", "http://www.w3.org/1999/xlink");
    svg.setAttribute("width", "400");
    svg.setAttribute("height", "150");
    // 生成した文字列をSVGの要素に変換
    for (let i = 0; i < str.length; i++) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.textContent = str.charAt(i);
      text.setAttribute("x", 50 + Math.floor(Math.random() * 300));
      text.setAttribute("y", 50 + Math.floor(Math.random() * 50));
      text.setAttribute("rotate", Math.floor(Math.random() * 360));
      text.setAttribute(
        "fill",
        `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${
          Math.random() * 255
        })`
      );
      text.style.fontSize = "40px";
      text.style.fontWeight = "bold";
      svg.appendChild(text);
    }
    // SVGの要素をHTMLに埋め込み
    this.template.querySelector(".svg").innerHTML = "";
    this.template.querySelector(".svg").appendChild(svg);
  }
}
