import React, { useEffect, useReducer, useState } from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import CloseIcon from '@material-ui/icons/Close';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Divider from '@material-ui/core/Divider';
import { ExecutionChart } from './execChart';
import GetAppIcon from '@material-ui/icons/GetApp';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import LinkStyle from '@material-ui/core/Link';
import PropTypes from 'prop-types';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { getTimeString } from '../utils';
import { makeStyles } from '@material-ui/core/styles';
import { useApp } from '../App';
import { useAuth0 } from '../auth';

const useStyles = makeStyles((theme) => ({
    controlPanel: {
        justifyContent: 'center',
        paddingBottom: theme.spacing(2),
    },
    subtitle: {
        marginTop: theme.spacing(2),
    },
    alignedIcon: {
        position: 'relative',
        top: 5,
    },
}));

const AbortWorkflow = ({ workflowId, setRefresh = null }) => {
    const action = 'abort';

    const [actionOpen, setActionOpen] = useState(false);
    const [resultOpen, setResultOpen] = useState(false);
    const [resultTitle, setResultTitle] = useState('Abort');
    const [resultContent, setResultContent] = useState(<CircularProgress />);
    const closeResult = (
        <Button autoFocus onClick={() => setResultOpen(false)} color="primary">
            Close
        </Button>
    );
    const [resultAction, setResultAction] = useState(closeResult);

    const handleActionOpen = () => {
        setActionOpen(true);
        setResultOpen(false);
        setResultTitle('Abort');
        setResultContent(<CircularProgress />);
        setResultAction(closeResult);
    };

    const { apiVersion } = useApp();
    const { authorizedFetch } = useAuth0();
    const handleAction = () => {
        setActionOpen(false);
        setResultOpen(true);
        authorizedFetch(
            `/api/workflows/${apiVersion}/${workflowId}/${action}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            },
        )
            .then((res) => {
                if (!res.ok) {
                    setResultTitle('Failed');
                    setResultContent(
                        `Failed to abort workflow ${workflowId}: ${res.statusText}`,
                    );
                    throw new Error(res.statusText);
                }
                return res.json();
            })
            .then((res) => {
                setResultTitle('Succeeded');
                setResultContent(
                    `Successfully ${res.status} workflow ${res.id}`,
                );
                setResultAction(
                    <Button
                        autoFocus
                        onClick={() => {
                            setRefresh(true);
                            setResultOpen(false);
                        }}
                        color="primary"
                    >
                        Close
                    </Button>,
                );
            })
            .catch((err) => console.error(err));
    };

    const actionDialog = (
        <Dialog onClose={() => setActionOpen(false)} open={actionOpen}>
            <DialogTitle>Abort</DialogTitle>
            <DialogContent dividers>
                Do you want to <strong>abort</strong> workflow {workflowId}?
            </DialogContent>
            <DialogActions>
                <Button onClick={handleAction} color="primary">
                    Abort
                </Button>
                <Button
                    autoFocus
                    onClick={() => setActionOpen(false)}
                    color="primary"
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );

    const resultDialog = (
        <Dialog onClose={() => setResultOpen(false)} open={resultOpen}>
            <DialogTitle>{resultTitle}</DialogTitle>
            <DialogContent dividers>{resultContent}</DialogContent>
            <DialogActions>{resultAction}</DialogActions>
        </Dialog>
    );

    return (
        <React.Fragment>
            <Button
                color="secondary"
                variant="contained"
                onClick={handleActionOpen}
            >
                Abort
            </Button>
            {actionDialog}
            {resultDialog}
        </React.Fragment>
    );
};
AbortWorkflow.propTypes = {
    workflowId: PropTypes.string.isRequired,
    setRefresh: PropTypes.func,
};

const updateKeyConflict = (labels, key) => {
    const labelIds = [];
    Object.keys(labels).forEach((id) => {
        if (labels[id].key === key) {
            labelIds.push(id);
        }
    });
    labelIds.forEach((id) => {
        labels[id].keyConflict = key && labelIds.length > 1;
    });
};

const labelReducer = (labels, action) => {
    const newLabels = {};
    Object.keys(labels).forEach((id) => {
        newLabels[id] = { ...labels[id] };
    });
    switch (action.type) {
    case 'ADD':
        newLabels[Math.max(...Object.keys(newLabels)) + 1] = {
            key: action.key || '',
            value: action.value || '',
            readOnlyKey: false,
            keyConflict: false,
        };
        if (action.key) updateKeyConflict(newLabels, action.key);
        return newLabels;
    case 'UPDATE_KEY':
        newLabels[action.id].key = action.key;
        updateKeyConflict(newLabels, labels[action.id].key);
        updateKeyConflict(newLabels, action.key);
        return newLabels;
    case 'UPDATE_VALUE':
        newLabels[action.id].value = action.value;
        return newLabels;
    case 'DELETE':
        if (!newLabels[action.id]) {
            console.error(`Label ${action.id} not in records!`);
            return newLabels;
        }
        if (newLabels[action.id].readOnlyKey) {
            console.error(`Label ${action.id} cannot be deleted!`);
            return newLabels;
        }
        delete newLabels[action.id];
        updateKeyConflict(newLabels, labels[action.id].key);
        return newLabels;
    default:
        console.error(`Unknown label action ${action.type}!`);
    }
};

const LabelManager = ({
    workflowId,
    currentLabels = {},
    setRefresh = null,
}) => {
    const [managerOpen, setManagerOpen] = useState(false);
    const [resultOpen, setResultOpen] = useState(false);
    const [resultTitle, setResultTitle] = useState('Abort');
    const [resultContent, setResultContent] = useState(<CircularProgress />);
    const closeResult = (
        <Button autoFocus onClick={() => setResultOpen(false)} color="primary">
            Close
        </Button>
    );
    const [resultAction, setResultAction] = useState(closeResult);

    const initLabel = {};
    Object.keys(currentLabels).forEach((key, i) => {
        initLabel[i] = {
            key: key,
            value: currentLabels[key],
            readOnlyKey: true,
            keyConflict: false,
        };
    });
    const [labelRoster, dispatchLabelRoster] = useReducer(
        labelReducer,
        initLabel,
    );

    const { apiVersion } = useApp();
    const { authorizedFetch } = useAuth0();
    const handleSubmit = () => {
        setManagerOpen(false);
        setResultOpen(true);
        const updatedLabels = {};
        Object.keys(labelRoster).forEach((id) => {
            const key = labelRoster[id].key;
            if (!key) return;
            const value = labelRoster[id].value;
            if (!currentLabels[key] || currentLabels[key] !== value) {
                updatedLabels[key] = labelRoster[id].value;
            }
        });
        authorizedFetch(`/api/workflows/${apiVersion}/${workflowId}/labels`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedLabels),
        })
            .then((res) => {
                if (!res.ok) {
                    setResultTitle('Failed');
                    setResultContent(
                        `Failed to update labels: ${res.statusText}`,
                    );
                    throw new Error(res.statusText);
                }
                return res.json();
            })
            .then(() => {
                setResultTitle('Succeeded');
                setResultContent('Labels updated.');
                setResultAction(
                    <Button
                        autoFocus
                        onClick={() => {
                            if (setRefresh) setRefresh(true);
                            setResultOpen(false);
                        }}
                        color="primary"
                    >
                        Close
                    </Button>,
                );
            })
            .catch((err) => console.error(err));
    };

    const managerDialog = (
        <Dialog onClose={() => setManagerOpen(false)} open={managerOpen}>
            <DialogTitle>Add/Update labels</DialogTitle>
            <DialogContent dividers>
                <Box marginBottom={2}>
                    <i>
                        Notes: Labels are key-value pairs. While you can change
                        the value of a key as much as you like, Cromwell
                        doesn&apos;t allow label (key) deletion as for now.
                        Please add label with cautious.
                    </i>
                </Box>
                {Object.keys(labelRoster).map((id) => (
                    <Grid container alignItems="center" spacing={2} key={id}>
                        {labelRoster[id].readOnlyKey ? (
                            <Grid item xs={3} component={Box} fontSize="1rem">
                                {labelRoster[id].key}
                            </Grid>
                        ) : (
                            <Grid
                                item
                                xs={3}
                                component={TextField}
                                variant="outlined"
                                size="small"
                                value={labelRoster[id].key}
                                error={labelRoster[id].keyConflict}
                                helperText={
                                    labelRoster[id].keyConflict
                                        ? 'Duplicated key'
                                        : null
                                }
                                onChange={(event) =>
                                    dispatchLabelRoster({
                                        type: 'UPDATE_KEY',
                                        id: id,
                                        key: event.target.value,
                                    })
                                }
                            />
                        )}
                        <Grid
                            item
                            xs={8}
                            component={TextField}
                            fullWidth
                            variant="outlined"
                            size="small"
                            value={labelRoster[id].value}
                            onChange={(event) =>
                                dispatchLabelRoster({
                                    type: 'UPDATE_VALUE',
                                    id: id,
                                    value: event.target.value,
                                })
                            }
                        />
                        {labelRoster[id].readOnlyKey ? null : (
                            <Grid
                                item
                                xs={1}
                                component={IconButton}
                                onClick={() =>
                                    dispatchLabelRoster({
                                        type: 'DELETE',
                                        id: id,
                                    })
                                }
                            >
                                <CloseIcon />
                            </Grid>
                        )}
                    </Grid>
                ))}
                <Grid
                    container
                    alignItems="center"
                    component={Box}
                    marginTop={2}
                >
                    <Grid
                        item
                        xs={12}
                        component={Button}
                        variant="contained"
                        onClick={() => dispatchLabelRoster({ type: 'ADD' })}
                    >
                        +
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    disabled={Object.keys(labelRoster).some(
                        (id) => labelRoster[id].keyConflict,
                    )}
                    onClick={handleSubmit}
                    color="primary"
                >
                    Submit
                </Button>
                <Button
                    autoFocus
                    onClick={() => setManagerOpen(false)}
                    color="primary"
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );

    const resultDialog = (
        <Dialog onClose={() => setResultOpen(false)} open={resultOpen}>
            <DialogTitle>{resultTitle}</DialogTitle>
            <DialogContent dividers>{resultContent}</DialogContent>
            <DialogActions>{resultAction}</DialogActions>
        </Dialog>
    );

    return (
        <React.Fragment>
            <Button variant="contained" onClick={() => setManagerOpen(true)}>
                Add/Update labels
            </Button>
            {managerDialog}
            {resultDialog}
        </React.Fragment>
    );
};
LabelManager.propTypes = {
    workflowId: PropTypes.string.isRequired,
    currentLabels: PropTypes.objectOf(PropTypes.string),
    setRefresh: PropTypes.func,
};

const SimpleObjectTable = ({ obj = {} }) =>
    obj && Object.keys(obj).length > 0 ? (
        <Table size="small">
            <TableBody>
                {Object.keys(obj)
                    .filter((k) => obj[k] && obj[k].length > 0)
                    .sort()
                    .map((k) =>
                        Array.isArray(obj[k]) ? (
                            obj[k].map((element, index) => (
                                <TableRow key={index}>
                                    {index === 0 ? (
                                        <TableCell
                                            component="th"
                                            scope="row"
                                            rowSpan={obj[k].length}
                                        >
                                            <strong>{k}:</strong>
                                        </TableCell>
                                    ) : null}
                                    <TableCell>{element}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow key={k}>
                                <TableCell component="th" scope="row">
                                    <strong>{k}:</strong>
                                </TableCell>
                                <TableCell>{obj[k]}</TableCell>
                            </TableRow>
                        ),
                    )}
            </TableBody>
        </Table>
    ) : (
        <Table size="small">
            <TableBody>
                <TableRow>
                    <TableCell component="th" scope="row" colSpan={2}>
                        N/A
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
SimpleObjectTable.propTypes = {
    obj: PropTypes.object,
};

const BasicMetadataTable = (metadata) => {
    const start = new Date(metadata.start);
    const end = new Date(metadata.end);
    const startString = isNaN(start) ? '?' : start.toLocaleString();
    const endString = isNaN(end) ? '?' : end.toLocaleString();
    const durationPostfix =
        isNaN(start) || isNaN(end) ? '' : ` (${getTimeString(end - start)})`;
    const duration = `${startString} - ${endString}${durationPostfix}`;

    const backends = new Set();
    const zones = new Set();
    const machineTypes = new Set();
    let totalCpuHours = 0;
    let cpuError = [];
    let totalMemoryHours = 0;
    let memoryError = [];
    Object.keys(metadata.calls).forEach((callName) => {
        const shardArray = Array.isArray(metadata.calls[callName])
            ? metadata.calls[callName]
            : [metadata.calls[callName]];
        shardArray.forEach((callShard) => {
            backends.add(callShard.backend || 'unknown');
            if (callShard.jes) {
                zones.add(callShard.jes.zone || 'unknown');
                machineTypes.add(callShard.jes.machineType || 'unknown');
            } else {
                zones.add('N/A');
                machineTypes.add('N/A');
            }

            // Calculation can't be right once there is an error.
            if (cpuError.length > 0 && memoryError.length > 0) return null;

            const start = new Date(callShard.start);
            const end = new Date(callShard.end);
            if (isNaN(start) || isNaN(end)) {
                const error = `Missing start/end time for ${callName}`;
                cpuError.push(error);
                memoryError.push(error);
            } else if (!callShard.runtimeAttributes) {
                const error = `Missing runtime attributes for ${callName}`;
                cpuError.push(error);
                memoryError.push(error);
            } else {
                const cpuCount =
                    callShard.runtimeAttributes.cpu ||
                    callShard.runtimeAttributes.cpuMin;
                if (isNaN(cpuCount)) {
                    cpuError.push(
                        `Failed to get number of CPU for ${callName}`,
                    );
                } else {
                    totalCpuHours +=
                        (cpuCount * (end - start)) / 1000 / 60 / 60;
                }
                const memorySize = (
                    callShard.runtimeAttributes.memory ||
                    callShard.runtimeAttributes.memoryMin
                ).replace(' GB', '');
                if (isNaN(memorySize)) {
                    memoryError.push(
                        `Failed to get memory in GB for ${callName}`,
                    );
                } else {
                    totalMemoryHours +=
                        (memorySize * (end - start)) / 1000 / 60 / 60;
                }
            }
        });
    });

    return (
        <SimpleObjectTable
            obj={{
                'Workflow Language': `${metadata.actualWorkflowLanguage}${
                    metadata.actualWorkflowLanguageVersion
                        ? ` (${metadata.actualWorkflowLanguageVersion})`
                        : ''
                }`,
                Submission: new Date(metadata.submission).toLocaleString(),
                Duration: duration,
                'Workflow Root': metadata.workflowRoot,
                Backends: Array.from(backends).join(', '),
                'Machine zones': Array.from(zones).join(', '),
                'Machine types used': Array.from(machineTypes).join(', '),
                'Total CPU hours':
                    cpuError.join(', ') || totalCpuHours.toFixed(2),
                'Total memory GB * hours':
                    memoryError.join(', ') || totalMemoryHours.toFixed(2),
            }}
        />
    );
};

const FailureTable = ({ calls }) => {
    const failureObj = {};
    if (calls && Object.keys(calls).length > 0) {
        Object.keys(calls).forEach((callName) => {
            let shards = calls[callName];
            if (!Array.isArray(calls[callName])) {
                shards = [shards];
            }
            shards.forEach((shard) => {
                if (shard.failures && shard.failures.length > 0) {
                    shard.failures.forEach((failure) => {
                        if (failure.message) {
                            if (failureObj[callName]) {
                                failureObj[callName].push(failure.message);
                            } else {
                                failureObj[callName] = [failure.message];
                            }
                        }
                    });
                }
            });
        });
    }
    return <SimpleObjectTable obj={{ ...failureObj }} />;
};
FailureTable.propTypes = {
    calls: PropTypes.object.isRequired,
};

const OutputsTable = ({ calls }) => {
    const outputs = {};
    Object.keys(calls).forEach((callName) => {
        let shards = calls[callName];
        if (!Array.isArray(shards)) shards = [shards];
        shards.forEach((shard) => {
            if (shard.outputs) {
                Object.keys(shard.outputs).forEach((shardOutKey) => {
                    const callOutKey = `${callName}.${shardOutKey}`;
                    if (outputs[callOutKey]) {
                        if (Array.isArray(outputs[callOutKey])) {
                            outputs[callOutKey].push(
                                shard.outputs[shardOutKey],
                            );
                        } else {
                            outputs[callOutKey] = [
                                outputs[callOutKey],
                                shard.outputs[shardOutKey],
                            ];
                        }
                    } else {
                        outputs[callOutKey] = [shard.outputs[shardOutKey]];
                    }
                });
            }
        });
    });

    return <SimpleObjectTable obj={outputs} />;
};
OutputsTable.propTypes = {
    calls: PropTypes.object.isRequired,
};

const Workflow = ({
    match: {
        params: { uuid },
    },
}) => {
    const classes = useStyles();
    const { authorizedFetch } = useAuth0();
    const { apiVersion, setAppBarTitle } = useApp();
    useEffect(() => setAppBarTitle('Workflow Details'), [setAppBarTitle]);

    const [loadingMetadata, setLoadingMetadata] = useState(true);
    const [metadata, setMetadata] = useState();
    const [metadataDownloadUrl, setMetadataDownloadUrl] = useState();
    const [refresh, setRefresh] = useState(false);
    useEffect(() => {
        setRefresh(false);
        authorizedFetch(`/api/workflows/${apiVersion}/${uuid}/metadata`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(res.statusText);
                }
                return res.json();
            })
            .then((res) => {
                setAppBarTitle(`${res.workflowName} (${uuid}): ${res.status}`);
                const downloadUrl = URL.createObjectURL(
                    new Blob([JSON.stringify(res)], {
                        type: 'application/json',
                    }),
                );
                setMetadataDownloadUrl(downloadUrl);
                setMetadata(res);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoadingMetadata(false));
    }, [authorizedFetch, apiVersion, uuid, setAppBarTitle, refresh]);

    return loadingMetadata ? (
        <CircularProgress />
    ) : !metadata ? null : (
        <React.Fragment>
            <Grid container spacing={3} className={classes.controlPanel}>
                {metadata.status === 'Running' ? (
                    <Grid item>
                        <AbortWorkflow
                            workflowId={uuid}
                            setRefresh={setRefresh}
                        />
                    </Grid>
                ) : null}
                <Grid item>
                    <LabelManager
                        workflowId={uuid}
                        currentLabels={metadata.labels}
                        setRefresh={setRefresh}
                    />
                </Grid>
            </Grid>
            {/* Basic info */}
            <Typography component="h4" variant="h6" color="secondary">
                <Box textAlign="left">
                    <span>Metadata</span>
                    {metadataDownloadUrl ? (
                        <LinkStyle
                            download="metadata.json"
                            href={metadataDownloadUrl}
                        >
                            <GetAppIcon className={classes.alignedIcon} />
                        </LinkStyle>
                    ) : null}
                </Box>
            </Typography>
            <BasicMetadataTable {...metadata} />
            {/* Failures */}
            {metadata.status === 'Failed' ? (
                <React.Fragment>
                    <Typography
                        component="h4"
                        variant="h6"
                        color="secondary"
                        className={classes.subtitle}
                    >
                        <Box textAlign="left">Failures</Box>
                    </Typography>
                    <FailureTable calls={metadata.calls} />
                </React.Fragment>
            ) : null}
            {/* Execution time */}
            <Typography
                component="h4"
                variant="h6"
                color="secondary"
                className={classes.subtitle}
            >
                <Box textAlign="left">Execution chart</Box>
            </Typography>
            <ExecutionChart workflowMetadata={metadata} />
            <Divider />
            {/* Labels */}
            <Typography
                component="h4"
                variant="h6"
                color="secondary"
                className={classes.subtitle}
            >
                <Box textAlign="left">Labels</Box>
            </Typography>
            <SimpleObjectTable obj={metadata.labels} />
            {/* Inputs */}
            <Typography
                component="h4"
                variant="h6"
                color="secondary"
                className={classes.subtitle}
            >
                <Box textAlign="left">Inputs</Box>
            </Typography>
            <SimpleObjectTable obj={metadata.inputs} />
            {/* Outputs */}
            <Typography
                component="h4"
                variant="h6"
                color="secondary"
                className={classes.subtitle}
            >
                <Box textAlign="left">Outputs</Box>
            </Typography>
            <OutputsTable calls={metadata.calls} />
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
