import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Component } from "react";
import { withRouter } from "react-router";
import { get_url_extension } from "../../Utils/utils";
import {
    faMagnifyingGlassMinus,
    faPlay,
    faPause,
    faEye,
    faEyeSlash,
    faArrowRight,
    faArrowLeft,
    faExpand,
    faRotateRight,
    faQuestion,
} from "@fortawesome/free-solid-svg-icons";
import ReactHtmlParser from "react-html-parser";
import Swal from "sweetalert2";
import { withTranslation } from "react-i18next";

// Import Style
import "./AdnoEmbed.css";

class AdnoEmbed extends Component {
    constructor(props) {
        super(props);
        this.state = {
            annos: [],
            currentID: -1,
            intervalID: 0,
            selectedAnno: {},
            isLoaded: false,
        };
    }

    overrideSettings = () => {
        const query = new URLSearchParams(this.props.location.search);

        // Add default delay of 3 seconds
        var delay = 3;

        // Check if the user setted a delay in the url settings
        if (query.get("delay")) {
            const timerDelay = Number.parseInt(query.get("delay"));
            if (delay >= 1 && delay <= 20) {
                delay = timerDelay;
            }
        }

        var showNavigator = query.get("navigator")
            ? query.get("navigator") === "true"
            : true;
        var toolsbarOnFs = query.get("toolbarsfs")
            ? query.get("toolbarsfs") === "true"
            : true;
        var startbyfirstanno = query.get("startfirst")
            ? query.get("startfirst") === "true"
            : false;
        var rotation = query.get("rotation")
            ? query.get("rotation") === "true"
            : false;
        var showToolbar = query.get("toolbar")
            ? query.get("toolbar") === "true"
            : true;
        var isAnnotationsVisible = query.get("anno_bounds")
            ? query.get("anno_bounds") === "true"
            : false;
        const tags = query.get("tags") || []

        const settings = {
            delay,
            showNavigator,
            toolsbarOnFs,
            sidebarEnabled: true,
            startbyfirstanno,
            rotation,
            isAnnotationsVisible,
            showToolbar,
            tags
        };
        // Update settings
        this.setState({ ...settings });
    };

    componentDidMount() {
        const query = new URLSearchParams(this.props.location.search);

        let urlParam = query.get("url")
        if (urlParam) {
            const rawURLParam = this.props.location.search
                .split("?")
                .slice(1)
                .find(query => query.startsWith("url="));

            urlParam = rawURLParam.replace("url=", "")
        }

        this.getAdnoProject(urlParam);

        // Accessibility shortcuts
        addEventListener("fullscreenchange", this.updateFullScreenEvent);
        addEventListener("keydown", this.keyPressedEvents);
    }

    displayViewer = (tileSources, annos) => {
        this.openSeadragon = OpenSeadragon({
            id: "adno-embed",
            homeButton: "home-button",
            showNavigator: false,
            tileSources: tileSources,
            prefixUrl: "https://cdn.jsdelivr.net/gh/Benomrans/openseadragon-icons@main/images/",
        });

        OpenSeadragon.setString("Tooltips.FullPage", this.props.t('editor.fullpage'));
        OpenSeadragon.setString("Tooltips.Home", this.props.t('editor.home'));
        OpenSeadragon.setString("Tooltips.ZoomIn", this.props.t('editor.zoom_in'));
        OpenSeadragon.setString("Tooltips.ZoomOut", this.props.t('editor.zoom_out'));
        OpenSeadragon.setString("Tooltips.NextPage", this.props.t('editor.next_page'));
        OpenSeadragon.setString("Tooltips.PreviousPage", this.props.t('editor.previous_page'));
        OpenSeadragon.setString("Tooltips.RotateLeft", this.props.t('editor.rotate_left'));
        OpenSeadragon.setString("Tooltips.RotateRight", this.props.t('editor.rotate_right'));
        OpenSeadragon.setString("Tooltips.Flip", this.props.t('editor.flip'));

	const annoStyle = this.props.outlineWidth+" "+this.props.outlineColor+" "+this.props.outlineColorFocus;

	const annoFormatter = function() {
		return annoStyle;
	}

        this.AdnoAnnotorious = OpenSeadragon.Annotorious(this.openSeadragon, {
            locale: "auto",
            drawOnSingleClick: true,
            allowEmpty: true,
            disableEditor: true,
            readOnly: true,
	    formatters: annoFormatter
        });

        this.AdnoAnnotorious.setVisible(this.state.isAnnotationsVisible);

        this.AdnoAnnotorious.on("clickAnnotation", (annotation) => {
            if (this.state.isAnnotationsVisible) {
                this.AdnoAnnotorious.fitBounds(annotation.id);

                let annotationIndex = this.state.annos.findIndex(
                    (anno) => anno.id === annotation.id
                );

                this.setState({ currentID: annotationIndex, selectedAnno: annotation });
            }
        });

        // Generate dataURI and load annotations into Annotorious
        const dataURI =
            "data:application/json;base64," +
            btoa(unescape(encodeURIComponent(JSON.stringify(annos))));
        this.AdnoAnnotorious.loadAnnotations(dataURI);
    };

