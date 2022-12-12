# ADNO

Adno is a web application to visualize, edit and a peer-to-peer sharing for static high quality pictures.

ADNO has 2 available versions : a Full version including the Editor and Viewer and the Light one including only the Viewer.

## How to start with ADNO ?

First, go to https://github.com/Serli/adno/releases/ and download the version you would like to use (FULL or LIGHT)
Then, if you want to use it locally you have to use a web server.
You can create a light web server using **python -m http.server 8080** command to run a web server on the port 8080.
Unzip the ADNO package to your web server and start it.


## Host ADNO with Github Pages

Download the latest release of Adno with the version of your choice ( full-version or light-version) from  https://github.com/Serli/adno/releases/ 

Unzip the archive to your folder and push it to your Github repository.

Once you’ve pushed to Github you need to go to Github’s website, select your repository and click on the “settings” tab.

Then, select the tab “Pages” on the left panel.

You’ll have to select the branch you want to deploy the website from and save your choice.

Enjoy using Adno !


## IIIF pictures examples
* https://ronallo.com/iiif-workshop/presentation/example-manifests.html
* https://free.iiifhosting.com/iiif/1c8d49343676a04fffcd92979c02e9394e48bac96f590fffbadffc9133cd06b9/info.json
* https://iiif.emf.fr/iiif/3/peutinger.jp2/info.json
* https://iiif.emf.fr/iiif/3/saint-savin.jpg/info.json

## Licence

## For developpers

If you want to contribute to ADNO here are few steps to start 
  * clone the project from github (https://github.com/Serli/adno.git)
  * switch to adno-react branch
  * Start the project with the following command : **yarn start**
    * Create a .env file and put the version you would like to use by using the variable ADNO_MODE=FULL or ADNO_MODE=LIGHT
  * To build the project you have to choose the version (full or light)
    * run **yarn build-full** to build full-version and **yarn build-light** to build the light version.
  * In case of errors try to remove node_modules folder, .parcel-cache and yarn.lock file and reinstall module with **yarn install** command.


