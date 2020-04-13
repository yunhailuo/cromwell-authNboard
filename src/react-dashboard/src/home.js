import React, { useState, useEffect } from "react";
import { UserTile, useAuth0 } from "./auth";
import { useApi } from "./App";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

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
    const { authorizedFetch } = useAuth0();
    const { apiVersion } = useApi();

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
                    <UserTile />
                </Grid>
            </Container>
        </React.Fragment>
    );
};

export default Home;
