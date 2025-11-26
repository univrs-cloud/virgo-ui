import { LitElement, html } from 'lit';
import { sheet } from "../styles.js";

export class Textarea extends LitElement {
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

	firstUpdated() {
		this.internals.setFormValue(this.value);
		const label = this.renderRoot.querySelector('label');
		if (label) {
			new bootstrap.Tooltip(label);
		}
	}

	render() {
		return html``;
	}
}

customElements.define('u-textarea', Textarea);
