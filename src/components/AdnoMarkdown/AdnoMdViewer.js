import { Component } from "react";
import ReactMarkdown from 'react-markdown'
import WBK from "wikibase-sdk"

import "./AdnoMarkdown.css";

class AdnoMdViewer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            annos: "",
            isLoaded: false
        }
    }

    componentDidMount() {
        this.getAnnoBody()
        this.setState({ isLoaded: true })
    }

    getAnnoBody = () => {
        const wbk = WBK({
            instance: 'https://www.wikidata.org',
            sparqlEndpoint: 'https://query.wikidata.org/sparql'
        })

        if (Array.isArray(this.props.selectedAnnotation.body) && this.props.selectedAnnotation.body.length > 0) {
            var annoMdBody = this.props.selectedAnnotation.body.filter(annobody => annobody.type === "TextualBody" && annobody.purpose === "commenting")[0] ? this.props.selectedAnnotation.body.filter(annobody => annobody.type === "TextualBody" && annobody.purpose === "commenting")[0].value : ""

            var finalBody = ""

            annoMdBody.split("\n\n").forEach(async (line) => {

                if (line.match("https?:\/\/www.wikidata.org\/wiki\/[a-zA-Z0-9]*")) {
                    const element = line.match("https?:\/\/www.wikidata.org\/wiki\/[a-zA-Z0-9]*")[0];

                    const wikiID = element.replace('https://www.wikidata.org/wiki/', '')

                    const url = wbk.getEntities({
                        ids: [wikiID],
                        language: ['fr']
                    })

                    const { entities } = await fetch(url).then(res => res.json())

                    const wikiName = `[${entities[wikiID].labels.fr.value}](${element})`;
                    const wikiDesc = entities[wikiID].descriptions.fr.value;

                    let images = entities[wikiID] && entities[wikiID].claims["P18"]

                    finalBody += "\n\n" + wikiName + "\n\n"
                    finalBody += wikiDesc + "\n\n"

                    if (images) {
                        const imgUrl = `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${images[0].mainsnak.datavalue.value}&width=200`
                        finalBody += `![${wikiName}](${new URL(imgUrl)})` + "\n\n"
                    }
                    this.setState({ annos: finalBody })

                } else {
                    finalBody += line
                    this.setState({ annos: finalBody })
                }
            })

        } else {
            this.setState({ annos: "" })
        }
    }

    render() {
        return (
            <div className="anno-full-view">
                <div className="text-rich">
                    <div className="card w-96 bg-base-100 shadow-xl rich-card-editor">
                        <div className="card-body">
                            <div className="card-actions justify-end">
                                <button className="btn btn-square btn-sm" onClick={() => this.props.closeFullView()}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="card-body over-hidden">
                                <div className="markdown-body">
                                    {
                                        this.state.isLoaded && this.state.annos &&
                                        <ReactMarkdown children={this.state.annos} />
                                    }
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default AdnoMdViewer;