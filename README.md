An Electron-based app for Windows, OS X, and Linux to view offline Photosynths and panoramas

### Build Instructions
#### Install Node.js with NPM. Run the following inside this directory
```
npm install
npm run release
```

### Folder Structure
`app/synth` contains the photosynth viewer

`app/pano/jspanoviewer.js` contains the panorama viewer

`app/zip_server.js` contains the code for reading from zip files`

After building, the installer will be in the `dist` directory.  A portable distribution will be there as well.
