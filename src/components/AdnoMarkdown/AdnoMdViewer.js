import { Component } from "react";
import ReactMarkdown from 'react-markdown'
import WBK from "wikibase-sdk"
import { InfinitySpin } from 'react-loader-spinner'

// Import style
import "./AdnoMarkdown.css";

class AdnoMdViewer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            annos: "",
            isLoaded: false
        }
    }

    async componentDidMount() {
        await this.getAnnoBody()
        this.setState({ isLoaded: true })
    }

    applyWikiContent = async (wbk, line) => {
        var finalBody = this.state.annos

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

            let wikiBody = "";
            wikiBody += wikiName + "\n"
            wikiBody += wikiDesc + "\n"

            if (images) {
                const imgUrl = `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${images[0].mainsnak.datavalue.value}&width=200`
                wikiBody += `\n ![${wikiName}](${new URL(imgUrl)}) \n`
            }

            const regex = new RegExp("https?:\/\/www.wikidata.org\/wiki\/[a-zA-Z0-9]*")
            finalBody += line.replace(regex, wikiBody)

            this.setState({ annos: finalBody })

        } else {
            finalBody += line
            this.setState({ annos: "\n\n" + finalBody + "\n\n" })
        }
    }

    getAnnoBody = async () => {
        const wbk = WBK({
            instance: 'https://www.wikidata.org',
            sparqlEndpoint: 'https://query.wikidata.org/sparql'
        })

        if (Array.isArray(this.props.selectedAnnotation.body) && this.props.selectedAnnotation.body.length > 0) {
            var annoMdBody = this.props.selectedAnnotation.body.filter(annobody => annobody.type === "TextualBody" && annobody.purpose === "commenting")[0] ? this.props.selectedAnnotation.body.filter(annobody => annobody.type === "TextualBody" && annobody.purpose === "commenting")[0].value : ""

            const allLines = annoMdBody.split("\n")

            for (const line of allLines) {
                if (line !== "") {
                    await this.applyWikiContent(wbk, line);
                }
            }
        }
    }

    render() {
        return (
            <div className="anno-full-view">
                <div className="text-rich">
                    <div className="card w-full max-w-4xl bg-base-100 shadow-xl rich-card-editor">
                        <div className="card-body">
                            <div className="card-actions justify-end">
                                <button className="btn btn-square btn-sm" onClick={() => this.props.closeFullView()}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="card-body over-hidden">
                                <div className="markdown-body" style={{
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    {
                                        this.state.isLoaded && this.state.annos ?
                                            <ReactMarkdown children={this.state.annos} />
                                            :
                                            <InfinitySpin
                                                width='200'
                                                height="200"
                                                color="black"
                                            />
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
