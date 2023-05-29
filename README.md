# ADNO

Adno is a web application for viewing, editing and sharing narratives and pathways on static images and IIIF images.

ADNO has 2 available versions : a [Full version](https://w.adno.app) including the Editor and Viewer and the [Light](https://r.adno.app) one including only the Viewer.

## How to start with ADNO ?

First, go to [ADNO's repository](https://github.com/adnodev/adno/releases) and download the version you would like to use (FULL or LIGHT)
Then, if you want to use it locally you have to use a web server.
You can create a light web server using **python -m http.server 8080** command to run a web server on the port 8080.
Unzip the ADNO package to your web server and start it.


## Host ADNO with Github Pages

Download the latest release of Adno with the version of your choice (full-version or light-version) from (https://github.com/adnodev/adno/releases)

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

[LICENCE](https://github.com/adnodev/adno/blob/main/LICENCE)

## For developpers

If you want to contribute to ADNO here are few steps to start 
  * clone the project from github (https://github.com/adnodev/adno.git)
  * Start the project with the following command : **yarn start**
    * Create a .env file and put the version you would like (examples below)
    * run **yarn build-full** to build full-version and **yarn build-light** to build the light version.
  * In case of errors try to remove node_modules folder, .parcel-cache and yarn.lock file and reinstall module with **yarn install** command.

## Customize your own ADNO
Create a .env file and insert the following properties as you wish :
```
# MODE 
ADNO_MODE=FULL

# MATOMO
MATOMO_SITE_ID=YOUR SITE ID HERE
MATOMO_URL=YOUR OWN MATOMO URL

# WEBSITE PROPERTIES
ADNO_TITLE=YOUR OWN TITLE

# FOOTER
ADNO_FOOTER=TRUE
ADNO_FOOTER_TEXT=YOUR FOOTER TEXT HERE

```

## Build ADNO
.env.ADNOFULL example :

```
# MODE 
ADNO_MODE=FULL

# FOOTER
ADNO_FOOTER=TRUE
```

.env.ADNOLIGHT example :

```
# MODE 
ADNO_MODE=LIGHT

# FOOTER
ADNO_FOOTER=TRUE

```

Build both versions :

Warning : this action requires .env.ADNOFULL and .env.ADNOLIGHT files !
Run **yarn build** in your terminal, it will run both commands **build-full** and **build-light**


# ADNO embedded in your website

Available settings for the embed :

- delay with `min = 1` and `max = 20` (seconds)
- navigator value = `true` or `false`
- toolbarsfs value = `true` or `false`
- startfirst value = `true` or `false`
- rotation value = `true` or `false`
- toolbar value = `true` or `false`
- anno_bounds value = `true` or `false`

Example : https://w.adno.app/#/embed?url=https://static.emf.fr/adno/annotations.json&delay=1&rotation=false&anno_bounds=true

A little example with an iframe that you can insert in your own projects :

```
    <iframe src="https://w.adno.app/#/embed?url=https://static.emf.fr/adno/annotations.json&delay=1&rotation=false&anno_bounds=true" height="500" width="1200" allowfullscreen="true"></iframe>

```