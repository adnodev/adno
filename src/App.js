import React, { Component } from "react";
import {
    HashRouter, Route, Switch
} from "react-router-dom";

// Import utils
import history from "./Utils/history";
import { insertInLS } from "./Utils/utils";

// Import React components
import AdnoUrls from "./components/AdnoUrls/AdnoUrls";
import HomeWithProjects from "./components/HomeWithProjects/HomeWithProjects";
import NewProject from "./components/NewProject/NewProject";
import NotFound from "./components/NotFound/NotFound";
import Project from "./components/Project/Project";

// Import css
import "./index.css"

export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isProjects: false
        }
    }

    componentDidMount() {
        // When the app load, check if it already exists some projects
        // If not then create the key "adno_projects" with empty array as value
        if (!localStorage.getItem("adno_projects")) {
            insertInLS("adno_projects", JSON.stringify([]))
        }
    }

    loadMatomo = () => {
        if (process.env.MATOMO_SITE_ID && process.env.MATOMO_URL) {

            var scriptTag = document.createElement("script")
            scriptTag.innerHTML =
                `
            var _paq = window._paq = window._paq || [];
            _paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            (function () {
                var u = '${process.env.MATOMO_URL}'
                _paq.push(['setTrackerUrl', u + 'matomo.php'])
                _paq.push(['setSiteId', '${process.env.MATOMO_SITE_ID}'])
                var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
                g.async = true; 
                g.src = u + 'matomo.js';
                s.parentNode.insertBefore(g, s)
            })()
            `
            document.body.appendChild(scriptTag)
        }
    }

    render() {
        return (
            <HashRouter history={history}>
                <Switch>
                    {this.loadMatomo()}
                    <Route exact path="/new">
                        <NewProject />
                    </Route>

                    {
                        process.env.ADNO_MODE === "FULL" &&
                        <Route exact path="/project/:id/edit">
                            <Project editMode={true} />
                        </Route>
                    }

                    <Route exact path="/project/:id/view">
                        <Project editMode={false} />
                    </Route>

                    <Route exact path="/search">
                        <AdnoUrls />
                    </Route>

                    <Route exact path="/">
                        <HomeWithProjects />
                    </Route>

                    <Route>
                        <NotFound />
                    </Route>

                </Switch>
            </HashRouter>
        );
    }

}
