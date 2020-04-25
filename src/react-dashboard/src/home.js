import React, { useEffect, useState } from 'react';
import { UserTile, useAuth0 } from './auth';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { useApp } from './App';

const useStyles = makeStyles((theme) => ({
    container: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
    },
    gridContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    fixedHeightPaper: {
        padding: theme.spacing(2),
        display: 'flex',
        overflow: 'auto',
        flexDirection: 'column',
        height: 240,
    },
    superDense: {
        paddingTop: 1,
        paddingBottom: 1,
    },
}));

const ServerTile = () => {
    const { authorizedFetch } = useAuth0();
    const { apiVersion } = useApp();

    const [engineStatus, setEngineStatus] = useState('');
    useEffect(() => {
        authorizedFetch(`/engine/${apiVersion}/status`)
            .then((res) => res.statusText)
            .then((res) => setEngineStatus(res))
            .catch((err) => console.error(err));
    }, [authorizedFetch, apiVersion]);

    const classes = useStyles();

    return (
        <Grid item xs={12} md={4} lg={3}>
            <Paper className={classes.fixedHeightPaper}>
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
    );
};

const WorkflowSummaryTile = () => {
    const { authorizedFetch } = useAuth0();
    const { apiVersion } = useApp();

    const [workflowSummary, setWorkflowSummary] = useState({});
    useEffect(() => {
        authorizedFetch(`/api/workflows/${apiVersion}/query`)
            .then((res) => res.json())
            .then((res) => {
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
            .catch((err) => console.error(err));
    }, [authorizedFetch, apiVersion]);

    const classes = useStyles();

    return (
        <Grid item xs={12} md={4} lg={3}>
            <Paper className={classes.fixedHeightPaper}>
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
                        .map((k) => (
                            <ListItem key={k} className={classes.superDense}>
                                <ListItemText>
                                    <strong>{k}</strong>
                                    {`: ${workflowSummary[k]}`}
                                </ListItemText>
                            </ListItem>
                        ))}
                </List>
            </Paper>
        </Grid>
    );
};

const Home = () => {
    const { setAppBarTitle } = useApp();
    useEffect(() => setAppBarTitle('Cromwell Dashboard'), [setAppBarTitle]);

    const classes = useStyles();

    return (
        <React.Fragment>
            <Container maxWidth="lg" className={classes.container}>
                <Grid container spacing={3} className={classes.gridContainer}>
                    <ServerTile />
                    <WorkflowSummaryTile />
                    <UserTile />
                </Grid>
            </Container>
        </React.Fragment>
    );
};

export default Home;
