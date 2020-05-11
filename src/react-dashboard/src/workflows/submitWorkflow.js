import React, { useEffect, useRef, useState } from 'react';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import MenuItem from '@material-ui/core/MenuItem';
import { SingleFileUpload } from '../utils';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import { useApp } from '../App';
import { useAuth0 } from '../auth';

const useStyles = makeStyles((theme) => ({
    formContainer: {
        margin: theme.spacing(3),
        width: '96%',
        alignItems: 'flex-end',
        justifyContent: 'center',
        borderWidth: '30px 0 30px 0',
        borderStyle: 'solid',
        borderImage:
            'repeating-linear-gradient(60deg, black, black 35px, #ff0 35px, #ff0 70px) 60',
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
    useEffect(
        () => setAppBarTitle('Submit a Workflow (Construction in progress)'),
        [setAppBarTitle],
    );

    // Parameters in form
    const [workflowType, setWorkflowType] = useState('WDL');
    const [workflowTypeVersion, setWorkflowTypeVersion] = useState(
        workflowTypeVersionMap[workflowType][0],
    );
    const [workflowUrl, setWorkflowUrl] = useState('');
    const workflowSourceRef = useRef();
    const workflowInputRef = useRef();

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
    const resetSubmissionForm = () => {
        workflowSourceRef.current.reset();
        workflowInputRef.current.reset();
    };
    const submitWorkflow = (event) => {
        event.preventDefault();
        const workflowData = new FormData();
        workflowData.append('workflowType', workflowType);
        workflowData.append('workflowTypeVersion', workflowTypeVersion);
        if (workflowUrl) {
            workflowData.append('workflowUrl', workflowUrl);
        }
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
        authorizedFetch(`/api/workflows/${apiVersion}/backends`, {
            method: 'POST',
            body: workflowData,
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(res.statusText);
                }
                return res.json();
            })
            .then((res) => console.log(res))
            .catch((err) => console.error(err));
        for (var key of workflowData.entries()) {
            console.log(key[0] + ', ' + key[1]);
        }
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
        </React.Fragment>
    );
};
export default SubmitWorkflow;
