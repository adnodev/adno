import WBK from "wikibase-sdk"
import "./WikiSearch.css"
class WikiSearch {
    static get toolbox() {
        return {
            title: 'AdnoWikiData',
            icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-66 39v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>'
        };
    }

    constructor({ data }) {
        this.data = data;
        this.wrapper = undefined;
    }


    wbk = WBK({
        instance: 'https://www.wikidata.org',
        sparqlEndpoint: 'https://query.wikidata.org/sparql' // Required to use `sparqlQuery` and `getReverseClaims` functions, optional otherwise
    })

    clickFunction(img, title, description, wiki_link) {
        this.data.imgUrl = img
        this.data.title = title
        this.data.description = description
        this.data.wiki_link = wiki_link

        this.clearCurrentDivs()

        this.createWikiMedia(img, title, description, wiki_link)
    }

    clearCurrentDivs() {
        for (let index = 0; index < this.wrapper.children.length; index++) {
            if (this.wrapper.children[index].tagName.toUpperCase() === "DIV") {
                this.wrapper.children[index].remove()
            }
        }
    }

    render() {
        this.wrapper = document.createElement('div');
        const input = document.createElement('input');
        this.wrapper.appendChild(input);

        input.classList.add('cdx-input', 'image-tool__caption');

        input.placeholder = 'Rechercher quelque chose sur wikidata...';
        input.value = this.data && this.data.title ? this.data.title : '';

        // Display card if it exists
        this.data && this.data.title && this.data.description && this.createWikiMedia(this.data.imgUrl, this.data.title, this.data.description, this.data.wiki_link)

        input.addEventListener('change', (e) => {

            if (e.target.value.length > 3) {
                this.clearCurrentDivs()
                let language = "fr";
                let limit = 5;
                let format = "json"

                let resultDiv = document.createElement("div")
                resultDiv.id = "result-div"

                let wiki_data = this.wbk.searchEntities(e.target.value, language, limit, format)
                fetch(wiki_data)
                    .then(resp => {
                        if (resp.status === 200) {
                            resp.json()
                                .then(data => {

                                    data.search.forEach(element => {
                                        let p1 = document.createElement("p")
                                        p1.innerText = element.concepturi

                                        let elemDiv = document.createElement("div")
                                        elemDiv.classList.add("card", "card-side", "bg-base-100", "shadow-xl")

                                        let ent = this.wbk.getEntities({ ids: element.id })

                                        fetch(ent)
                                            .then(resEnt => resEnt.json())
                                            // .then(this.wbk.simplify.entities)
                                            // .then(r => r[Object.keys(r)[0]].claims["P18"])
                                            .then(wikiEntity => {
                                                let images = wikiEntity.entities[element.id] && wikiEntity.entities[element.id].claims["P18"]
                                                if (images) {
                                                    let imgUrl = `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${images[0].mainsnak.datavalue.value}&width=100`

                                                    let img = document.createElement("img")
                                                    img.src = imgUrl



                                                    elemDiv.innerHTML = `
                                    <figure><img src="${imgUrl}" alt="Movie"/></figure>
                                    <div class="card-body">
                                      <h2 class="card-title">${element.concepturi}</h2>
                                      <p>${element.description}</p>
                                      <p>${element.concepturi}</p>
                                      <div class="card-actions justify-end">
                                        <button class="btn btn-primary">Sélectionner</button>
                                      </div>
                                    </div>`

                                                    elemDiv.onclick = () => this.clickFunction(imgUrl, element.label, element.description, element.concepturi)

                                                    resultDiv.appendChild(elemDiv)
                                                    this.wrapper.appendChild(resultDiv)
                                                }
                                            })
                                    });


                                })

                        } else {
                            console.error("Impossible de trouver l'oeuvre");
                        }
                    })
            }
        });

        return this.wrapper;
    }

    createWikiMedia(imgUrl, title, description, wiki_link) {
        let elemDiv = document.createElement("div")
        elemDiv.classList.add("card", "card-side", "bg-base-100", "shadow-xl")
        elemDiv.id = "result-card"

        elemDiv.innerHTML = `
                <figure><img src="${imgUrl}" alt="${title}" /></figure>
                <div class="card-body">
                    <h2 class="card-title">${title}</h2>
                    <p>${description}</p>
                    <a href="${wiki_link}" target="_blank">${wiki_link}</a>
                </div>
            </div>`


        this.wrapper.appendChild(elemDiv)

    }

    save() {
        return {
            imgUrl: this.data.imgUrl || "",
            title: this.data.title || "",
            description: this.data.description || "",
            wiki_link: this.data.wiki_link || ""
        }
    }
}

export default WikiSearch



