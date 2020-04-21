import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth0 } from '../auth';
import { useApp } from '../App';
import { getTimeString } from '../utils';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import LinkStyle from '@material-ui/core/Link';

const metadataPresentation = {
    workflowLanguage: {
        label: 'Workflow Language',
        getData: (metadata) =>
            `${metadata.actualWorkflowLanguage}${
                metadata.actualWorkflowLanguageVersion
                    ? ` (${metadata.actualWorkflowLanguageVersion})`
                    : ''
            }`,
    },
    submission: {
        label: 'Submission',
        getData: (metadata) => new Date(metadata.submission).toLocaleString(),
    },
    duration: {
        label: 'Duration',
        getData: (metadata) => {
            const start = new Date(metadata.start);
            const end = new Date(metadata.end);
            const startString = isNaN(start) ? '?' : start.toLocaleString();
            const endString = isNaN(end) ? '?' : end.toLocaleString();
            const durationPostfix =
                isNaN(start) || isNaN(end)
                    ? ''
                    : ` (${getTimeString(end - start)})`;
            return `${startString} - ${endString}${durationPostfix}`;
        },
    },
    workflowRoot: {
        label: 'Workflow Root',
    },
    backends: {
        label: 'Backends',
    },
    zones: {
        label: 'Machine zones',
    },
    machineTypes: {
        label: 'Machine types used',
    },
    cpuHours: {
        label: 'Total CPU hours',
        getData: (metadata) =>
            metadata.cpuError || metadata.totalCpuHours.toFixed(2),
    },
    memoryHours: {
        label: 'Total memory GB * hours',
        getData: (metadata) =>
            metadata.memoryError || metadata.totalMemoryHours.toFixed(2),
    },
};

const distillCallMetadata = (metadata) => {
    let timeError = '';
    let totalCpuHours = 0;
    let cpuError = '';
    let totalMemoryHours = 0;
    let memoryError = '';
    const machineTypes = new Set();
    const zones = new Set();
    const backends = new Set();
    Object.keys(metadata.calls).forEach((callName) => {
        metadata.calls[callName].forEach((subWorkflowMetadata) => {
            const start = new Date(subWorkflowMetadata.start);
            const end = new Date(subWorkflowMetadata.end);
            if (isNaN(start) || isNaN(end)) {
                timeError = `Missing start/end time for ${callName}`;
            } else {
                const cpuCount =
                    subWorkflowMetadata.runtimeAttributes.cpu ||
                    subWorkflowMetadata.runtimeAttributes.cpuMin;
                if (isNaN(cpuCount)) {
                    cpuError = `Failed to get number of CPU for ${callName}`;
                } else {
                    totalCpuHours +=
                        (cpuCount * (end - start)) / 1000 / 60 / 60;
                }
                const memorySize = (
                    subWorkflowMetadata.runtimeAttributes.memory ||
                    subWorkflowMetadata.runtimeAttributes.memoryMin
                ).replace(' GB', '');
                if (isNaN(memorySize)) {
                    memoryError = `Failed to get memory in GB for ${callName}`;
                } else {
                    totalMemoryHours +=
                        (memorySize * (end - start)) / 1000 / 60 / 60;
                }
            }
            if (
                subWorkflowMetadata.jes &&
                subWorkflowMetadata.jes.machineType
            ) {
                machineTypes.add(subWorkflowMetadata.jes.machineType);
            }
            if (subWorkflowMetadata.jes && subWorkflowMetadata.jes.zone) {
                zones.add(subWorkflowMetadata.jes.zone);
            }
            if (subWorkflowMetadata.backend) {
                backends.add(subWorkflowMetadata.backend);
            }
        });
    });
    return {
        timeError,
        totalCpuHours,
        cpuError,
        totalMemoryHours,
        memoryError,
        machineTypes: Array.from(machineTypes),
        zones: Array.from(zones),
        backends: Array.from(backends),
    };
};

const Workflow = ({
    match: {
        params: { uuid },
    },
}) => {
    const { authorizedFetch } = useAuth0();
    const { apiVersion, setAppBarTitle } = useApp();
    useEffect(() => setAppBarTitle('Workflow Details'));

    const [loadingMetadata, setLoadingMetadata] = useState(true);
    const [metadata, setMetadata] = useState();
    const [metadataDownloadUrl, setMetadataDownloadUrl] = useState();
    useEffect(() => {
        authorizedFetch(`/api/workflows/${apiVersion}/${uuid}/metadata`)
            .then((res) => res.json())
            .then((res) => {
                const enhancedMetadata = {
                    ...res,
                    ...distillCallMetadata(res),
                };
                const downloadUrl = URL.createObjectURL(
                    new Blob([JSON.stringify(enhancedMetadata)], {
                        type: 'application/json',
                    }),
                );
                setMetadataDownloadUrl(downloadUrl);
                setMetadata(enhancedMetadata);
                setLoadingMetadata(false);
            })
            .catch((err) => console.log(err));
    }, [authorizedFetch, apiVersion, uuid]);

    useEffect(() => {
        if (!metadata) {
            return;
        }
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
    }, [metadata, authorizedFetch, apiVersion, uuid]);

    return loadingMetadata ? (
        <CircularProgress />
    ) : !metadata ? null : (
        <React.Fragment>
            <Typography
                component="h2"
                variant="h6"
                color="primary"
                gutterBottom
            >
                {metadata.workflowName} ({uuid}): {metadata.status}
            </Typography>
            {/* Basic info */}
            <List dense>
                {Object.keys(metadataPresentation).map((k) => (
                    <ListItem key={k}>
                        <ListItemText>
                            <strong>
                                {metadataPresentation[k].label || k}
                            </strong>
                            {`: ${
                                metadataPresentation[k].getData
                                    ? metadataPresentation[k].getData(metadata)
                                    : metadata[k]
                            }`}
                        </ListItemText>
                    </ListItem>
                ))}
                {metadataDownloadUrl ? (
                    <ListItem>
                        <LinkStyle
                            download="metadata.json"
                            href={metadataDownloadUrl}
                        >
                            Download metadata.json
                        </LinkStyle>
                    </ListItem>
                ) : null}
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
