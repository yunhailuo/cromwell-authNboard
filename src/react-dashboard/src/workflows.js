import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useAuth0 } from "./auth";
import { Link } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Divider from "@material-ui/core/Divider";
import LinkStyle from "@material-ui/core/Link";

const useStyles = makeStyles(theme => ({
    seeMore: {
        marginTop: theme.spacing(3)
    }
}));

const workflowColumns = [
    "id",
    "name",
    "submission",
    "start",
    "end",
    "status",
    "metadataArchiveStatus"
];

export const WorkflowList = () => {
    const { apiVersion, authorizedFetch } = useAuth0();
    const classes = useStyles();
    const [workflows, setWorkflows] = useState([]);
    const queryUrl = `/api/workflows/${apiVersion}/query`;
    useEffect(() => {
        authorizedFetch(queryUrl)
            .then(res => res.json())
            .then(res => setWorkflows(res.results))
            .catch(err => console.log(err));
    }, [authorizedFetch, queryUrl]);
    const [rowCount, setRowCount] = useState(5);
    const addRows = () => setRowCount(rowCount + 5);
    const maxRows = () => setRowCount(workflows.length);
    const resetRows = () => setRowCount(5);

    return (
        <React.Fragment>
            <Typography
                component="h2"
                variant="h6"
                color="primary"
                gutterBottom
            >
                Workflows
            </Typography>
            {workflows.length > 0 ? (
                <React.Fragment>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {workflowColumns.map(col => (
                                    <TableCell key={col}>
                                        <strong>{col}</strong>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {workflows.slice(0, rowCount).map(workflow => (
                                <TableRow key={workflow.id}>
                                    {workflowColumns.map(col => (
                                        <TableCell key={col}>
                                            {col === "id" ? (
                                                <LinkStyle
                                                    component={Link}
                                                    to={`/workflows/${apiVersion}/${workflow[col]}`}
                                                >
                                                    {workflow[col]}
                                                </LinkStyle>
                                            ) : (
                                                workflow[col]
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {rowCount < workflows.length ? (
                        <div className={classes.seeMore}>
                            <LinkStyle
                                color="primary"
                                href="#"
                                onClick={addRows}
                            >
                                See more workflows
                            </LinkStyle>
                            <Divider orientation="vertical" flexItem />
                            <LinkStyle
                                color="primary"
                                href="#"
                                onClick={maxRows}
                            >
                                See all
                            </LinkStyle>
                        </div>
                    ) : (
                        <div className={classes.seeMore}>
                            <LinkStyle
                                color="primary"
                                href="#"
                                onClick={resetRows}
                            >
                                See 5
                            </LinkStyle>
                        </div>
                    )}
                </React.Fragment>
            ) : (
                <div>No workflows found.</div>
            )}
        </React.Fragment>
    );
};

export const Workflow = ({
    match: {
        params: { uuid }
    }
}) => {
    const { apiVersion, authorizedFetch } = useAuth0();
    const workflowUrl = `/api/workflows/${apiVersion}/${uuid}`;
    const [metadata, setMetadata] = useState({});
    useEffect(() => {
        authorizedFetch(workflowUrl + "/metadata")
            .then(res => res.json())
            .then(res => {
                var downloadUrl = URL.createObjectURL(
                    new Blob([JSON.stringify(res)], {
                        type: "application/json"
                    })
                );
                var downloadLink = document.createElement("a");
                downloadLink.download = "metadata.json";
                downloadLink.href = downloadUrl;
                downloadLink.textContent = "Download metadata.json";
                document
                    .getElementById("metadata-download")
                    .appendChild(downloadLink);
                setMetadata(res);
            })
            .catch(err => console.log(err));
        authorizedFetch(workflowUrl + "/timing")
            .then(res => res.text())
            .then(res => {
                const domparser = new DOMParser();
                let doc = domparser.parseFromString(res, "text/html");
                for (let e of doc.scripts) {
                    if (e.innerHTML.length > 0) {
                        var script = document.createElement("script");
                        script.type = "text/javascript";
                        script.text = e.text;
                        document
                            .getElementById("chart_div")
                            .appendChild(script);
                    }
                }
            })
            .catch(err => console.log(err));
    }, [authorizedFetch, workflowUrl]);
    const basicMetadataFields = [
        "id",
        "workflowName",
        "submission",
        "start",
        "end",
        "workflowRoot",
        "actualWorkflowLanguage",
        "actualWorkflowLanguageVersion"
    ];

    return (
        <React.Fragment>
            <Typography
                component="h2"
                variant="h6"
                color="primary"
                gutterBottom
            >
                Workflow ({uuid}): {metadata.status}
            </Typography>
            {/* Basic info */}
            <List dense>
                {basicMetadataFields.map(k =>
                    metadata[k] ? (
                        <ListItem key={k}>
                            <ListItemText>
                                <strong>{k}</strong>
                                {`: ${metadata[k]}`}
                            </ListItemText>
                        </ListItem>
                    ) : null
                )}
                <ListItem id="metadata-download" />
            </List>
            <Divider />
            {/* Execution time */}
            <Typography component="h4" variant="h6" color="secondary">
                <Box textAlign="left">Execution time</Box>
            </Typography>
            <div id="chart_div" />
            <Divider />
            {/* Labels */}
            <Typography component="h4" variant="h6" color="secondary">
                <Box textAlign="left">Labels</Box>
            </Typography>
            <List dense>
                {metadata.labels && Object.keys(metadata.labels).length > 0 ? (
                    Object.keys(metadata.labels)
                        .sort()
                        .map(k => (
                            <ListItem key={k}>
                                <ListItemText>
                                    <strong>{k}</strong>
                                    {`: ${metadata.labels[k]}`}
                                </ListItemText>
                            </ListItem>
                        ))
                ) : (
                    <ListItem>
                        <ListItemText primary="No labels" />
                    </ListItem>
                )}
            </List>
            <Divider />
            {/* Inputs */}
            <Typography component="h4" variant="h6" color="secondary">
                <Box textAlign="left">Inputs</Box>
            </Typography>
            <List dense>
                {metadata.inputs && Object.keys(metadata.inputs).length > 0 ? (
                    Object.keys(metadata.inputs)
                        .filter(
                            k =>
                                metadata.inputs[k] &&
                                metadata.inputs[k].length > 0
                        )
                        .sort()
                        .map(k => (
                            <ListItem key={k}>
                                <ListItemText>
                                    <strong>{k}</strong>
                                    {`: ${metadata.inputs[k]}`}
                                </ListItemText>
                            </ListItem>
                        ))
                ) : (
                    <ListItem>
                        <ListItemText primary="No inputs" />
                    </ListItem>
                )}
            </List>
            <Divider />
            {/* Outputs */}
            <Typography component="h4" variant="h6" color="secondary">
                <Box textAlign="left">Outputs</Box>
            </Typography>
            <List dense>
                {metadata.outputs && Object.keys(metadata.outputs).length > 0 ? (
                    Object.keys(metadata.outputs)
                        .sort()
                        .map(k => (
                            <ListItem key={k}>
                                <ListItemText>
                                    <strong>{k}</strong>
                                    {`: ${metadata.outputs[k]}`}
                                </ListItemText>
                            </ListItem>
                        ))
                ) : (
                    <ListItem>
                        <ListItemText primary="No outputs" />
                    </ListItem>
                )}
            </List>
        </React.Fragment>
    );
};
Workflow.propTypes = {
    match: PropTypes.shape({
        params: PropTypes.shape({
            uuid: PropTypes.string
        })
    }).isRequired
};
