import React, { useState, useEffect, useContext, useRef } from "react";
import PropTypes from "prop-types";
import createAuth0Client from "@auth0/auth0-spa-js";
import config from "./dashboard_config.json";
import history from "./history";
import { Route, Redirect } from "react-router-dom";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Box from "@material-ui/core/Box";
import Avatar from "@material-ui/core/Avatar";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";

const INIT_OPTION = {
    domain: config.AUTH0_DOMAIN,
    client_id: config.CLIENT_ID,
    redirect_uri: window.location.origin,
    audience: config.API_AUDIENCE,
    scope: config.API_SCOPE
};

const Auth0Context = React.createContext();
export const useAuth0 = () => useContext(Auth0Context);
export const Auth0Provider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState();
    const [user, setUser] = useState();
    const [auth0Client, setAuth0] = useState();
    const [loading, setLoading] = useState(true);
    const [popupOpen, setPopupOpen] = useState(false);

    useEffect(() => {
        const initAuth0 = async () => {
            const auth0FromHook = await createAuth0Client(INIT_OPTION);
            setAuth0(auth0FromHook);

            if (
                window.location.search.includes("code=") &&
                window.location.search.includes("state=")
            ) {
                const {
                    appState
                } = await auth0FromHook.handleRedirectCallback();
                history.push(
                    appState && appState.targetUrl
                        ? appState.targetUrl
                        : window.location.pathname
                );
            }

            const isAuthenticated = await auth0FromHook.isAuthenticated();

            setIsAuthenticated(isAuthenticated);

            if (isAuthenticated) {
                const user = await auth0FromHook.getUser();
                setUser(user);
            }

            setLoading(false);
        };
        initAuth0();
    }, []);

    const loginWithPopup = async (params = {}) => {
        setPopupOpen(true);
        try {
            await auth0Client.loginWithPopup(params);
        } catch (error) {
            console.error(error);
        } finally {
            setPopupOpen(false);
        }
        const user = await auth0Client.getUser();
        setUser(user);
        setIsAuthenticated(true);
    };

    const handleRedirectCallback = async () => {
        setLoading(true);
        await auth0Client.handleRedirectCallback();
        const user = await auth0Client.getUser();
        setLoading(false);
        setIsAuthenticated(true);
        setUser(user);
    };

    // In case a consent is required, pop up is necessary.
    const getToken = (...p) =>
        auth0Client
            .getTokenSilently(...p)
            .then(res => res, () => auth0Client.getTokenWithPopup(...p));

    const authorizedFetch = async (resource, init = {}) => {
        const token = await getToken();
        init.headers = { Authorization: `Bearer ${token}` };

        return fetch(resource, init);
    };
    return (
        <Auth0Context.Provider
            value={{
                isAuthenticated,
                user,
                loading,
                popupOpen,
                loginWithPopup,
                handleRedirectCallback,
                authorizedFetch,
                getToken,
                getIdTokenClaims: (...p) => auth0Client.getIdTokenClaims(...p),
                loginWithRedirect: (...p) =>
                    auth0Client.loginWithRedirect(...p),
                logout: (...p) => auth0Client.logout(...p)
            }}
        >
            {children}
        </Auth0Context.Provider>
    );
};
Auth0Provider.propTypes = {
    children: PropTypes.element.isRequired
};

// A wrapper for <Route> that redirects to the login screen
// if you're not yet authenticated.
export const PrivateRoute = ({ children, component, render, ...rest }) => {
    const { isAuthenticated } = useAuth0();

    // Need to mimic how Route handling different render methods
    // https://github.com/ReactTraining/react-router/blob/master/packages/react-router/modules/Route.js
    // Preact uses an empty array as children by
    // default, so use null if that's the case.
    if (Array.isArray(children) && children.length === 0) {
        children = null;
    }

    return (
        <React.Fragment>
            {!isAuthenticated ? (
                <Route
                    {...rest}
                    render={({ location }) => (
                        <Redirect
                            to={{
                                pathname: "/login",
                                state: { from: location }
                            }}
                        />
                    )}
                />
            ) : children ? (
                typeof children === "function" ? (
                    <Route {...rest} children={children} /> // eslint-disable-line react/no-children-prop
                ) : (
                    <Route {...rest}>{children}</Route>
                )
            ) : component ? (
                <Route {...rest} component={component} />
            ) : render ? (
                <Route {...rest} render={render} />
            ) : null}
        </React.Fragment>
    );
};
PrivateRoute.propTypes = {
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    component: PropTypes.elementType,
    render: PropTypes.func
};

export const Login = () => {
    const { loginWithRedirect } = useAuth0();

    return (
        <Button
            variant="contained"
            color="primary"
            onClick={() => loginWithRedirect({})}
        >
            Log In
        </Button>
    );
};

const useStyles = makeStyles(theme => ({
    paper: {
        padding: theme.spacing(2),
        display: "flex",
        overflow: "auto",
        flexDirection: "column"
    },
    fixedHeight: {
        height: 240
    },
    tokenArea: {
        "word-break": "break-all"
    }
}));

export const UserTile = () => {
    const { loading, user } = useAuth0();
    const classes = useStyles();
    const fixedHeightPaper = clsx(classes.paper, classes.fixedHeight);

    return (
        <React.Fragment>
            {!loading && user ? (
                <Grid item xs={12} md={4} lg={3}>
                    <Paper className={fixedHeightPaper}>
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Avatar src={user.picture} />
                        </Box>
                        <List dense>
                            {user.name !== user.email ? (
                                <ListItem>
                                    <ListItemText>
                                        <strong>Name</strong>
                                        {`: ${user.name}`}
                                    </ListItemText>
                                </ListItem>
                            ) : null}
                            <ListItem>
                                <ListItemText>
                                    <strong>Email</strong>
                                    {`: ${user.email}`}
                                </ListItemText>
                            </ListItem>
                            <ListItem>
                                <Box m="auto">
                                    <GetApiToken />
                                </Box>
                            </ListItem>
                        </List>
                    </Paper>
                </Grid>
            ) : null}
        </React.Fragment>
    );
};

const GetApiToken = () => {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);
    const [apiToken, setApiToken] = useState();
    const { getToken } = useAuth0();

    const handleClickOpen = () => {
        getToken().then(res => setApiToken(res), err => console.error(err));
        setOpen(true);
    };
    const tokenRef = useRef(null);
    const handleCopyClose = () => {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(tokenRef.current);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand("copy");
        setOpen(false);
    };
    const handleClose = () => {
        setOpen(false);
    };

    return (
        <React.Fragment>
            <Button
                variant="outlined"
                color="primary"
                onClick={handleClickOpen}
            >
                Get API Token
            </Button>
            <Dialog
                onClose={handleClose}
                aria-labelledby="token-dialog-title"
                open={open}
            >
                <DialogTitle id="token-dialog-title" onClose={handleClose}>
                    API Bearer Token
                </DialogTitle>
                <DialogContent dividers>
                    {apiToken ? (
                        <Typography
                            className={classes.tokenArea}
                            ref={tokenRef}
                        >
                            {apiToken}
                        </Typography>
                    ) : (
                        <Typography>Requesting token from auth0 ...</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    {apiToken ? (
                        <Button
                            autoFocus
                            onClick={handleCopyClose}
                            color="primary"
                        >
                            Copy and Close
                        </Button>
                    ) : null}
                    <Button autoFocus onClick={handleClose} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
};
