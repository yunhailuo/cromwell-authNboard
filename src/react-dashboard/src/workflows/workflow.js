import React, { useEffect, useState } from 'react';
import Box from '@material-ui/core/Box';
import CircularProgress from '@material-ui/core/CircularProgress';
import Divider from '@material-ui/core/Divider';
import { ExecutionChart } from './execChart';
import GetAppIcon from '@material-ui/icons/GetApp';
import LinkStyle from '@material-ui/core/Link';
import PropTypes from 'prop-types';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import { getTimeString } from '../utils';
import { makeStyles } from '@material-ui/core/styles';
import { useApp } from '../App';
import { useAuth0 } from '../auth';

const useStyles = makeStyles((theme) => ({
    subtitle: {
        marginTop: theme.spacing(2),
    },
    alignedIcon: {
        position: 'relative',
        top: 5,
    },
}));

const distillMetadata = (metadata) => {
    const start = new Date(metadata.start);
    const end = new Date(metadata.end);
    const startString = isNaN(start) ? '?' : start.toLocaleString();
    const endString = isNaN(end) ? '?' : end.toLocaleString();
    const durationPostfix =
        isNaN(start) || isNaN(end) ? '' : ` (${getTimeString(end - start)})`;
    const duration = `${startString} - ${endString}${durationPostfix}`;

    let totalCpuHours = 0;
    let cpuError = '';
    let totalMemoryHours = 0;
    let memoryError = '';
    const machineTypes = new Set();
    const zones = new Set();
    const backends = new Set();
    Object.keys(metadata.calls).forEach((callName) => {
        metadata.calls[callName].forEach((callShard) => {
            const start = new Date(callShard.start);
            const end = new Date(callShard.end);
            if (isNaN(start) || isNaN(end)) {
                const error = `Missing start/end time for ${callName}`;
                cpuError = error;
                memoryError = error;
            } else if (!callShard.runtimeAttributes) {
                const error = `Missing runtime attributes for ${callName}`;
                cpuError = error;
                memoryError = error;
            } else {
                const cpuCount =
                    callShard.runtimeAttributes.cpu ||
                    callShard.runtimeAttributes.cpuMin;
                if (isNaN(cpuCount)) {
                    cpuError = `Failed to get number of CPU for ${callName}`;
                } else {
                    totalCpuHours +=
                        (cpuCount * (end - start)) / 1000 / 60 / 60;
                }
                const memorySize = (
                    callShard.runtimeAttributes.memory ||
                    callShard.runtimeAttributes.memoryMin
                ).replace(' GB', '');
                if (isNaN(memorySize)) {
                    memoryError = `Failed to get memory in GB for ${callName}`;
                } else {
                    totalMemoryHours +=
                        (memorySize * (end - start)) / 1000 / 60 / 60;
                }
            }
            if (callShard.jes) {
                machineTypes.add(callShard.jes.machineType || 'unknown');
                zones.add(callShard.jes.zone || 'unknown');
            } else {
                machineTypes.add('N/A');
                zones.add('N/A');
            }
            backends.add(callShard.backend || 'unknown');
        });
    });
    return {
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
        'Total CPU hours': cpuError || totalCpuHours.toFixed(2),
        'Total memory GB * hours': memoryError || totalMemoryHours.toFixed(2),
    };
};

const SimpleObjectTable = ({ obj }) => (
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
);
SimpleObjectTable.propTypes = {
    obj: PropTypes.object.isRequired,
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
    const [basicMetadata, setBasicMetadata] = useState();
    useEffect(() => {
        authorizedFetch(`/api/workflows/${apiVersion}/${uuid}/metadata`)
            .then((res) => res.json())
            .then((res) => {
                setAppBarTitle(`${res.workflowName} (${uuid}): ${res.status}`);
                const downloadUrl = URL.createObjectURL(
                    new Blob([JSON.stringify(res)], {
                        type: 'application/json',
                    }),
                );
                setMetadataDownloadUrl(downloadUrl);
                setBasicMetadata(distillMetadata(res));
                setMetadata(res);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoadingMetadata(false));
    }, [authorizedFetch, apiVersion, uuid, setAppBarTitle]);

    return loadingMetadata ? (
        <CircularProgress />
    ) : !metadata ? null : (
        <React.Fragment>
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
            <SimpleObjectTable obj={basicMetadata} />
            {/* Execution time */}
            <Typography
                component="h4"
                variant="h6"
                color="secondary"
                className={classes.subtitle}
            >
                <Box textAlign="left">Execution time</Box>
            </Typography>
            <ExecutionChart metadata={metadata} />
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
            {metadata.labels && Object.keys(metadata.labels).length > 0 ? (
                <SimpleObjectTable obj={metadata.labels} />
            ) : (
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell component="th" scope="row" colSpan={2}>
                                No labels
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            )}
            {/* Inputs */}
            <Typography
                component="h4"
                variant="h6"
                color="secondary"
                className={classes.subtitle}
            >
                <Box textAlign="left">Inputs</Box>
            </Typography>
            {metadata.inputs && Object.keys(metadata.inputs).length > 0 ? (
                <SimpleObjectTable obj={metadata.inputs} />
            ) : (
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell component="th" scope="row" colSpan={2}>
                                No inputs
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            )}
            {/* Outputs */}
            <Typography
                component="h4"
                variant="h6"
                color="secondary"
                className={classes.subtitle}
            >
                <Box textAlign="left">Outputs</Box>
            </Typography>
            {metadata.outputs && Object.keys(metadata.outputs).length > 0 ? (
                <SimpleObjectTable obj={metadata.outputs} />
            ) : (
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell component="th" scope="row" colSpan={2}>
                                No outputs
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            )}
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
