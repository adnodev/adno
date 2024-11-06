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
        const query = new URLSearchParams(this.props.location.search);

        let manifestURL = query.get("url")
        // if (manifestURL) {
        //     const rawURLParam = this.props.location.search
        //         .split("?")
        //         .slice(1)
        //         .find(query => query.startsWith("url="));

        //     manifestURL = rawURLParam.replace("url=", "")
        // }

        if (manifestURL) {
            manageUrls(this.props, manifestURL, this.props.t)
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