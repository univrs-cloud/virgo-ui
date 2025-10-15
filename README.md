[![Build](https://github.com/univrs-cloud/virgo-ui/actions/workflows/build-and-release.yml/badge.svg)](https://github.com/univrs-cloud/virgo-ui/actions/workflows/build-and-release.yml)

How to build DEB
---
`npm ci`

`npm run build`

`npm run deb`


How to install DEB
---
`apt install -y --reinstall ./virgo-ui_1.0.0_all.deb`


How to access UI
---
It requires [virgo-api](https://github.com/univrs-cloud/virgo-api) to be installed and running.

`https://ip:3000`
