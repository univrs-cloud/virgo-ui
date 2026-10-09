(() => {
	const createModal = (title, content, buttons, focusIndex = 0, escValue = null, acknowledge = null) => {
		return new Promise((resolve) => {
			const modalId = `dialog-${Math.random().toString(36).slice(2)}`;
			const acknowledgeHtml = (acknowledge ? `
								<div class="form-field">
									<input class="check" type="checkbox" id="${modalId}-acknowledge">
									<label for="${modalId}-acknowledge">${acknowledge}</label>
								</div>
			` : '');
			const modalHtml = `
				<dialog id="${modalId}" class="dialog dialog-sm dialog-scrollable" tabindex="-1" data-bs-keyboard="true">
					<div class="dialog-header">
						<h1 class="dialog-title">${title}</h1>
					</div>
					<div class="dialog-body">
						<p${acknowledge ? '' : ' class="m-0"'}>${content}</p>
						${acknowledgeHtml}
					</div>
					<div class="dialog-footer">
						${_.join(
							_.map(_.reverse(buttons), (button, index, array) => {
								const reversedIndex = (array.length - 1) - index;
								return `<button type="button" class="${button.class}" data-value="${button.value}" data-index="${reversedIndex}">${button.text}</button>`;
							})
						, '')}
					</div>
				</dialog>
			`;

			document.body.insertAdjacentHTML('beforeend', modalHtml);
			const modalElement = document.getElementById(modalId);
			const acknowledgeInput = modalElement.querySelector('.check');
			const confirmButton = modalElement.querySelector('.dialog-footer button[data-index="0"]');
			if (acknowledgeInput && confirmButton) {
				confirmButton.disabled = true;
				acknowledgeInput.addEventListener('change', () => {
					confirmButton.disabled = !acknowledgeInput.checked;
				});
			}

			// Show the modal
			const bootstrapModal = new bootstrap.Dialog(modalElement, { keyboard: true });
			bootstrapModal.show();

			// Handle button clicks
			modalElement.querySelectorAll('.dialog-footer button').forEach((button) => {
				button.addEventListener('click', (event) => {
					const value = event.target.dataset.value;
					resolve(value);
					bootstrapModal.hide();
				});
			});

			// Handle Esc key
			modalElement.addEventListener('hidden.bs.dialog', () => {
				resolve(escValue);
				modalElement.remove();
			});

			// Set focus on the specified button
			bootstrapModal._element.addEventListener('shown.bs.dialog', (event) => {
				modalElement.querySelector(`.dialog-footer button[data-index="${focusIndex}"]`)?.focus();
			});
		});
	}

	window.alert = async (text) => {
		const buttons = [{ text: 'OK', class: 'btn-solid theme-primary', value: true }];
		await createModal('Alert', text, buttons);
	};

	window.confirm = async (text, options = {}) => {
		const defaultButtons = [
			{ text: 'OK', class: 'btn-solid theme-primary', value: true },
			{ text: 'Cancel', class: 'btn-outline theme-secondary d-flex ms-auto', value: false }
		];
		const buttons = _.map(defaultButtons, (defaultBtn, index) => {
			const override = options.buttons?.[index] ?? {};
			return { ...defaultBtn, ...override };
		});
		const focus = options.focus ?? 1;
		const result = await createModal('Confirmation', text, buttons, focus, false, options.acknowledge ?? null);
		try {
			return JSON.parse(result);
		} catch (error) {
			return result;
		}
	};
})();
