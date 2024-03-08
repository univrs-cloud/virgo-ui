How to build DEB
---
`npm install -g node-deb`

`npm install`

`npm run build`

`node-deb --no-default-package-dependencies --no-rebuild --install-strategy copy -- dist/`


How to install DEB
---
`dpkg -i virgo-ui_1.0.0_all.deb`


How to access UI
---
It required [virgo-api](https://github.com/univrs-cloud/virgo-api) to be installed and running.
`https://ip:3000`
