import { Component } from "react";
import { withRouter } from "react-router";

// Add translations
import { withTranslation } from "react-i18next";

import { manageUrls } from "./manageUrls";
import { toast } from "../Toast/store"

class AdnoUrls extends Component {

    componentDidMount() {
        const query = new URLSearchParams(this.props.location.search);

        let manifestURL = query.get("url")

        if (manifestURL) {
            manageUrls(this.props, manifestURL, this.props.t)
        } else {
            toast.error(this.props.t('errors.no_url'))
            this.props.history.push("/")
        }

    }
    render() {
        return (<></>)
    }
}
export default withTranslation()(withRouter(AdnoUrls));