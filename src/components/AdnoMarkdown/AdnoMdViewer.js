import { Component } from "react";
import ReactMarkdown from 'react-markdown'

import "./AdnoMarkdown.css";

class AdnoMdViewer extends Component {
    constructor(props) {
        super(props);
        this.state = {

        }
    }

    markdown = `
    👉 Changes are re-rendered as you type.

👈 Try writing some markdown on the left.

## Overview

* Follows [CommonMark](https://commonmark.org)
* Optionally follows [GitHub Flavored Markdown](https://github.github.com/gfm/)
* Renders actual React elements instead of using dangerouslySetInnerHTML
* Lets you define your own components (to render MyHeading instead of h1)
* Has a lot of plugins

## Table of contents
Here is an example of a plugin in action
[An Internal Link](/guides/content/editing-an-existing-page)

This section is replaced by an actual table of contents.
`

    render() {
        return (
            <div className="markdown-body">
                <ReactMarkdown children={this.markdown} />
            </div>
        )
    }
}

export default AdnoMdViewer;