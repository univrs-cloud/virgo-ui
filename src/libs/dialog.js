(() => {
	document.body.addEventListener('show.bs.modal', (event) => {
		const modal = event.target;
		const bootstrapModalBackdropZIndex = 2000;
		const modalZIndex = _.size(document.body.querySelectorAll('.modal.show')) + bootstrapModalBackdropZIndex + 1;
		modal.style.zIndex = modalZIndex;
	});
	document.body.addEventListener('hidden.bs.modal', (event) => {
		if (!_.isNull(document.body.querySelector('.modal.show'))) {
			document.body.classList.add('modal-open');
		}
	});

	const createModal = (title, content, buttons, focusIndex = 0, escValue = null) => {
		return new Promise((resolve) => {
			const modalId = `dialog-${Math.random().toString(36).substr(2, 9)}`;
			const modalHtml = `
				<div id="${modalId}" class="modal fade" tabindex="-1">
					<div class="modal-dialog modal-sm modal-dialog-centered modal-dialog-scrollable">
						<div class="modal-content">
							<div class="modal-header">
								<h5 class="modal-title">${title}</h5>
							</div>
							<div class="modal-body">
								<p>${content}</p>
							</div>
							<div class="modal-footer">
								${buttons.map((button, index) => `
									<button type="button" class="btn ${button.class}" data-value="${button.value}" data-index="${index}">${button.text}</button>
								`).join('')}
							</div>
						</div>
					</div>
				</div>
			`;

			document.body.insertAdjacentHTML('beforeend', modalHtml);
			const modalElement = document.getElementById(modalId);

			// Show the modal
			const bootstrapModal = new bootstrap.Modal(modalElement, { keyboard: true });
			bootstrapModal.show();

			// Handle button clicks
			modalElement.querySelectorAll('.modal-footer .btn').forEach((button) => {
				button.addEventListener('click', (event) => {
					const value = event.target.getAttribute('data-value');
					resolve(value);
					bootstrapModal.hide();
				});
			});

			// Handle Esc key
			modalElement.addEventListener('hidden.bs.modal', () => {
				resolve(escValue);
				modalElement.remove();
			});

			// Set focus on the specified button
			bootstrapModal._element.addEventListener('shown.bs.modal', (event) => {
				modalElement.querySelector(`.modal-footer .btn[data-index="${focusIndex}"]`)?.focus();
			});
		});
	}

	window.alert = async (text) => {
		const buttons = [{ text: 'OK', class: 'btn-primary', value: true }];
		await createModal('Alert', text, buttons);
	};

	window.confirm = async (text, options = {}) => {
		const {
			buttons = [
				{ text: 'Cancel', class: 'btn-outline-secondary d-flex ms-auto', value: false },
				{ text: 'OK', class: 'btn-primary', value: true }
			],
			focus = 1
		} = options;
		const result = await createModal('Confirmation', text, buttons, focus, false);
		try {
			return JSON.parse(result); // Convert value to boolean if possible
		} catch (error) {
			return result; // Return as-is if not JSON-parseable
		}
	};
})();
