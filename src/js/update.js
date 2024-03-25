import updateModal from '../partials/modals/update.html';

document.querySelector('body').insertAdjacentHTML('beforeend', updateModal);

let modal = document.querySelector('#update');

const install = (event) => {
	event.preventDefault();
	console.log('Installing...');
};

modal.querySelector('.install').addEventListener('click', install);
