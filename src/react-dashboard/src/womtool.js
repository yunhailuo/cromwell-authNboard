import React, { useEffect, useRef, useState } from 'react';
import { SimpleObjectTable, SingleFileUpload } from './utils';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import GetAppIcon from '@material-ui/icons/GetApp';
import Grid from '@material-ui/core/Grid';
import LinkStyle from '@material-ui/core/Link';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { useApp } from './App';
import { useAuth0 } from './auth';

const useStyles = makeStyles((theme) => ({
    formContainer: {
        margin: theme.spacing(3),
        width: '96%',
        alignItems: 'flex-end',
    },
    fileInputContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
    },
    fileInputDisplay: {
        flexGrow: 1,
        textAlign: 'start',
    },
    fileInput: {
        display: 'none',
    },
    alignedIcon: {
        position: 'relative',
        top: 5,
    },
}));

const workflowTypeVersionMap = {
    WDL: ['draft-2', '1.0'],
    CWL: ['v1.0'],
};

const WomTool = () => {
    const classes = useStyles();
    const { authorizedFetch } = useAuth0();
    const { apiVersion, setAppBarTitle } = useApp();
    useEffect(() => setAppBarTitle('Workflow Object Model (WOM) tool'), [
        setAppBarTitle,
    ]);

    // Parameters in form
    const [workflowType, setWorkflowType] = useState('WDL');
    const [workflowTypeVersion, setWorkflowTypeVersion] = useState(
        workflowTypeVersionMap[workflowType][0],
    );
    const [workflowUrl, setWorkflowUrl] = useState('');
    const workflowSourceRef = useRef();
    const workflowInputRef = useRef();
    const [womRequested, setWomRequested] = useState(false);
    const [womResultSummary, setWomResultSummary] = useState();
    const [womResultDownloadUrl, setWomResultDownloadUrl] = useState();

    // Form handlers
    const handleInputChange = (event) => {
        const target = event.target;
        switch (target.name) {
        case 'workflowType':
            setWorkflowType(target.value);
            break;
        case 'workflowTypeVersion':
            setWorkflowTypeVersion(target.value);
            break;
        case 'workflowUrl':
            setWorkflowUrl(target.value);
            break;
        default:
            console.log(event);
        }
    };
    const resetWomForm = () => {
        setWorkflowType('WDL');
        setWorkflowTypeVersion(workflowTypeVersionMap['WDL'][0]);
        setWorkflowUrl('');
        workflowSourceRef.current && workflowSourceRef.current.reset();
        workflowInputRef.current && workflowInputRef.current.reset();
        setWomRequested(false);
        setWomResultSummary();
        setWomResultDownloadUrl();
    };

    const submitWom = (event) => {
        event.preventDefault();
        setWomResultSummary();
        setWomRequested(true);
        const womFormData = new FormData();
        womFormData.append('workflowType', workflowType);
        womFormData.append('workflowTypeVersion', workflowTypeVersion);
        if (workflowUrl) {
            womFormData.append('workflowUrl', workflowUrl);
        }
        if (workflowSourceRef.current.files.length > 0) {
            womFormData.append(
                'workflowSource',
                workflowSourceRef.current.files[0],
            );
        }
        if (workflowInputRef.current.files.length > 0) {
            womFormData.append(
                'workflowInputs',
                workflowInputRef.current.files[0],
            );
        }
        authorizedFetch(`/api/womtool/${apiVersion}/describe`, {
            method: 'POST',
            body: womFormData,
        })
            .then((res) => {
                if (!res.ok) {
                    setWomResultSummary({ Failed: res.statusText });
                    throw new Error(res.statusText);
                }
                return res.json();
            })
            .then((res) => {
                const downloadUrl = URL.createObjectURL(
                    new Blob([JSON.stringify(res)], {
                        type: 'application/json',
                    }),
                );
                setWomResultDownloadUrl(downloadUrl);
                const summary = {};
                Object.keys(res).forEach((k) => {
                    if (
                        typeof res[k] === 'string' ||
                        typeof res[k] === 'boolean'
                    ) {
                        summary[k] = res[k].toString();
                    }
                });
                setWomResultSummary(summary);
            })
            .catch((err) => console.error(err));
    };

    return (
        <React.Fragment>
            <Grid
                container
                className={classes.formContainer}
                spacing={3}
                component="form"
                autoComplete="off"
                onSubmit={submitWom}
                onReset={resetWomForm}
            >
                <Grid item xs={12} md={2} component={FormControl}>
                    <TextField
                        select
                        name="workflowType"
                        label="Workflow type"
                        value={workflowType}
                        onChange={handleInputChange}
                    >
                        {Object.keys(workflowTypeVersionMap).map((typ) => (
                            <MenuItem key={typ} value={typ}>
                                {typ}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={12} md={2} component={FormControl}>
                    <TextField
                        select
                        name="workflowTypeVersion"
                        label={`${workflowType} version`}
                        value={workflowTypeVersion}
                        onChange={handleInputChange}
                    >
                        {workflowTypeVersionMap[workflowType].map((version) => (
                            <MenuItem key={version} value={version}>
                                {version}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={12} md={8} component={FormControl}>
                    <TextField
                        name="workflowUrl"
                        label="Workflow definition URL"
                        type="url"
                        inputProps={{ pattern: 'https?://.+' }}
                        InputLabelProps={{
                            disableAnimation: true,
                            shrink: true,
                        }}
                        value={workflowUrl}
                        onChange={handleInputChange}
                    />
                </Grid>
                <Grid item xs={12} md={5} component={FormControl}>
                    <TextField
                        label="Workflow definition (.wdl)"
                        InputLabelProps={{
                            disableAnimation: true,
                            shrink: true,
                        }}
                        InputProps={{
                            className: classes.fileInputContainer,
                            inputComponent: SingleFileUpload,
                            inputProps: { accept: '.wdl' },
                            inputRef: workflowSourceRef,
                        }}
                    />
                </Grid>
                <Grid item xs={12} md={5} component={FormControl}>
                    <TextField
                        label="Input definition (.json)"
                        InputLabelProps={{
                            disableAnimation: true,
                            shrink: true,
                        }}
                        InputProps={{
                            className: classes.fileInputContainer,
                            inputComponent: SingleFileUpload,
                            inputProps: { accept: '.json' },
                            inputRef: workflowInputRef,
                        }}
                    />
                </Grid>
                <Grid item xs={12} md={1} component={FormControl}>
                    <Button type="reset" variant="contained" color="secondary">
                        Reset
                    </Button>
                </Grid>
                <Grid item xs={12} md={1} component={FormControl}>
                    <Button type="submit" variant="contained" color="secondary">
                        Submit
                    </Button>
                </Grid>
            </Grid>
            {womResultSummary || womResultDownloadUrl ? (
                <div>
                    <Typography component="h4" variant="h6" color="secondary">
                        <Box textAlign="left">
                            <span>WOM Result</span>
                            {womResultDownloadUrl ? (
                                <LinkStyle
                                    download="wom_result.json"
                                    href={womResultDownloadUrl}
                                >
                                    <GetAppIcon
                                        className={classes.alignedIcon}
                                    />
                                </LinkStyle>
                            ) : null}
                        </Box>
                    </Typography>
                    <SimpleObjectTable obj={womResultSummary} />
                </div>
            ) : womRequested ? (
                <CircularProgress />
            ) : null}
        </React.Fragment>
    );
};
export default WomTool;
