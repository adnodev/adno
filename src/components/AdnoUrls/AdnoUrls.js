import { Component } from "react";
import { withRouter } from "react-router";

// Add translations
import { withTranslation } from "react-i18next";

// Import SweetAlert
import Swal from "sweetalert2";

// Import Components
import { manageUrls } from "./manageUrls";

class AdnoUrls extends Component {

    componentDidMount() {
        let url = (new URLSearchParams(this.props.location.search))
        let manifest_url = url.get("url")

        if (manifest_url) {
            manageUrls(this.props, manifest_url, this.props.t)
        } else {
            Swal.fire({
                title: this.props.t('errors.no_url'),
                showCancelButton: false,
                confirmButtonText: this.props.t('navbar.back_home'),
                icon: 'warning',
            }).then((result) => {
                if (result.isConfirmed) {
                    this.props.history.push("/")
                }
            })
        }


    }
    render() {
        return (<></>)
    }
}
export default withTranslation()(withRouter(AdnoUrls));