import { LitElement, html } from 'lit';
import { sheet } from "../styles.js";

export class Select extends LitElement {
	static formAssociated = true;

	constructor() {
		super();
		this.internals = this.attachInternals();
	}

	createRenderRoot() {
		const root = super.createRenderRoot();
		root.adoptedStyleSheets = [sheet];
		return root;
	}

	render() {
		return html``;
	}
}

customElements.define('u-select', Select);
