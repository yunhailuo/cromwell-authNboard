import React, { useEffect, useRef, useState } from 'react';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from '@material-ui/core/Grid';
import { Link } from 'react-router-dom';
import LinkStyle from '@material-ui/core/Link';
import MenuItem from '@material-ui/core/MenuItem';
import { SingleFileUpload } from '../utils';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { useApp } from '../App';
import { useAuth0 } from '../auth';

const useStyles = makeStyles((theme) => ({
    formContainer: {
        margin: theme.spacing(3),
        width: '96%',
        alignItems: 'flex-end',
        justifyContent: 'center',
        borderWidth: '10px 0 10px 0',
        borderStyle: 'solid',
        borderImage:
            'repeating-linear-gradient(60deg, black, black 35px, #ff0 35px, #ff0 70px) 45',
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
}));

const workflowTypeVersionMap = {
    WDL: ['draft-2', '1.0'],
    CWL: ['v1.0'],
};

const SubmitWorkflow = () => {
    const classes = useStyles();
    const { authorizedFetch } = useAuth0();
    const { apiVersion, setAppBarTitle } = useApp();
    useEffect(() => setAppBarTitle('Submit a Workflow (experimental)'), [
        setAppBarTitle,
    ]);

    // Parameters in form
    const [workflowType, setWorkflowType] = useState('WDL');
    const [workflowTypeVersion, setWorkflowTypeVersion] = useState(
        workflowTypeVersionMap[workflowType][0],
    );
    const [workflowOnHold, setWorkflowOnHold] = useState(false);
    const [workflowRoot, setWorkflowRoot] = useState('');
    const [workflowUrl, setWorkflowUrl] = useState('');
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
        case 'workflowOnHold':
            setWorkflowOnHold(!workflowOnHold);
            break;
        case 'workflowRoot':
            setWorkflowRoot(target.value);
            break;
        case 'workflowUrl':
            setWorkflowUrl(target.value);
            break;
        default:
            console.log(event);
        }
    };

    // File input references
    const workflowSourceRef = useRef();
    const workflowInputRef = useRef();
    const workflowOptionsRef = useRef();
    const workflowLabelsRef = useRef();
    const workflowDependenciesRef = useRef();

    const [submitting, setSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState();
    const resetSubmissionForm = () => {
        setWorkflowType('WDL');
        setWorkflowTypeVersion(workflowTypeVersionMap[workflowType][0]);
        setWorkflowOnHold(false);
        setWorkflowRoot('');
        setWorkflowUrl('');
        workflowSourceRef.current.reset();
        workflowInputRef.current.reset();
        workflowOptionsRef.current.reset();
        workflowLabelsRef.current.reset();
        workflowDependenciesRef.current.reset();
        setSubmitting(false);
        setSubmissionResult();
    };
    const submitWorkflow = (event) => {
        event.preventDefault();
        setSubmitting(true);

        const workflowData = new FormData();
        workflowData.append('workflowType', workflowType);
        workflowData.append('workflowTypeVersion', workflowTypeVersion);
        workflowData.append('workflowOnHold', workflowOnHold);
        if (workflowType === 'CWL') {
            workflowData.append('workflowRoot', workflowRoot);
        }
        if (workflowUrl) {
            workflowData.append('workflowUrl', workflowUrl);
        }

        // File inputs
        if (workflowSourceRef.current.files.length > 0) {
            workflowData.append(
                'workflowSource',
                workflowSourceRef.current.files[0],
            );
        }
        if (workflowInputRef.current.files.length > 0) {
            workflowData.append(
                'workflowInputs',
                workflowInputRef.current.files[0],
            );
        }
        if (workflowOptionsRef.current.files.length > 0) {
            workflowData.append(
                'workflowOptions',
                workflowOptionsRef.current.files[0],
            );
        }
        if (workflowLabelsRef.current.files.length > 0) {
            workflowData.append('labels', workflowLabelsRef.current.files[0]);
        }
        if (workflowDependenciesRef.current.files.length > 0) {
            workflowData.append(
                'workflowDependencies',
                workflowDependenciesRef.current.files[0],
            );
        }

        authorizedFetch(`/api/workflows/${apiVersion}`, {
            method: 'POST',
            body: workflowData,
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(res.statusText);
                }
                return res.json();
            })
            .then((res) => {
                setSubmissionResult(
                    <Typography component="h5">
                        <span>Submitted successfully: </span>
                        <LinkStyle
                            component={Link}
                            to={`/workflows/version/${res.id}`}
                        >
                            {res.id}
                        </LinkStyle>
                        <span>{` (${res.status})`}</span>
                    </Typography>,
                );
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
                noValidate
                autoComplete="off"
                onSubmit={submitWorkflow}
                onReset={resetSubmissionForm}
            >
                <Grid
                    item
                    xs={12}
                    md={workflowType === 'CWL' ? 3 : 4}
                    component={FormControl}
                >
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
                <Grid
                    item
                    xs={12}
                    md={workflowType === 'CWL' ? 3 : 4}
                    component={FormControl}
                >
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
                <Grid
                    item
                    xs={12}
                    md={workflowType === 'CWL' ? 3 : 4}
                    component={FormControl}
                >
                    <FormControlLabel
                        control={
                            <Switch
                                checked={workflowOnHold}
                                onChange={handleInputChange}
                                name="workflowOnHold"
                            />
                        }
                        label="On hold"
                        labelPlacement="top"
                    />
                </Grid>
                {workflowType === 'CWL' ? (
                    <Grid item xs={12} md={3} component={FormControl}>
                        <TextField
                            name="workflowRoot"
                            label="Workflow Root"
                            InputLabelProps={{
                                disableAnimation: true,
                                shrink: true,
                            }}
                            value={workflowRoot}
                            onChange={handleInputChange}
                        />
                    </Grid>
                ) : null}
                <Grid item xs={12} md={6} component={FormControl}>
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
                <Grid item xs={12} md={6} component={FormControl}>
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
                <Grid item xs={12} md={6} component={FormControl}>
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
                <Grid item xs={12} md={6} component={FormControl}>
                    <TextField
                        label="Labels (.json)"
                        InputLabelProps={{
                            disableAnimation: true,
                            shrink: true,
                        }}
                        InputProps={{
                            className: classes.fileInputContainer,
                            inputComponent: SingleFileUpload,
                            inputProps: { accept: '.json' },
                            inputRef: workflowLabelsRef,
                        }}
                    />
                </Grid>
                <Grid item xs={12} md={6} component={FormControl}>
                    <TextField
                        label="Options (.json)"
                        InputLabelProps={{
                            disableAnimation: true,
                            shrink: true,
                        }}
                        InputProps={{
                            className: classes.fileInputContainer,
                            inputComponent: SingleFileUpload,
                            inputProps: { accept: '.json' },
                            inputRef: workflowOptionsRef,
                        }}
                    />
                </Grid>
                <Grid item xs={12} md={6} component={FormControl}>
                    <TextField
                        label="Dependencies (.zip)"
                        InputLabelProps={{
                            disableAnimation: true,
                            shrink: true,
                        }}
                        InputProps={{
                            className: classes.fileInputContainer,
                            inputComponent: SingleFileUpload,
                            inputProps: { accept: '.zip' },
                            inputRef: workflowDependenciesRef,
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
            {submissionResult ? (
                <div>{submissionResult}</div>
            ) : submitting ? (
                <CircularProgress />
            ) : null}
        </React.Fragment>
    );
};
export default SubmitWorkflow;
