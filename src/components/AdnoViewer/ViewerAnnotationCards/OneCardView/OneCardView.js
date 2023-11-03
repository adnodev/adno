import { Component } from "react";

// Import Utils
import { buildTagsList, generateUUID } from "../../../../Utils/utils";

// Import Html Parser
import ReactHtmlParser from 'react-html-parser';

// Import FontAwesome for all icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullseye, faPlusCircle } from "@fortawesome/free-solid-svg-icons";

// Add translations
import { withTranslation } from "react-i18next";

// Import Wikidata SDK
import WBK from "wikibase-sdk"
import ReactMarkdown from "react-markdown";

class OneCardView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fullView: false,
            url: "",
            annoBody: ""
            //annoBody: this.props.annotation.body[0] && this.props.annotation.body[0].value && ReactHtmlParser(this.props.annotation.body[0].value)
        }
    }

    // componentDidMount() {
    //     this.buildExternalLink()
    // }

    async componentDidMount() {
        await this.getAnnoBody()
        this.setState({ isLoaded: true })
    }

    applyWikiContent = async (wbk, line) => {
        var finalBody = this.state.annoBody

        if (line.match("https?:\/\/www.wikidata.org\/wiki\/[a-zA-Z0-9]*")) {

            const element = line.match("https?:\/\/www.wikidata.org\/wiki\/[a-zA-Z0-9]*")[0];
            var wikiBody = "";

            const wikiID = element.replace('https://www.wikidata.org/wiki/', '')

            const url = wbk.getEntities({
                ids: [wikiID],
                language: ['fr']
            })

            const { entities } = await fetch(url).then(res => res.json())

            const wikiName = `[${entities[wikiID].labels.fr.value}](${element})`;
            const wikiDesc = entities[wikiID].descriptions.fr.value;

            let images = entities[wikiID] && entities[wikiID].claims["P18"]

            wikiBody += wikiName + "\n"
            wikiBody += wikiDesc + "\n"

            if (images) {
                const imgUrl = `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${images[0].mainsnak.datavalue.value}&width=200`
                wikiBody += `![${wikiName}](${new URL(imgUrl)})`
            }

            if (line.match(/\[([^\[]+)\](\(.*\))/gm)) {
                finalBody += line.replace(/\[([^\[]+)\](\(.*\))/gm, wikiBody)
            } else {
                const regex = new RegExp("https?:\/\/www.wikidata.org\/wiki\/[a-zA-Z0-9]*")
                finalBody += line.replace(regex, wikiBody)
            }

            this.setState({ annoBody: finalBody })

        } else {
            finalBody += line
            this.setState({ annoBody: finalBody })
        }
    }

    getAnnoBody = async () => {
        const wbk = WBK({
            instance: 'https://www.wikidata.org',
            sparqlEndpoint: 'https://query.wikidata.org/sparql'
        })

        if (this.props.annotation.body && this.props.annotation.body.length > 0) {
            var annoMdBody = this.props.annotation.body[0].value

            const allLines = annoMdBody.split("\n")

            for (const line of allLines) {
                if (line !== "") {
                    await this.applyWikiContent(wbk, line);
                }
            }
        }
    }

    getAnnotationHTMLBody = () => {
        let annotation = this.props.annotation

        if (annotation && annotation.body) {
            if (Array.isArray(annotation.body) && annotation.body.find(annoBody => annoBody.type === "HTMLBody") && annotation.body.find(annoBody => annoBody.type === "HTMLBody").value !== "") {
                return ReactHtmlParser(annotation.body.find(annoBody => annoBody.type === "HTMLBody").value)
            } else {
                return ReactHtmlParser(`<span class="no-content">Ø ${this.props.t('annotation.no_content')}</span>`)
            }
        } else {
            return ReactHtmlParser(`<span class="no-content">Ø ${this.props.t('annotation.no_content')}</span>`)
        }
    }

    buildExternalLink = () => {
        if (this.props.annotation.target.selector.type === "FragmentSelector" && this.props.project.manifest_url) {

            let coordinates = this.props.annotation.target.selector.value.replace("xywh=pixel:", "")

            let coord_left = Math.round(coordinates.split(",")[0])
            let coord_top = Math.round(coordinates.split(",")[1])
            let coord_width = Math.round(coordinates.split(",")[2])
            let coord_height = Math.round(coordinates.split(",")[3])

            let newCoordinates = `${coord_left},${coord_top},${coord_width},${coord_height}`

            let url_full = `${this.props.annotation.target.source}/${newCoordinates}/full/0/default.jpg`
            let url_max = `${this.props.annotation.target.source}/${newCoordinates}/max/0/default.jpg`

            fetch(url_full)
                .then(res => {
                    if (res.ok) {
                        this.setState({ url: url_full })
                    } else {
                        fetch(url_max)
                            .then(res => {
                                if (res.ok) {
                                    this.setState({ url: url_max })
                                }
                            })
                    }
                })
                .catch(() => {
                    fetch(url_max)
                        .then(res => {
                            if (res.ok) {
                                this.setState({ url: url_max })
                            }
                        })
                })
        }
    }

    render() {
        return (
            <div className="anno-card-body">
                {/* <h6 className="card-subtitle mb-2 text-muted"> {buildTagsList(this.props.annotation)} </h6> */}

                <div className="card-tags-list">
                    {
                        buildTagsList(this.props.annotation).map(tag => {
                            return (
                                <div key={generateUUID()} className="text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-blue-200 text-blue-700 rounded-full">
                                    {tag.value}
                                </div>
                            )
                        })
                    }
                </div>

                <div className={this.props.selectedAnno && this.props.selectedAnno.id === this.props.annotation.id ? "adno-card-selected-body" : "adno-card-body"}>
                    {/* {this.getAnnotationHTMLBody()} */}
                    <ReactMarkdown children={this.state.annoBody} />
                </div>


                <div className="btn-line-one-card">

                    {this.state.annoBody && <button type="button" className="btn btn-outline btn-sm btn-show-more" onClick={() => this.props.openFullAnnotationView(this.props.annotation)}> {this.props.t('annotation.read_more')} <FontAwesomeIcon icon={faPlusCircle} /></button>}

                    <button type="button"
                        onClick={() => this.props.clickOnTarget(this.props.annotation)}
                        className="btn btn-outline btn-sm btn-show-more"> <FontAwesomeIcon icon={faBullseye} />
                    </button>

                    {/* Afficher la redirection vers la zone de l'annotation */}
                    {/* {this.state.url && <a href={this.state.url} className="btn btn-outline btn-success btn-sm btn-show-more" target="_blank"> <FontAwesomeIcon icon={faArrowUpRightFromSquare} /></a>} */}
                </div>
            </div >
        )
    }
}
export default withTranslation()(OneCardView);