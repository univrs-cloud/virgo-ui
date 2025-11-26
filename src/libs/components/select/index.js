import { LitElement, html } from 'lit';
import { sheet } from "../styles.js";

export class Select extends LitElement {
	static formAssociated = true;

	static get properties() {
		return {
			value: { type: String },
			label: { type: String, reflect: true },
			disabled: { type: Boolean, reflect: true },
			tip: { type: String, reflect: true },
			error: { type: String },
			isInvalid: { type: Boolean, reflect: true },
			options: { type: Array } // [{ value, text, disabled, default } or { label, disabled, options: [...] }]
		};
	}

	constructor() {
		super();
		this.internals = this.attachInternals();

		this.value = '';
		this.label = '';
		this.disabled = false;
		this.tip = '';
		this.options = [];
		this._error = '';
	}

	set error(value) {
		this._error = value;
		this.classList.toggle('is-invalid', Boolean(value));
	}
	
	get error() {
		return this._error;
	}

	formResetCallback() {
		this.value = this.getAttribute('value') ?? '';
		this.error = '';
		this.showPassword = false;
		this.internals.setFormValue(this.value);
	}

	createRenderRoot() {
		const root = super.createRenderRoot();
		root.adoptedStyleSheets = [sheet];
		return root;
	}

	firstUpdated() {
		const label = this.renderRoot.querySelector('label');
		if (label) {
			new bootstrap.Tooltip(label);
		}

		this._updateOptionsFromLightDOM();
	}

	updated(changedProps) {
		this.internals.setFormValue(this.value);
	}

	renderOptGroup(group) {
		return html`
			<optgroup
				.label=${group.label}
				.disabled=${group.disabled || false}
			>
				${group.options.map((option) => { return this.renderOption(option); })}
			</optgroup>
		`;
	}

	renderOption(option) {
		return html`
			<option
				.value=${option.value}
				.selected=${option.default || option.value === this.value}
				.disabled=${option.disabled || false}
			>
				${option.label}
			</option>
		`;
	}

	render() {
		return html`
			<div class="form-floating mb-3">
				<select
					.value=${this.value}
					.disabled=${this.disabled}
					class="form-select ${this.error ? 'is-invalid' : ''}"
					@change=${this._onChange}
				>
					${this.options.map((option) => { return option.options ? this.renderOptGroup(option) : this.renderOption(option); })}
				</select>
				<label>
					${this.label}
					${this.tip ? html`<span class="help-inline ms-1" data-bs-toggle="tooltip" data-bs-original-title=${this.tip}><i class="icon-solid icon-question-circle"></i></span>` : ''}
				</label>
				<div class="invalid-feedback">${this.error || ''}</div>
			</div>
		`;
	}

	_onChange(event) {
		this.value = event.target.value;
		this.internals.setFormValue(this.value);
		this.dispatchEvent(new CustomEvent('value-changed', { detail: this.value }));
	}

	_updateOptionsFromLightDOM() {
		const lightOptions = Array.from(this.children);
		this.options = lightOptions.map((element) => {
			if (element.tagName.toLowerCase() === 'optgroup') {
				return {
					label: element.label,
					disabled: element.disabled,
					options: Array.from(element.children).map((opt) => ({
						value: opt.value,
						label: opt.textContent,
						default: opt.selected,
						disabled: opt.disabled
					}))
				};
			} else if (element.tagName.toLowerCase() === 'option') {
				return {
					value: element.value,
					label: element.textContent,
					default: element.selected,
					disabled: element.disabled,
				};
			}
		});
		this.textContent = '';

		if (!this.value) {
			const defaultOption = this.options.find(o => !o.options && o.default) || (this.options.find(o => o.options)?.options.find(opt => opt.default));
			if (defaultOption) {
				this.value = defaultOption.value;
				this.internals.setFormValue(this.value);
			}
		}
	}
}

customElements.define('u-select', Select);
