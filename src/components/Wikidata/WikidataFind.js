import WBK from "wikibase-sdk"

export function searchOnWikidata(textQuery, containerID, editorRef) {

    wbk = WBK({
        instance: 'https://www.wikidata.org',
        sparqlEndpoint: 'https://query.wikidata.org/sparql'
    })
    const language = "fr";
    const limit = 5;
    const format = "json"

    const url = wbk.searchEntities({
        search: textQuery,
        language,
        limit,
        format,
    })
    fetch(url)
        .then(resp => {
            if (resp.status === 200) {
                resp.json()
                    .then(data => {

                        data.search.forEach(element => {

                            console.log(element);
                            console.log(element.label);
                            console.log(element.description);

                            let ent = this.wbk.getEntities({ ids: element.id })

                            // Next, we have to find the attached image
                            fetch(ent)
                                .then(resEnt => resEnt.json())
                                .then(wikiEntity => {
                                    console.log("wikiEntity", wikiEntity.entities[element.id]);


                                    let images = wikiEntity.entities[element.id] && wikiEntity.entities[element.id].claims["P18"]



                                    if (images) {
                                        let imgUrl = `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${images[0].mainsnak.datavalue.value}&width=100`

                                        const imgWikidata = document.createElement("img")
                                        imgWikidata.src = imgUrl
                                        imgWikidata.onclick = () => {
                                            editorRef.getInstance().exec('link', 'http://www.google.com.au/images/nav_logo7.png');

                                            console.log(`[![${textQuery}](http://www.google.com.au/images/nav_logo7.png)](http://google.com.au/)`);
                                            
                                            console.log(editorRef.getInstance().eventEmitter.emit('closePopup'));
                                        }

                                        document.getElementById(containerID).appendChild(imgWikidata)

                                        console.log("imgUrl", imgUrl);

                                    }


                                })
                        });


                    })

            } else {
                console.error("Impossible de trouver l'oeuvre");
            }
        })
}
