import React, { useState } from 'react';
import { useAuth0 } from './auth';
import { useApi } from './App';
import { makeStyles } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';

const useStyles = makeStyles((theme) => ({
    root: {
        '& > *': {
            margin: theme.spacing(1),
        },
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
}));

const workflowTypeVersionMap = {
    WDL: ['draft-2', '1.0'],
    CWL: ['v1.0'],
};

const WomTool = () => {
    const { authorizedFetch } = useAuth0();
    const { apiVersion } = useApi();

    const [workflowType, setWorkflowType] = useState('WDL');
    const [workflowTypeVersion, setWorkflowTypeVersion] = useState(
        workflowTypeVersionMap[workflowType][0],
    );
    const [workflowUrl, setWorkflowUrl] = useState();
    const [womRequested, setWomRequested] = useState(false);
    const [womResult, setWomResult] = useState();

    const workflowTypeChange = (event) => {
        setWorkflowType(event.target.value);
        setWorkflowTypeVersion(workflowTypeVersionMap[event.target.value][0]);
    };
    const workflowTypeVersionChange = (event) => {
        setWorkflowTypeVersion(event.target.value);
    };
    const workflowUrlChange = (event) => {
        setWorkflowUrl(event.target.value);
    };
    const submittable = () =>
        Boolean(
            apiVersion && workflowType && workflowTypeVersion && workflowUrl,
        );
    const submitWom = (event) => {
        setWomResult();
        setWomRequested(true);
        const womFormData = new FormData();
        womFormData.append('version', apiVersion);
        womFormData.append('workflowType', workflowType);
        womFormData.append('workflowTypeVersion', workflowTypeVersion);
        womFormData.append('workflowUrl', workflowUrl);
        authorizedFetch(`/api/womtool/${apiVersion}/describe`, {
            method: 'POST',
            body: womFormData,
        })
            .then((res) => res.json())
            .then((res) => setWomResult(JSON.stringify(res)));
        event.preventDefault();
    };

    const classes = useStyles();

    return (
        <React.Fragment>
            <form
                className={classes.root}
                noValidate
                autoComplete="off"
                onSubmit={submitWom}
            >
                <FormControl disabled className={classes.formControl}>
                    <InputLabel htmlFor="api-version">Version</InputLabel>
                    <Input id="api-version" value={apiVersion} />
                    <FormHelperText>Set by server</FormHelperText>
                </FormControl>
                <FormControl className={classes.formControl}>
                    <InputLabel id="workflow-type-label">
                        Workflow type
                    </InputLabel>
                    <Select
                        labelId="workflow-type-label"
                        value={workflowType}
                        onChange={workflowTypeChange}
                    >
                        {Object.keys(workflowTypeVersionMap).map((typ) => (
                            <MenuItem key={typ} value={typ}>
                                {typ}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl className={classes.formControl}>
                    <InputLabel id="workflow-type-version-label">
                        {workflowType} version
                    </InputLabel>
                    <Select
                        labelId="workflow-type-version-label"
                        value={workflowTypeVersion}
                        onChange={workflowTypeVersionChange}
                    >
                        {workflowTypeVersionMap[workflowType].map((version) => (
                            <MenuItem key={version} value={version}>
                                {version}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl className={classes.formControl}>
                    <InputLabel htmlFor="workflow-url">Workflow URL</InputLabel>
                    <Input
                        required
                        id="workflow-url"
                        value={workflowUrl}
                        onChange={workflowUrlChange}
                    />
                    <FormHelperText>Input</FormHelperText>
                </FormControl>
                <FormControl className={classes.formControl}>
                    <Button
                        disabled={!submittable()}
                        type="submit"
                        variant="contained"
                        color="secondary"
                    >
                        Submit
                    </Button>
                </FormControl>
            </form>
            {womResult ? (
                <div>{womResult}</div>
            ) : womRequested ? (
                <CircularProgress />
            ) : null}
        </React.Fragment>
    );
};
export default WomTool;
