import './index.css';
import * as serviceWorker from './serviceWorker';
import { App } from './App';
import { Auth0Provider } from './auth';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import config from './dashboard_config.json';

ReactDOM.render(
    <React.StrictMode>
        <Auth0Provider>
            <Router basename={config.DASHBOARD_BASE}>
                <App />
            </Router>
        </Auth0Provider>
    </React.StrictMode>,
    document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
