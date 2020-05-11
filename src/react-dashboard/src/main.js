import { Route, Switch } from 'react-router-dom';
import { SubmitWorkflow, Workflow, WorkflowTable } from './workflows';
import ApiDoc from './swagger';
import Home from './home';
import React from 'react';
import WomTool from './womtool';

const Main = () => (
    <React.Fragment>
        {/* A <Switch> looks through its children <Route>s and
          renders the first one that matches the current URL. */}
        <Switch>
            <Route
                path="/workflows/version/:uuid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"
                exact
                render={(props) => <Workflow {...props} />}
            />
            <Route path="/workflows/version/query" exact>
                <WorkflowTable />
            </Route>
            <Route path="/workflows/version" exact>
                <SubmitWorkflow />
            </Route>
            <Route path="/womtool/version/describe" exact>
                <WomTool />
            </Route>
            <Route path="/swagger" exact>
                <ApiDoc />
            </Route>
            <Route path="/" exact>
                <Home />
            </Route>
        </Switch>
    </React.Fragment>
);

export default Main;
