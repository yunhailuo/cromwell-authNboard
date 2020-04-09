import React, { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import createAuth0Client from "@auth0/auth0-spa-js";
import { Route, Redirect } from "react-router-dom";
import Button from "@material-ui/core/Button";

const DEFAULT_REDIRECT_CALLBACK = () =>
    window.history.replaceState({}, document.title, window.location.pathname);

const Auth0Context = React.createContext();
export const useAuth0 = () => useContext(Auth0Context);
export const Auth0Provider = ({
    children,
    onRedirectCallback = DEFAULT_REDIRECT_CALLBACK,
    ...initOptions
}) => {
    const [isAuthenticated, setIsAuthenticated] = useState();
    const [user, setUser] = useState();
    const [auth0Client, setAuth0] = useState();
    const [loading, setLoading] = useState(true);
    const [popupOpen, setPopupOpen] = useState(false);
    const [apiVersion, setApiVersion] = useState("v1");

    useEffect(() => {
        const initAuth0 = async () => {
            const auth0FromHook = await createAuth0Client(initOptions);
            setAuth0(auth0FromHook);

            if (
                window.location.search.includes("code=") &&
                window.location.search.includes("state=")
            ) {
                const {
                    appState
                } = await auth0FromHook.handleRedirectCallback();
                onRedirectCallback(appState);
            }

            const isAuthenticated = await auth0FromHook.isAuthenticated();

            setIsAuthenticated(isAuthenticated);

            if (isAuthenticated) {
                const user = await auth0FromHook.getUser();
                setUser(user);
                const token = await auth0FromHook.getTokenSilently();
                let versionRes = await fetch("/engine/v1/version", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                let version = await versionRes.json();
                setApiVersion(`v${version.cromwell || "1"}`);
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

    const authorizedFetch = async (resource, init = {}) => {
        const token = await auth0Client.getTokenSilently();
        init.headers = { Authorization: `Bearer ${token}` };

        return fetch(resource, init);
    };
    return (
        <Auth0Context.Provider
            value={{
                isAuthenticated,
                user,
                apiVersion,
                loading,
                popupOpen,
                loginWithPopup,
                handleRedirectCallback,
                authorizedFetch,
                getIdTokenClaims: (...p) => auth0Client.getIdTokenClaims(...p),
                loginWithRedirect: (...p) =>
                    auth0Client.loginWithRedirect(...p),
                getTokenSilently: (...p) => auth0Client.getTokenSilently(...p),
                getTokenWithPopup: (...p) =>
                    auth0Client.getTokenWithPopup(...p),
                logout: (...p) => auth0Client.logout(...p)
            }}
        >
            {children}
        </Auth0Context.Provider>
    );
};
Auth0Provider.propTypes = {
    children: PropTypes.element.isRequired,
    onRedirectCallback: PropTypes.func
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
