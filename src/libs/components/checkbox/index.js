import { LitElement, html } from 'lit';
import { sheet } from "../styles.js";

export class Checkbox extends LitElement {
	static formAssociated = true;
	static styles = [sheet];

	static get properties() {
		return {
			label: { type: String, reflect: true },
			inline: { type: Boolean, reflect: true },
			reverse: { type: Boolean, reflect: true },
			indeterminate: { type: Boolean },
			checked: { type: Boolean, reflect: true },
			disabled: { type: Boolean, reflect: true }
		}
	}

	#initialChecked = false;
	#initialDisabled = false;

	constructor() {
		super();
		this.internals = this.attachInternals();

		this.onValue = true;
		this.offValue = false;
		this.label = '';
		this.inline = false;
		this.reverse = false;
		this.indeterminate = false;
		this.checked = false;
		this.disabled = false;
	}

	connectedCallback() {
		super.connectedCallback();
		this.#initialChecked = this.hasAttribute('checked');
		this.#initialDisabled = this.hasAttribute('disabled');
		this.value = this.checked ? this.onValue : this.offValue;
		this.internals.setFormValue(this.value);
	}

	async formResetCallback() {
		this.indeterminate = false;
		this.checked = this.#initialChecked;
		this.disabled = this.#initialDisabled;
		await this.updateComplete;
		const input = this.renderRoot.querySelector('input');
		input.indeterminate = this.indeterminate;
		input.checked = this.checked;
		input.dispatchEvent(new Event('change'));
	}

	updated(changedProps) {
		if (changedProps.has('indeterminate')) {
			if (this.indeterminate && this.checked) {
				this.checked = false;
			}
			this.value = this.checked ? this.onValue : this.offValue;
			this.internals.setFormValue(this.value);
			const input = this.renderRoot.querySelector('input');
			input.checked = this.checked;
			input.indeterminate = this.indeterminate;
		}
	}

	render() {
		return html`
			<div class="form-check ${this.inline ? 'form-check-inline' : ''} ${this.reverse ? 'form-check-reverse' : ''}">
				<label class="form-check-label">
					<input
						type="checkbox"
						class="form-check-input"
						?checked=${this.checked}
						?disabled=${this.disabled}
						@change=${this.#onChange}
					>
					${this.label}
				</label>
			</div>
		`;
	}

	#onChange(event) {
		this.indeterminate = false;
		this.checked = event.target.checked;
		this.value = this.checked ? this.onValue : this.offValue;
		this.internals.setFormValue(this.value);
		this.dispatchEvent(new CustomEvent('checked-changed', { detail: event, bubbles: true, composed: true }));
	}
}

customElements.define('u-checkbox', Checkbox);
