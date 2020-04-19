import React, { useState, useEffect } from 'react';
import { useAuth0 } from '../auth';
import { useApp } from '../App';
import { Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Divider from '@material-ui/core/Divider';
import LinkStyle from '@material-ui/core/Link';

const useStyles = makeStyles((theme) => ({
    seeMore: {
        marginTop: theme.spacing(3),
    },
}));

const workflowColumns = [
    'id',
    'name',
    'submission',
    'start',
    'end',
    'status',
    'metadataArchiveStatus',
];

const WorkflowList = () => {
    const { authorizedFetch } = useAuth0();
    const { apiVersion, setAppBarTitle } = useApp();
    useEffect(() => setAppBarTitle('Workflows'));
    const classes = useStyles();
    const [workflows, setWorkflows] = useState([]);
    useEffect(() => {
        authorizedFetch(`/api/workflows/${apiVersion}/query`)
            .then((res) => res.json())
            .then((res) => setWorkflows(res.results))
            .catch((err) => console.log(err));
    }, [authorizedFetch, apiVersion]);
    const [rowCount, setRowCount] = useState(5);
    const addRows = () => setRowCount(rowCount + 5);
    const maxRows = () => setRowCount(workflows.length);
    const resetRows = () => setRowCount(5);

    return (
        <React.Fragment>
            {workflows.length > 0 ? (
                <React.Fragment>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {workflowColumns.map((col) => (
                                    <TableCell key={col}>
                                        <strong>{col}</strong>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {workflows.slice(0, rowCount).map((workflow) => (
                                <TableRow key={workflow.id}>
                                    {workflowColumns.map((col) => (
                                        <TableCell key={col}>
                                            {col === 'id' ? (
                                                <LinkStyle
                                                    component={Link}
                                                    to={`/workflows/version/${workflow[col]}`}
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
export default WorkflowList;
