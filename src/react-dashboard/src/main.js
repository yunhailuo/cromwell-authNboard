import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { LogInOut, PrivateRoute } from './auth';
import Home from './home';
import { WorkflowTable, Workflow, SubmitWorkflow } from './workflows';
import WomTool from './womtool';
import ApiDoc from './swagger';

const Main = () => (
    <React.Fragment>
        {/* A <Switch> looks through its children <Route>s and
          renders the first one that matches the current URL. */}
        <Switch>
            <Route exact path="/login">
                <LogInOut />
            </Route>
            <PrivateRoute
                path="/workflows/version/:uuid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"
                exact
                render={(props) => <Workflow {...props} />}
            />
            <PrivateRoute path="/workflows/version/query" exact>
                <WorkflowTable />
            </PrivateRoute>
            <Route path="/workflows/version" exact>
                <SubmitWorkflow />
            </Route>
            <PrivateRoute path="/womtool/version/describe" exact>
                <WomTool />
            </PrivateRoute>
            <PrivateRoute path="/swagger" exact>
                <ApiDoc />
            </PrivateRoute>
            <PrivateRoute path="/" exact>
                <Home />
            </PrivateRoute>
        </Switch>
    </React.Fragment>
);

export default Main;