    toggleAnnotationsLayer = () => {
        this.AdnoAnnotorious.setVisible(!this.state.isAnnotationsVisible);
        this.setState({ isAnnotationsVisible: !this.state.isAnnotationsVisible });
    };

    getAnnotationHTMLBody = (annotation) => {
        if (annotation && annotation.body) {
            if (
                Array.isArray(annotation.body) &&
                annotation.body.find((annoBody) => annoBody.type === "HTMLBody") &&
                annotation.body.find((annoBody) => annoBody.type === "HTMLBody")
                    .value !== ""
            ) {
                return (
                    <div
                        className={
                            this.state.toolsbarOnFs
                                ? "adno-osd-anno-fullscreen-tb-opened"
                                : "adno-osd-anno-fullscreen"
                        }
                    >
                        {ReactHtmlParser(
                            annotation.body.find((annoBody) => annoBody.type === "HTMLBody")
                                .value
                        )}
                    </div>
                );
            }
        }
    };

    toggleFullScreen = () => {
        // turn on full screen
        if (document.fullscreenEnabled) {
            if (!this.state.fullScreenEnabled) {
                if (document.getElementById("adno-embed")) {
                    document.getElementById("adno-embed").requestFullscreen();
                    this.setState({ fullScreenEnabled: true });
                } else {
                    alert("Unable to turn on FullScreen");
                }
            } else {
                document.exitFullscreen();
                this.setState({ fullScreenEnabled: false });
            }
        } else {
            alert("Fullscreen disabled");
        }
    };
    keyPressedEvents = (event) => {
        switch (event.code) {
            case "ArrowRight":
                this.nextAnno();
                break;
            case "ArrowLeft":
                this.previousAnno();
                break;
            case "KeyP":
                this.startTimer();
                break;
            case "KeyE":
                this.toggleFullScreen();
                break;
            case "KeyS":
                this.toggleAnnotationsLayer();
                break;
            case "KeyT":
                this.setState({ showToolbar: !this.state.showToolbar });
                break;
            default:
                break;
        }
    };

    updateFullScreenEvent = (event) => {
        // turn off fullscreen
        if (document.fullscreenEnabled && !document.fullscreenElement) {
            this.setState({ fullScreenEnabled: false });
        }
    };

    componentWillUnmount() {
        removeEventListener("keydown", this.keyPressedEvents);
        removeEventListener("fullscreenchange", this.updateFullScreenEvent);
    }

    previousAnno = () => {
        let localCurrentID = this.state.currentID;

        if (this.state.annos.length > 0) {
            if (this.state.currentID === -1 || this.state.currentID === 0) {
                localCurrentID = this.state.annos.length - 1;
            } else {
                localCurrentID = this.state.currentID - 1;
            }

            this.setState({ currentID: localCurrentID });

            this.changeAnno(this.state.annos[localCurrentID]);
        }
    };

