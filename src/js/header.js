import headerPartial from '../partials/header.html';

let container = document.querySelector('header');

morphdom(container, _.template(headerPartial)());
