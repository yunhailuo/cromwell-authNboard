import "./App.css";
import React, { useState } from "react";
import PropTypes from "prop-types";
import { useAuth0 } from "./auth";
import { Link } from "react-router-dom";
import history from "./history";
import Main from "./main";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Drawer from "@material-ui/core/Drawer";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import DashboardIcon from "@material-ui/icons/Dashboard";
import ViewListIcon from "@material-ui/icons/ViewList";
import PublishIcon from "@material-ui/icons/Publish";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Container from "@material-ui/core/Container";
import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
    root: {
        display: "flex"
    },
    toolbar: {
        paddingRight: 24 // keep right padding when drawer closed
    },
    toolbarIcon: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 8px",
        ...theme.mixins.toolbar
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        })
    },
    menuButton: {
        marginRight: 36
    },
    title: {
        flexGrow: 1
    },
    drawerPaper: {
        position: "relative",
        whiteSpace: "nowrap",
        width: drawerWidth,
        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
        })
    },
    drawerPaperClose: {
        overflowX: "hidden",
        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up("sm")]: {
            width: theme.spacing(9)
        }
    },
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        height: "100vh",
        overflow: "auto"
    },
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4)
    }
}));

function App() {
    const { loading, isAuthenticated, loginWithRedirect, logout } = useAuth0();
    const classes = useStyles();
    const [open, setOpen] = useState(false);
    const handleDrawerOpen = () => {
        setOpen(true);
    };
    const handleDrawerClose = () => {
        setOpen(false);
    };

    if (loading) {
        return <div>Loading...</div>;
    }
    return (
        <div className={`App ${classes.root}`}>
            <CssBaseline />
            <AppBar position="absolute" className={classes.appBar}>
                <Toolbar className={classes.toolbar}>
                    {isAuthenticated ? (
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="open drawer"
                            onClick={
                                open ? handleDrawerClose : handleDrawerOpen
                            }
                            className={classes.menuButton}
                        >
                            {open ? <ChevronLeftIcon /> : <MenuIcon />}
                        </IconButton>
                    ) : null}
                    <Typography
                        component="h1"
                        variant="h6"
                        color="inherit"
                        noWrap
                        className={classes.title}
                    >
                        Cromwell Dashboard
                    </Typography>
                    {isAuthenticated ? (
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => {
                                logout({ returnTo: window.location.origin });
                            }}
                        >
                            Log Out
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={() => loginWithRedirect({})}
                        >
                            Log In
                        </Button>
                    )}
                </Toolbar>
            </AppBar>
            <SideBar open={open} />
            <main className={classes.content}>
                <div className={classes.appBarSpacer} />
                <Container maxWidth="lg" className={classes.container}>
                    <Main />
                </Container>
            </main>
        </div>
    );
}

export default App;

const SideBar = ({ open = false }) => {
    const { isAuthenticated, apiVersion } = useAuth0();
    const classes = useStyles();

    if (!isAuthenticated) {
        return <React.Fragment />;
    }
    return (
        <Drawer
            variant="permanent"
            classes={{
                paper: clsx(
                    classes.drawerPaper,
                    !open && classes.drawerPaperClose
                )
            }}
            open={open}
        >
            <List>
                <div className={classes.appBarSpacer} />
                <ListItem button component={Link} to="/">
                    <ListItemIcon>
                        <DashboardIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary="Dashboard"
                        primaryTypographyProps={{ noWrap: true }}
                    />
                </ListItem>
                <ListItem
                    button
                    component={Link}
                    to={`/workflows/${apiVersion}/query`}
                >
                    <ListItemIcon>
                        <ViewListIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary="View workflows"
                        primaryTypographyProps={{ noWrap: true }}
                    />
                </ListItem>
                <ListItem
                    button
                    component={Link}
                    to={`/workflows/${apiVersion}`}
                >
                    <ListItemIcon>
                        <PublishIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary="Submit a workflow"
                        primaryTypographyProps={{ noWrap: true }}
                    />
                </ListItem>
            </List>
        </Drawer>
    );
};
SideBar.propTypes = {
    open: PropTypes.bool.isRequired
};