    nextAnno = () => {
        let localCurrentID = this.state.currentID;

        if (this.state.annos.length > 0) {
            if (
                this.state.currentID === -1 ||
                this.state.currentID === this.state.annos.length - 1
            ) {
                localCurrentID = 0;
            } else {
                localCurrentID++;
            }

            this.setState({ currentID: localCurrentID });

            this.changeAnno(this.state.annos[localCurrentID]);
        }
    };

    startTimer = () => {
        // Do not start the timer if there is no content to display
        if (this.state.annos.length > 0) {
            // Check if the timer is already started, clear the auto scroll between annotations
            if (this.state.timer) {
                this.setState({ timer: false });

                clearInterval(this.state.intervalID);
            } else {
                if (this.state.startbyfirstanno) {
                    this.setState({ currentID: -1 });

                    this.changeAnno(this.state.annos[0]);
                } else {
                    this.automateLoading();
                }
                // Call the function to go to the next annotation every "delay" seconds
                let interID = setInterval(
                    this.automateLoading,
                    this.state.delay * 1000
                );
                this.setState({ timer: true, intervalID: interID });
            }
        }
    };
    automateLoading = () => {
        let localCurrentID = this.state.currentID;

        if (this.state.currentID === -1) {
            localCurrentID = 0;
        } else if (this.state.currentID === this.state.annos.length - 1) {
            localCurrentID = 0;
        } else {
            localCurrentID++;
        }

        this.setState({ currentID: localCurrentID });

        this.changeAnno(this.state.annos[localCurrentID]);
    };

    changeAnno = (annotation) => {
        this.setState({ selectedAnno: annotation });
        if (this.state.isAnnotationsVisible) {
            this.AdnoAnnotorious.selectAnnotation(annotation.id);
            this.AdnoAnnotorious.fitBounds(annotation.id);
        } else {
            if (annotation.target && annotation.target.selector.value) {
                var imgWithTiles = this.openSeadragon.world.getItemAt(0);
                if (annotation.target.selector.value.includes("xywh=pixel:")) {
                    var xywh = annotation.target.selector.value
                        .replace("xywh=pixel:", "")
                        .split(",");
                } else if (annotation.target.selector.value.includes("polygon")) {
                    // Extract the xywh values from svg polygon element with points="" in annotation.target.selector.value
                    var pointsArray = annotation.target.selector.value
                        .split("points=")[1]
                        .split(" ");
                    // Initialize min and max values
                    let minX = Infinity,
                        minY = Infinity,
                        maxX = -Infinity,
                        maxY = -Infinity;

                    // Iterate through each point
                    pointsArray.forEach((point) => {
                        // Split each pair into x and y
                        const [x, y] = point.split(",").map(Number);

                        // Update min and max values
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    });

                    // Calculate width and height
                    const width = maxX - minX;
                    const height = maxY - minY;

                    var xywh = [minX, minY, width, height];
                } else if (annotation.target.selector.value.includes("ellipse")) {
                    // Create a DOM parser to parse the SVG string
                    const parser = new DOMParser();
                    const svgDoc = parser.parseFromString(
                        annotation.target.selector.value,
                        "image/svg+xml"
                    );
                    const ellipse = svgDoc.querySelector("ellipse");

                    // Extract the attributes from the ellipse element
                    const cx = parseFloat(ellipse.getAttribute("cx"));
                    const cy = parseFloat(ellipse.getAttribute("cy"));
                    const rx = parseFloat(ellipse.getAttribute("rx"));
                    const ry = parseFloat(ellipse.getAttribute("ry"));

                    // Calculate the bounding rectangle
                    const x = cx - rx;
                    const y = cy - ry;
                    const width = 2 * rx;
                    const height = 2 * ry;

                    var xywh = [x, y, width, height];
                }

                var rect = new OpenSeadragon.Rect(
                    parseFloat(xywh[0]),
                    parseFloat(xywh[1]),
                    parseFloat(xywh[2]),
                    parseFloat(xywh[3])
                );
                var imgRect = imgWithTiles.imageToViewportRectangle(rect);
                this.openSeadragon.viewport.fitBounds(imgRect);
            }
        }

        let annotationIndex = this.state.annos.findIndex(
            (anno) => anno.id === annotation.id
        );

        this.setState({ currentID: annotationIndex });
    };

