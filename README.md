How to build DEB
----
npm install -g node-deb

npm install

npm run build

node-deb --no-default-package-dependencies --no-rebuild --install-strategy copy -- dist/
