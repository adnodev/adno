import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import '../langs/i18n_conf'; // Add internationalization support

const app = document.getElementById("app");
ReactDOM.render(<App />, app);