    getAdnoProject = (url) => {
        const IPFS_GATEWAY = process.env.IPFS_GATEWAY;

        const regexCID = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58,})$/;

        const GRANTED_IMG_EXTENSIONS =
            process.env.GRANTED_IMG_EXTENSIONS.split(",");

        const isIpfsUrl = url.match(regexCID) || url.startsWith(IPFS_GATEWAY);
        if (isIpfsUrl && !url.startsWith(IPFS_GATEWAY)) url = IPFS_GATEWAY + url;


        console.log(url)

        // We check if the url contains an image
        if (GRANTED_IMG_EXTENSIONS.includes(get_url_extension(url)) || isIpfsUrl) {
            fetch(url)
                .then((res) => {
                    if (res.status == 200 || res.status == 201) {
                        this.overrideSettings();

                        const tileSources = {
                            type: "image",
                            url,
                        };

                        this.setState({ isLoaded: true });

                        this.displayViewer(tileSources, []);
                    } else {
                        this.setState({ isLoaded: true });
                        throw new Error(this.props.t("errors.unable_access_file"));
                    }
                })
                .catch((err) => {
                    Swal.fire({
                        title: err.message,
                        showCancelButton: false,
                        showConfirmButton: false,
                        icon: "warning",
                    });
                });
        } else {
            // If we don't have a picture

            fetch(url)
                .then((res) => {
                    if (res.status == 200 || res.status == 201) {
                        return res.text();
                    } else {
                        throw new Error(this.props.t("errors.unable_access_file"));
                    }
                })
                .then((rawManifest) => {
                    try {
                        const imported_project = JSON.parse(rawManifest);

                        console.log(imported_project)

                        // ADNO project detected

                        if (
                            imported_project.hasOwnProperty("format") &&
                            imported_project.format === "Adno"
                        ) {
                            if (
                                imported_project.hasOwnProperty("@context") &&
                                imported_project.hasOwnProperty("date") &&
                                imported_project.hasOwnProperty("id") &&
                                (imported_project.hasOwnProperty("title") ||
                                    imported_project.hasOwnProperty("label")) &&
                                imported_project.hasOwnProperty("type") &&
                                imported_project.hasOwnProperty("modified") &&
                                imported_project.hasOwnProperty("source") &&
                                imported_project.hasOwnProperty("total")
                            ) {
                                // if the project has imported settings, override current settings
                                if (imported_project.hasOwnProperty("adno_settings")) {
                                    this.setState({ ...imported_project.adno_settings });

                                    this.overrideSettings();
                                }

                                this.setState({ isLoaded: true })

                                const selectedTags = imported_project.adno_settings.tags || [];

                                let annos = [...imported_project.first.items];

                                if (selectedTags.length > 0)
                                    annos = annos
                                        .map(annotation => ({
                                            ...annotation,
                                            tags: buildTagsList(annotation).map(tag => tag.value)
                                        }))
                                        .filter(annotation => annotation.tags.find(tag => selectedTags.includes(tag)))

                                annos?.forEach((annotation) => {
                                    if (
                                        annotation.body.find(
                                            (annoBody) => annoBody.type === "TextualBody"
                                        ) &&
                                        !annotation.body.find(
                                            (annoBody) => annoBody.type === "HTMLBody"
                                        )
                                    ) {
                                        const newBody = annotation.body;

                                        newBody.push({
                                            type: "HTMLBody",
                                            value: `<p>${annotation.body.filter(
                                                (annobody) => annobody.type === "TextualBody"
                                            )[0].value
                                                }</p>`,
                                            purpose: "commenting",
                                        });

                                        annos.filter((anno) => anno.id === annotation.id)[0].body =
                                            newBody;
                                    }
                                });

                                const GRANTED_IMG_EXTENSIONS =
                                    process.env.GRANTED_IMG_EXTENSIONS.split(",");

                                const tileSources = GRANTED_IMG_EXTENSIONS.includes(
                                    get_url_extension(imported_project.source)
                                )
                                    ? {
                                        type: "image",
                                        url: imported_project.source,
                                    }
                                    : [imported_project.source];

                                this.displayViewer(tileSources, annos);

                                // Add annotations to the state
                                this.setState({ annos });
                            } else {
                                Swal.fire({
                                    title: `projet adno INVALIDE`,
                                    showCancelButton: false,
                                    showConfirmButton: false,
                                    icon: "error",
                                });
                            }
                        } else {
                            // Check if it's a manifest

                            if (
                                (imported_project.hasOwnProperty("id") ||
                                    imported_project.hasOwnProperty("@id")) &&
                                (imported_project.hasOwnProperty("context") ||
                                    imported_project.hasOwnProperty("@context"))
                            ) {
                                this.overrideSettings();

                                if (
                                    imported_project["@type"] &&
                                    imported_project["@type"] === "sc:Manifest"
                                ) {
                                    // type manifest

                                    if (
                                        imported_project.sequences[0].canvases &&
                                        imported_project.sequences[0].canvases.length > 0
                                    ) {
                                        var resultLink =
                                            imported_project.sequences[0].canvases[0].images[0]
                                                .resource.service["@id"] + "/info.json";
                                    } else if (imported_project.logo["@id"]) {
                                        var resultLink =
                                            imported_project.logo["@id"].split("/")[0] + "//";

                                        for (
                                            let index = 1;
                                            index <
                                            imported_project.logo["@id"].split("/").length - 4;
                                            index++
                                        ) {
                                            resultLink +=
                                                imported_project.logo["@id"].split("/")[index] + "/";
                                        }

                                        resultLink += "/info.json";
                                    } else {
                                        Swal.fire({
                                            title: this.props.t("errors.unable_reading_manifest"),
                                            showCancelButton: true,
                                            showConfirmButton: false,
                                            cancelButtonText: "OK",
                                            icon: "warning",
                                        });
                                    }
                                } else {
                                    resultLink = url;
                                }

                                if (resultLink) {
                                    var annos = [];

                                    const GRANTED_IMG_EXTENSIONS =
                                        process.env.GRANTED_IMG_EXTENSIONS.split(",");

                                    const tileSources = GRANTED_IMG_EXTENSIONS.includes(
                                        get_url_extension(resultLink)
                                    )
                                        ? {
                                            type: "image",
                                            url: resultLink,
                                        }
                                        : [resultLink];

                                    this.setState({ isLoaded: true });

                                    // Add annotations to the state
                                    this.setState({ annos });
                                    this.displayViewer(tileSources, annos);
                                }
                            } else {
                                console.log("projet non adno INVALIDE");
                            }
                        }
                    } catch (error) {
                        console.error(error.message);
                        Swal.fire({
                            title: `Impossible de parser le json`,
                            showCancelButton: false,
                            showConfirmButton: false,
                            icon: "warning",
                        });
                    }
                })
                .catch(err => {
                    console.log(err)
                    Swal.fire({
                        title: this.props.t("errors.wrong_url"),
                        showCancelButton: false,
                        showConfirmButton: false,
                        icon: "warning",
                    });
                });
        }
    };

    render() {
        if (this.state.isLoaded) {
            return (
                <div id="adno-embed">

                    {
                        this.state.selectedAnno && this.state.selectedAnno.body &&
                        this.getAnnotationHTMLBody(this.state.selectedAnno)
                    }

                    <div className={this.state.showToolbar ? "toolbar-on" : "toolbar-off"}>
                        <div className={"osd-buttons-bar"}>

                            {
                                this.state.annos.length > 0 &&
                                <button id="play-button" className="toolbarButton toolbaractive" onClick={() => this.startTimer()}>
                                    <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t(`visualizer.${this.state.timer ? 'pause' : 'play'}`)}>
                                        <FontAwesomeIcon icon={this.state.timer ? faPause : faPlay} size="lg" />
                                    </div>
                                </button>
                            }

                            <button id="home-button" className="toolbarButton toolbaractive">
                                <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('visualizer.reset_zoom')}>
                                    <FontAwesomeIcon icon={faMagnifyingGlassMinus} size="lg" />
                                </div>
                            </button>

                            {
                                this.state.annos.length > 0 &&
                                <>
                                    <button id="set-visible" className="toolbarButton toolbaractive" onClick={() => this.toggleAnnotationsLayer()}>
                                        <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('visualizer.toggle_annotations')}>
                                            <FontAwesomeIcon icon={this.state.isAnnotationsVisible ? faEyeSlash : faEye} size="lg" />
                                        </div>
                                    </button>

                                    <button id="previousAnno" className="toolbarButton toolbaractive" onClick={() => this.previousAnno()}>
                                        <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('visualizer.previous_annotation')}>
                                            <FontAwesomeIcon icon={faArrowLeft} size="lg" />
                                        </div>
                                    </button>
                                    <button id="nextAnno" className="toolbarButton toolbaractive" onClick={() => this.nextAnno()}>
                                        <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('visualizer.next_annotation')}>
                                            <FontAwesomeIcon icon={faArrowRight} size="lg" />
                                        </div>
                                    </button>
                                </>
                            }

                            {
                                this.state.rotation &&
                                <button id="rotate"
                                    className="toolbarButton toolbaractive"
                                    onClick={() => this.openSeadragon.viewport.setRotation(this.openSeadragon.viewport.degrees + 90)}>
                                    <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('visualizer.rotation')}>
                                        <FontAwesomeIcon icon={faRotateRight} size="lg" />
                                    </div>
                                </button>
                            }

                            <button id="toggle-fullscreen" className="toolbarButton toolbaractive" onClick={() => this.toggleFullScreen()}>
                                <div className="tooltip tooltip-bottom z-50" data-tip={this.props.t('visualizer.expand')}>
                                    <FontAwesomeIcon icon={faExpand} size="lg" />
                                </div>
                            </button>
			    <button id="help" className="toolbarButton toolbaractive" >
			        <label htmlFor="help-modal" className="tooltip tooltip-bottom z-50" data-tip={this.props.t('visualizer.help')}>
                                    <FontAwesomeIcon icon={faQuestion} size="lg" />
                                </label>
                            </button>

			    <input type="checkbox" id="help-modal" className="modal-toggle" />
			    <div className="modal">
			         <div className="modal-box" style={{ "color": "initial" }}>
                                    <div className="modal-action mt-0 justify-end">
                                        <button className="btn btn-square btn-sm">
                                            <label htmlFor="help-modal">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </label>
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-lg py-4">{this.props.t('visualizer.help_title')}</h3>
                                    <p className="py-4">{this.props.t('visualizer.help_key_plural')} <code>P</code> {this.props.t('visualizer.help_or')} <code>p</code> {this.props.t('visualizer.help_key_p')}</p>
                                    <p className="py-4">{this.props.t('visualizer.help_key_plural')} <code>E</code> {this.props.t('visualizer.help_or')} <code>e</code> {this.props.t('visualizer.help_key_e')}</p>
                                    <p className="py-4">{this.props.t('visualizer.help_key')} <code>esc</code> {this.props.t('visualizer.help_key_escape')}</p>
                                    <p className="py-4">{this.props.t('visualizer.help_key_plural')} <code>S</code> {this.props.t('visualizer.help_or')} <code>s</code>{this.props.t('visualizer.help_key_s')}</p>
                                    <p className="py-4">{this.props.t('visualizer.help_key_plural')} <code>T</code>{this.props.t('visualizer.help_or')} <code>t</code> {this.props.t('visualizer.help_key_t')}</p>
                                    <p className="py-4">{this.props.t('visualizer.help_key_plural')} <code>←</code> {this.props.t('visualizer.help_and')} <code>→</code> {this.props.t('visualizer.help_key_arrows')}</p>
                                    <p className="py-4">{this.props.t('visualizer.help_doc')} <a className="adno-link" href="https://adno.app/" target="_blank">{this.props.t('visualizer.help_doc_link')}</a></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        } else {
            return null;
        }

    }
}

export default withTranslation()(withRouter(AdnoEmbed));
