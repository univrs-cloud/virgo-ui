import startingImage from 'assets/img/illustrations/reboot.svg';

const container = document.querySelector('#power');
const starting = container.querySelector('.starting');
starting.querySelector('.no-content-image').innerHTML = startingImage;
document.body.classList.add('starting');
starting.classList.remove('d-none');
container.classList.remove('d-none');
