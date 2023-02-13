import { Component } from "react";
import { withRouter } from "react-router";
import Swal from "sweetalert2";
import { manageUrls } from "./manageUrls";

class AdnoUrls extends Component {

    componentDidMount() {
        let url = (new URLSearchParams(this.props.location.search))
        let manifest_url = url.get("url")

        if (manifest_url) {

            manageUrls(this.props, manifest_url)
        } else {
            Swal.fire({
                title: "Aucune URL n'a été fournie",
                showCancelButton: false,
                confirmButtonText: "Retourner à l'accueil",
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
export default withRouter(AdnoUrls)