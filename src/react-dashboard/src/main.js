import React from "react";
import { Switch, Route } from "react-router-dom";
import Typography from "@material-ui/core/Typography";
import { Login, PrivateRoute, useAuth0 } from "./auth";
import Home from "./home";
import { WorkflowList, Workflow } from "./workflows";

const Main = () => {
    const { apiVersion } = useAuth0();

    return (
        <React.Fragment>
            {/* A <Switch> looks through its children <Route>s and
          renders the first one that matches the current URL. */}
            <Switch>
                <Route exact path="/login">
                    <Login />
                </Route>
                <PrivateRoute
                    path={`/workflows/${apiVersion}/:uuid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})`}
                    render={props => (
                        <Workflow {...props} />
                    )}
                />
                <PrivateRoute path={`/workflows/${apiVersion}/query`}>
                    <WorkflowList />
                </PrivateRoute>
                <Route path={`/workflows/${apiVersion}`}>
                    <Typography
                        component="h2"
                        variant="h6"
                        color="primary"
                        gutterBottom
                    >
                        Under construction
                    </Typography>
                </Route>
                <PrivateRoute path="/">
                    <Home />
                </PrivateRoute>
            </Switch>
        </React.Fragment>
    );
};

export default Main;
