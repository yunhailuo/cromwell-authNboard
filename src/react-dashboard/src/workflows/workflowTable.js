import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth0 } from '../auth';
import { useApp } from '../App';
import { Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import TableContainer from '@material-ui/core/TableContainer';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TableRow from '@material-ui/core/TableRow';
import TablePagination from '@material-ui/core/TablePagination';
import LinkStyle from '@material-ui/core/Link';

const useStyles = makeStyles((theme) => ({
    paper: {
        width: '100%',
        marginBottom: theme.spacing(2),
    },
    visuallyHidden: {
        border: 0,
        clip: 'rect(0 0 0 0)',
        height: 1,
        margin: -1,
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        top: 20,
        width: 1,
    },
}));

const createDefaultComparator = (property) => (a, b, direction = 'desc') => {
    const descOrder = a[property] > b[property] ? -1 : 1;
    return direction === 'desc' ? descOrder : -descOrder;
};

const numberComparator = (a, b, direction = 'desc') => {
    if (isNaN(a) && !isNaN(b)) return 1;
    if (!isNaN(a) && isNaN(b)) return -1;
    if (isNaN(a) && isNaN(b)) return 0;
    const descOrder = Math.sign(b - a);
    return direction === 'desc' ? descOrder : -descOrder;
};

const getTimeString = (milliseconds) => {
    const seconds = milliseconds / 1000;
    const minutes = seconds / 60;
    if (minutes < 1) return seconds.toFixed(1) + ' sec';
    const hours = minutes / 60;
    if (hours < 1) return minutes.toFixed(1) + ' min';
    return hours.toFixed(1) + ' hr';
};

const workflowColumns = {
    id: {
        label: 'ID',
        display: function idDisplay(workflow) {
            return (
                <LinkStyle
                    component={Link}
                    to={`/workflows/version/${workflow.id}`}
                >
                    {workflow.id}
                </LinkStyle>
            );
        },
    },
    name: {
        label: 'Name',
        getValue: (workflow) => workflow.name,
    },
    submission: {
        label: 'Submitted',
        display: (workflow) =>
            workflow.submission
                ? new Date(workflow.submission).toLocaleString()
                : null,
        comparator: (a, b, direction = 'desc') =>
            numberComparator(
                Date.parse(a.submission),
                Date.parse(b.submission),
                direction,
            ),
    },
    waiting: {
        label: 'Waiting time',
        display: (workflow) =>
            workflow.start && workflow.submission
                ? getTimeString(
                    Date.parse(workflow.start) -
                          Date.parse(workflow.submission),
                )
                : null,
        comparator: (a, b, direction = 'desc') =>
            numberComparator(
                Date.parse(a.start) - Date.parse(a.submission),
                Date.parse(b.start) - Date.parse(b.submission),
                direction,
            ),
    },
    start: {
        label: 'Start',
        display: (workflow) =>
            workflow.start ? new Date(workflow.start).toLocaleString() : null,
        comparator: (a, b, direction = 'desc') =>
            numberComparator(
                Date.parse(a.start),
                Date.parse(b.start),
                direction,
            ),
    },
    end: {
        label: 'End',
        display: (workflow) =>
            workflow.end ? new Date(workflow.end).toLocaleString() : null,
        comparator: (a, b, direction = 'desc') =>
            numberComparator(Date.parse(a.end), Date.parse(b.end), direction),
    },
    elapse: {
        label: 'Elapse',
        display: (workflow) =>
            workflow.end && workflow.start
                ? getTimeString(
                    Date.parse(workflow.end) - Date.parse(workflow.start),
                )
                : null,
        comparator: (a, b, direction = 'desc') =>
            numberComparator(
                Date.parse(a.end) - Date.parse(a.start),
                Date.parse(b.end) - Date.parse(b.start),
                direction,
            ),
    },
    status: {
        label: 'Status',
        getValue: (workflow) => workflow.status,
    },
    metadataArchiveStatus: {
        label: 'Metadata Archive Status',
        getValue: (workflow) => workflow.metadataArchiveStatus,
    },
};

function stableSort(array, comparator, direction = 'desc') {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort(
        (a, b) => comparator(a[0], b[0], direction) || a[1] - b[1],
    );
    return stabilizedThis.map((el) => el[0]);
}

const WorkflowTableHead = ({ classes, order, orderBy, onRequestSort }) => {
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                {Object.keys(workflowColumns).map((colKey) => (
                    <TableCell
                        key={colKey}
                        sortDirection={orderBy === colKey ? order : false}
                    >
                        <TableSortLabel
                            active={orderBy === colKey}
                            direction={orderBy === colKey ? order : 'desc'}
                            onClick={createSortHandler(colKey)}
                        >
                            <strong>{workflowColumns[colKey].label}</strong>
                            {orderBy === colKey ? (
                                <span className={classes.visuallyHidden}>
                                    {order === 'desc'
                                        ? 'sorted descending'
                                        : 'sorted ascending'}
                                </span>
                            ) : null}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
};

WorkflowTableHead.propTypes = {
    classes: PropTypes.object.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    order: PropTypes.oneOf(['asc', 'desc']).isRequired,
    orderBy: PropTypes.string.isRequired,
};

const WorkflowTable = () => {
    const classes = useStyles();
    const { authorizedFetch } = useAuth0();
    const { apiVersion, setAppBarTitle } = useApp();
    useEffect(() => setAppBarTitle('Workflows'));

    const [loadingWorkflows, setLoadingWorkflows] = useState(true);
    const [workflows, setWorkflows] = useState([]);
    useEffect(() => {
        authorizedFetch(`/api/workflows/${apiVersion}/query`)
            .then((res) => res.json())
            .then((res) => setWorkflows(res.results))
            .catch((err) => console.log(err))
            .finally(() => setLoadingWorkflows(false));
    }, [authorizedFetch, apiVersion]);

    const [order, setOrder] = React.useState('desc');
    const [orderBy, setOrderBy] = React.useState('submission');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy !== property || order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const emptyRows =
        rowsPerPage -
        Math.min(rowsPerPage, workflows.length - page * rowsPerPage);

    return workflows.length > 0 ? (
        <React.Fragment>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, { value: -1, label: 'All' }]}
                component="div"
                count={workflows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onChangePage={handleChangePage}
                onChangeRowsPerPage={handleChangeRowsPerPage}
            />
            <TableContainer>
                <Table size="medium">
                    <WorkflowTableHead
                        classes={classes}
                        order={order}
                        orderBy={orderBy}
                        onRequestSort={handleRequestSort}
                    />
                    <TableBody>
                        {stableSort(
                            workflows,
                            workflowColumns[orderBy].comparator ||
                                createDefaultComparator(orderBy),
                            order,
                        )
                            .slice(
                                page * rowsPerPage,
                                page * rowsPerPage + rowsPerPage,
                            )
                            .map((workflow) => (
                                <TableRow hover key={workflow.id}>
                                    {Object.keys(workflowColumns).map(
                                        (colKey) => (
                                            <TableCell key={colKey}>
                                                {workflowColumns[colKey].display
                                                    ? workflowColumns[
                                                        colKey
                                                    ].display(workflow)
                                                    : workflowColumns[colKey]
                                                        .getValue
                                                        ? workflowColumns[
                                                            colKey
                                                        ].getValue(workflow)
                                                        : null}
                                            </TableCell>
                                        ),
                                    )}
                                </TableRow>
                            ))}
                        {emptyRows > 0 && (
                            <TableRow style={{ height: 53 * emptyRows }}>
                                <TableCell
                                    colSpan={
                                        Object.keys(workflowColumns).length
                                    }
                                />
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </React.Fragment>
    ) : loadingWorkflows ? (
        <CircularProgress />
    ) : (
        <div>No workflows found.</div>
    );
};
export default WorkflowTable;
