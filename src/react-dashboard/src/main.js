import React from "react";
import { Switch, Route } from "react-router-dom";
import Typography from "@material-ui/core/Typography";
import { Login, PrivateRoute } from "./auth";
import Home from "./home";
import { WorkflowList, Workflow, SubmitWorkflow } from "./workflows";

const Main = () => (
    <React.Fragment>
        {/* A <Switch> looks through its children <Route>s and
          renders the first one that matches the current URL. */}
        <Switch>
            <Route exact path="/login">
                <Login />
            </Route>
            <PrivateRoute
                path="/workflows/version/:uuid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"
                render={props => <Workflow {...props} />}
            />
            <PrivateRoute path="/workflows/version/query">
                <WorkflowList />
            </PrivateRoute>
            <Route path="/workflows/version">
                <Typography
                    component="h2"
                    variant="h6"
                    color="primary"
                    gutterBottom
                >
                    Submit a Workflow (Construction in progress)
                </Typography>
                <SubmitWorkflow />
            </Route>
            <PrivateRoute path="/">
                <Home />
            </PrivateRoute>
        </Switch>
    </React.Fragment>
);

export default Main;
