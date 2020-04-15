import { createBrowserHistory } from 'history';
import config from './dashboard_config.json';

export default createBrowserHistory({ basename: config.DASHBOARD_BASE });
