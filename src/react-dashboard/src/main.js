import React from 'react';
import {
  Switch,
  Route,
} from 'react-router-dom';
import Typography from '@material-ui/core/Typography';
import Home from './home';
import { WorkflowList, Workflow } from './workflows';

export default function Main(props) {
  const { apiVersion } = props;

  return (
    <React.Fragment>
      {/* A <Switch> looks through its children <Route>s and
          renders the first one that matches the current URL. */}
      <Switch>
        <Route
          path={`/workflows/${apiVersion}/:uuid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})`}
          render={(props) => <Workflow apiVersion={apiVersion} {...props} />}
        />
        <Route path={`/workflows/${apiVersion}/query`}>
          <WorkflowList apiVersion={apiVersion}/>
        </Route>
        <Route path={`/workflows/${apiVersion}`}>
          <Typography component='h2' variant='h6' color='primary' gutterBottom>
            Under construction
          </Typography>
        </Route>
        <Route path='/'>
          <Home apiVersion={apiVersion}/>
        </Route>
      </Switch>
    </React.Fragment>
  );
}
