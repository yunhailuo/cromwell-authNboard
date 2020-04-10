import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useAuth0 } from "./auth";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import Avatar from "@material-ui/core/Avatar";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";

const useStyles = makeStyles(theme => ({
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4)
    },
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

const Home = () => {
    const {
        loading,
        user,
        apiVersion,
        authorizedFetch,
        getTokenSilently
    } = useAuth0();

    const classes = useStyles();
    const fixedHeightPaper = clsx(classes.paper, classes.fixedHeight);

    const [engineStatus, setEngineStatus] = useState([]);
    const enginUrl = `/engine/${apiVersion}`;
    useEffect(() => {
        authorizedFetch(enginUrl + "/status", {})
            .then(res => res.statusText)
            .then(res => setEngineStatus(res))
            .catch(err => console.log(err));
    }, [authorizedFetch, enginUrl]);
    const [workflowSummary, setWorkflowSummary] = useState({});
    const queryUrl = `/api/workflows/${apiVersion}/query`;
    useEffect(() => {
        authorizedFetch(queryUrl)
            .then(res => res.json())
            .then(res => {
                const summary = res.results.reduce((acc, res) => {
                    if (res.status in acc) {
                        acc[res.status] = acc[res.status] + 1;
                    } else {
                        acc[res.status] = 1;
                    }
                    return acc;
                }, {});
                setWorkflowSummary(summary);
            })
            .catch(err => console.log(err));
    }, [authorizedFetch, queryUrl]);
    const [apiToken, setApiToken] = useState();
    useEffect(() => {
        getTokenSilently().then(token => setApiToken(token));
    }, [getTokenSilently]);

    return (
        <React.Fragment>
            <Container maxWidth="lg" className={classes.container}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4} lg={3}>
                        <Paper className={fixedHeightPaper}>
                            <Typography
                                component="h2"
                                variant="h6"
                                color="primary"
                                gutterBottom
                            >
                                Cromwell server {apiVersion}
                            </Typography>
                            <Typography component="p" variant="button">
                                Status: {engineStatus}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4} lg={3}>
                        <Paper className={fixedHeightPaper}>
                            <Typography
                                component="h2"
                                variant="h6"
                                color="primary"
                                gutterBottom
                            >
                                Workflows
                            </Typography>
                            <List dense>
                                {Object.keys(workflowSummary)
                                    .sort()
                                    .reverse()
                                    .map(k => (
                                        <ListItem key={k}>
                                            <ListItemText>
                                                <strong>{k}</strong>
                                                {`: ${workflowSummary[k]}`}
                                            </ListItemText>
                                        </ListItem>
                                    ))}
                            </List>
                        </Paper>
                    </Grid>
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
                                    {apiToken ? (
                                        <ListItem>
                                            <Box m="auto">
                                                <TokenMsgBox token={apiToken} />
                                            </Box>
                                        </ListItem>
                                    ) : (
                                        <ListItemText primary="No API Token available." />
                                    )}
                                </List>
                            </Paper>
                        </Grid>
                    ) : null}
                </Grid>
            </Container>
        </React.Fragment>
    );
};

export default Home;

const TokenMsgBox = ({ token }) => {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
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
                    <Typography className={classes.tokenArea} ref={tokenRef}>
                        {token}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button autoFocus onClick={handleCopyClose} color="primary">
                        Copy and Close
                    </Button>
                    <Button autoFocus onClick={handleClose} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
};
TokenMsgBox.propTypes = {
    token: PropTypes.string.isRequired
};
