import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth0 } from '../auth';
import { useApp } from '../App';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';

const basicMetadataFields = [
    'id',
    'workflowName',
    'submission',
    'start',
    'end',
    'workflowRoot',
    'actualWorkflowLanguage',
    'actualWorkflowLanguageVersion',
];

const Workflow = ({
    match: {
        params: { uuid },
    },
}) => {
    const { authorizedFetch } = useAuth0();
    const { apiVersion, setAppBarTitle } = useApp();
    useEffect(() => setAppBarTitle('Workflow Details'));

    const [metadata, setMetadata] = useState({});
    useEffect(() => {
        authorizedFetch(`/api/workflows/${apiVersion}/${uuid}/metadata`)
            .then((res) => res.json())
            .then((res) => {
                var downloadUrl = URL.createObjectURL(
                    new Blob([JSON.stringify(res)], {
                        type: 'application/json',
                    }),
                );
                var downloadLink = document.createElement('a');
                downloadLink.download = 'metadata.json';
                downloadLink.href = downloadUrl;
                downloadLink.textContent = 'Download metadata.json';
                document
                    .getElementById('metadata-download')
                    .appendChild(downloadLink);
                setMetadata(res);
            })
            .catch((err) => console.log(err));
    }, [authorizedFetch, apiVersion, uuid]);

    useEffect(() => {
        authorizedFetch(`/api/workflows/${apiVersion}/${uuid}/timing`)
            .then((res) => res.text())
            .then((res) => {
                const domparser = new DOMParser();
                let doc = domparser.parseFromString(res, 'text/html');
                for (let e of doc.scripts) {
                    if (e.innerHTML.length > 0) {
                        var script = document.createElement('script');
                        script.type = 'text/javascript';
                        script.text = e.text;
                        document
                            .getElementById('chart_div')
                            .appendChild(script);
                    }
                }
            })
            .catch((err) => console.log(err));
    }, [authorizedFetch, apiVersion, uuid]);

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
                {basicMetadataFields.map((k) =>
                    metadata[k] ? (
                        <ListItem key={k}>
                            <ListItemText>
                                <strong>{k}</strong>
                                {`: ${metadata[k]}`}
                            </ListItemText>
                        </ListItem>
                    ) : null,
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
                        .map((k) => (
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
                            (k) =>
                                metadata.inputs[k] &&
                                metadata.inputs[k].length > 0,
                        )
                        .sort()
                        .map((k) => (
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
                {metadata.outputs &&
                Object.keys(metadata.outputs).length > 0 ? (
                        Object.keys(metadata.outputs)
                            .sort()
                            .map((k) => (
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
            uuid: PropTypes.string,
        }),
    }).isRequired,
};
export default Workflow;
