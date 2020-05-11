import './App.css';
import { LogInOut, useAuth0 } from './auth';
import React, { useContext, useEffect, useState } from 'react';
import AppBar from '@material-ui/core/AppBar';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import CircularProgress from '@material-ui/core/CircularProgress';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import DashboardIcon from '@material-ui/icons/Dashboard';
import DescriptionIcon from '@material-ui/icons/Description';
import Drawer from '@material-ui/core/Drawer';
import FindInPageIcon from '@material-ui/icons/FindInPage';
import IconButton from '@material-ui/core/IconButton';
import { Link } from 'react-router-dom';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Main from './main';
import MenuIcon from '@material-ui/icons/Menu';
import PropTypes from 'prop-types';
import PublishIcon from '@material-ui/icons/Publish';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import ViewListIcon from '@material-ui/icons/ViewList';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
    },
    toolbar: {
        paddingRight: 24, // keep right padding when drawer closed
    },
    toolbarIcon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 8px',
        ...theme.mixins.toolbar,
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    menuButton: {
        marginRight: 36,
    },
    title: {
        flexGrow: 1,
    },
    drawerPaper: {
        position: 'relative',
        whiteSpace: 'nowrap',
        width: drawerWidth,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    drawerPaperClose: {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
            width: theme.spacing(9),
        },
    },
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        height: '100vh',
        overflow: 'auto',
    },
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
    },
}));

const AppContext = React.createContext({ apiVersion: 'v1' });
export const useApp = () => useContext(AppContext);

export const App = () => {
    const { loading, isAuthenticated, authorizedFetch } = useAuth0();
    const classes = useStyles();

    const [open, setOpen] = useState(false);
    const handleDrawerOpen = () => {
        setOpen(true);
    };
    const handleDrawerClose = () => {
        setOpen(false);
    };

    const [apiVersion, setApiVersion] = useState('v1');
    useEffect(() => {
        if (isAuthenticated) {
            authorizedFetch('/engine/v1/version')
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(res.statusText);
                    }
                    return res.json();
                })
                .then((version) => setApiVersion(`v${version.cromwell || '1'}`))
                .catch((err) => console.error(err));
        }
    }, [isAuthenticated, authorizedFetch]);

    const [appBarTitle, setAppBarTitle] = useState('Cromwell Dashboard');

    return loading ? (
        <CircularProgress />
    ) : (
        <AppContext.Provider value={{ apiVersion, setAppBarTitle }}>
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
                            {appBarTitle}
                        </Typography>
                        <LogInOut />
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
        </AppContext.Provider>
    );
};

const SideBar = ({ open = false }) => {
    const classes = useStyles();

    return (
        <Drawer
            variant="permanent"
            classes={{
                paper: clsx(
                    classes.drawerPaper,
                    !open && classes.drawerPaperClose,
                ),
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
                <ListItem button component={Link} to="/workflows/version/query">
                    <ListItemIcon>
                        <ViewListIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary="View workflows"
                        primaryTypographyProps={{ noWrap: true }}
                    />
                </ListItem>
                <ListItem button component={Link} to="/workflows/version">
                    <ListItemIcon>
                        <PublishIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary="Submit a workflow"
                        primaryTypographyProps={{ noWrap: true }}
                    />
                </ListItem>

                <ListItem
                    button
                    component={Link}
                    to="/womtool/version/describe"
                >
                    <ListItemIcon>
                        <FindInPageIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary="WOM tool"
                        primaryTypographyProps={{ noWrap: true }}
                    />
                </ListItem>
                <ListItem button component={Link} to="/swagger">
                    <ListItemIcon>
                        <DescriptionIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary="API documentation"
                        primaryTypographyProps={{ noWrap: true }}
                    />
                </ListItem>
            </List>
        </Drawer>
    );
};
SideBar.propTypes = {
    open: PropTypes.bool.isRequired,
};
