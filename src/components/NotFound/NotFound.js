import React, { Component } from 'react';
import { Link } from 'react-router-dom';

// Import CSS
import "./NotFound.css"

class NotFound extends Component {
    render() {
        return (
            <div className="not-found">
                <h1>Page introuvable !</h1>
                <Link to="/">Revenir à l'accueil</Link>
            </div>
        )
    }
}

export default NotFound;