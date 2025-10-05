# Adno

Adno is a web application for viewing, editing and sharing narratives and pathways on static images and IIIF images.

Adno has 2 available versions : a [Full version](https://w.adno.app) including the Editor and Viewer and the [Light](https://r.adno.app) one including only the Viewer.

# Table of Contents
1. [How to start](#how-to-start-with-adno-)
2. [Host Adno](#host-adno-with-github-pages)
3. [IIIF EXAMPLES](#iiif-pictures-examples)
4. [QUICKSTART](#quickstart-with-IIIF-pictures-examples)
5. [Developpers section](#for-developpers)
6. [Keyboard shortcuts](#shortcuts-for-the-viewer)
7. [IPFS support](#ipfs-support)

## How to start with Adno ?

First, go to [Adno's repository](https://github.com/adnodev/adno/releases) and download the version you would like to use (FULL or LIGHT). 

Then, if you want to use it locally you have to use a web server.

- Unzip the package and go inside the directory.
- Create a light web server using `python -m http.server 8080`or `php -S localhost:8080` command to run a web server on the port 8080.
- Use localhost:8080 URL in your browser.

On the web, unzip the Adno package to your web server and start it.

Enjoy using Adno !

## Host Adno with your Github Pages

It's the simplest way to deploy your own Adno on the Web.

- Fork Adno repo repository.
- Copy the file `.env.example` to `.env` and adjust it's content. 
- Select this new repository and click on the `Settings` tab.
- Select the tab `Pages` on the left panel. 
- Then, you’ll have to select the source of build en deployement : `Github Actions`.
- On the top menu click on the `Actions` tab and click on the green button “I understand my workflows, go ahead and enable them”.
- On the left panel, select the tab “ADNO BUILD FULL” or “ADNO BUILD LIGHT” depending of `.env`content.
- Click on `Run workflow` (Branch:main).
- Return to “Settings” then “Pages”, click on `Visit site` button.

Enjoy using Adno !

## IIIF pictures examples

* https://ronallo.com/iiif-workshop/presentation/example-manifests.html
* https://free.iiifhosting.com/iiif/1c8d49343676a04fffcd92979c02e9394e48bac96f590fffbadffc9133cd06b9/info.json
* https://iiif.emf.fr/iiif/3/peutinger.jp2/info.json
* https://iiif.emf.fr/iiif/3/saint-savin.jpg/info.json

## Quickstart with IIIF pictures examples

* https://w.adno.app/#/search?url=https://free.iiifhosting.com/iiif/1c8d49343676a04fffcd92979c02e9394e48bac96f590fffbadffc9133cd06b9/info.json
* https://w.adno.app/#/search?url=https://iiif.emf.fr/iiif/3/peutinger.jp2/info.json
* https://w.adno.app/#/search?url=https://iiif.emf.fr/iiif/3/saint-savin.jpg/info.json

## Licence

[LICENCE](https://github.com/adnodev/adno/blob/main/LICENCE)

## For developpers

If you want to contribute to Adno here are few steps to start 

  * clone the project from github (https://github.com/adnodev/adno.git)
  * Start the project with the following command : **yarn start**
    * Create a .env file and put the version you would like (examples below)
    * run **yarn build-full** to build full-version and **yarn build-light** to build the light version.
  * In case of errors try to remove node_modules folder, .parcel-cache and yarn.lock file and reinstall module with **yarn install** command.

## Customize your own Adno

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

# GRANTED IMAGES EXTENSIONS
GRANTED_IMG_EXTENSIONS=jpg,png,JPG,PNG

# CORS SERVER
CORS_SERVER=https://app-f1586530-d9cb-472f-93fd-e586b0a801ab.cleverapps.io
```

## Build Adno

.env.ADNOFULL example :

```
# MODE 
ADNO_MODE=FULL

# FOOTER
ADNO_FOOTER=TRUE

# GRANTED IMAGES EXTENSIONS
GRANTED_IMG_EXTENSIONS=jpg,png,JPG,PNG

# CORS SERVER
CORS_SERVER=https://app-f1586530-d9cb-472f-93fd-e586b0a801ab.cleverapps.io
```

.env.ADNOLIGHT example :

```
# MODE 
ADNO_MODE=LIGHT

# FOOTER
ADNO_FOOTER=TRUE

# GRANTED IMAGES EXTENSIONS
GRANTED_IMG_EXTENSIONS=jpg,png,JPG,PNG

# CORS SERVER
CORS_SERVER=https://app-f1586530-d9cb-472f-93fd-e586b0a801ab.cleverapps.io
```

Build both versions :

Warning : this action requires .env.ADNOFULL and .env.ADNOLIGHT files !

Run **yarn build** in your terminal, it will run both commands **build-full** and **build-light**

# Adno embedded in your website

Available settings for the embed :

- delay with `min = 1` and `max = 20` (default 3 seconds)
- navigator value = `true` or `false`
- toolbar value = `true` or `false`
- toolbarsfs value = `true` or `false`
- startfirst value = `true` or `false`
- should_auto_play_annotations value = `true` or `false`
- rotation value = `true` or `false`
- anno_bounds value = `true` or `false`
- show_outlines value = `true` or `false`
- show_eyes value = `true` or `false`
- sound_mode value = `no_sound` or `spatialization` or `no_spatialization`
- show_only_current_annotation = `true` or `false` (default false)

Example : https://w.adno.app/#/embed?url=https://static.emf.fr/adno/annotations.json&delay=1&rotation=false&anno_bounds=true&show_outlines=true

A little example with an iframe that you can insert in your own projects :

```
    <iframe src="https://w.adno.app/#/embed?url=https://static.emf.fr/adno/annotations.json&delay=1&rotation=false&anno_bounds=true" height="500" width="1200" allowfullscreen="true"></iframe>

```

# SHORTCUTS FOR THE VIEWER

- Key 'P' to start the autoplay
- Key 'E' to toggle FullScreen
- Key 'S' to toggle annotation bounds
- Key 'T' to toggle the toolsbar
- Arrows (left and right) to change the current selected annotation

# IPFS SUPPORT

Add the following environment variable to use an IPFS gateway

```
# IPFS SUPPORT
IPFS_GATEWAY=https://ipfs.io/ipfs/
```
