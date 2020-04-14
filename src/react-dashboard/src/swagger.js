import React from "react";
import { Auth0Context } from "./auth";
import SwaggerUI from "swagger-ui";
// not declared dependency; swagger-ui uses the following to load YAML spec
import YAML from "js-yaml";
import "swagger-ui/dist/swagger-ui.css";
import Box from "@material-ui/core/Box";

class ApiDoc extends React.Component {
    constructor(props) {
        super(props);
        this.apiDocContainer = React.createRef();
    }

    componentDidMount() {
        const { authorizedFetch } = this.context;
        authorizedFetch("/swagger/cromwell.yaml")
            .then(res => res.text())
            .then(res =>
                SwaggerUI({
                    domNode: this.apiDocContainer.current,
                    spec: YAML.safeLoad(res),
                    deepLinking: true,
                    presets: [SwaggerUI.presets.apis]
                })
            )
            .catch(err => console.log(err));
    }

    render() {
        return (
            <Box
                id="api-swagger-doc"
                textAlign="start"
                ref={this.apiDocContainer}
            />
        );
    }
}
ApiDoc.contextType = Auth0Context;

export default ApiDoc;
