import config from './dashboard_config.json';
import { createBrowserHistory } from 'history';

export default createBrowserHistory({ basename: config.DASHBOARD_BASE });
