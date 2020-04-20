import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth0 } from '../auth';
import { useApp } from '../App';
import {
    WindowScroller,
    AutoSizer,
    Column,
    Table,
    SortDirection,
} from 'react-virtualized';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import LinkStyle from '@material-ui/core/Link';
import CircularProgress from '@material-ui/core/CircularProgress';
import TableCell from '@material-ui/core/TableCell';
import TableSortLabel from '@material-ui/core/TableSortLabel';

const useStyles = makeStyles((theme) => ({
    flexContainer: {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
    },
    tableRowHover: {
        '&:hover': {
            backgroundColor: theme.palette.grey[200],
        },
    },
    tableCell: {
        flex: 1,
    },
}));

const defaultSortDirection = SortDirection.DESC;

const createDefaultComparator = (property) => (
    a,
    b,
    sortDirection = SortDirection.DESC,
) => {
    const descOrder = a[property] > b[property] ? -1 : 1;
    return sortDirection === SortDirection.DESC ? descOrder : -descOrder;
};

const numberComparator = (a, b, sortDirection = SortDirection.DESC) => {
    if (isNaN(a) && !isNaN(b)) return 1;
    if (!isNaN(a) && isNaN(b)) return -1;
    if (isNaN(a) && isNaN(b)) return 0;
    const descOrder = Math.sign(b - a);
    return sortDirection === SortDirection.DESC ? descOrder : -descOrder;
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
        width: 200,
    },
    name: {
        label: 'Name',
    },
    submission: {
        label: 'Submitted',
        display: (workflow) =>
            workflow.submission
                ? new Date(workflow.submission).toLocaleString()
                : null,
        comparator: (a, b, sortDirection = SortDirection.DESC) =>
            numberComparator(
                Date.parse(a.submission),
                Date.parse(b.submission),
                sortDirection,
            ),
    },
    waiting: {
        label: 'Waited',
        display: (workflow) =>
            workflow.start && workflow.submission
                ? getTimeString(
                    Date.parse(workflow.start) -
                          Date.parse(workflow.submission),
                )
                : null,
        comparator: (a, b, sortDirection = SortDirection.DESC) =>
            numberComparator(
                Date.parse(a.start) - Date.parse(a.submission),
                Date.parse(b.start) - Date.parse(b.submission),
                sortDirection,
            ),
    },
    start: {
        label: 'Start',
        display: (workflow) =>
            workflow.start ? new Date(workflow.start).toLocaleString() : null,
        comparator: (a, b, sortDirection = SortDirection.DESC) =>
            numberComparator(
                Date.parse(a.start),
                Date.parse(b.start),
                sortDirection,
            ),
    },
    end: {
        label: 'End',
        display: (workflow) =>
            workflow.end ? new Date(workflow.end).toLocaleString() : null,
        comparator: (a, b, sortDirection = SortDirection.DESC) =>
            numberComparator(
                Date.parse(a.end),
                Date.parse(b.end),
                sortDirection,
            ),
    },
    elapse: {
        label: 'Elapse',
        display: (workflow) =>
            workflow.end && workflow.start
                ? getTimeString(
                    Date.parse(workflow.end) - Date.parse(workflow.start),
                )
                : null,
        comparator: (a, b, sortDirection = SortDirection.DESC) =>
            numberComparator(
                Date.parse(a.end) - Date.parse(a.start),
                Date.parse(b.end) - Date.parse(b.start),
                sortDirection,
            ),
    },
    status: {
        label: 'Status',
    },
    metadataArchiveStatus: {
        label: 'Metadata Archive',
    },
};

const WorkflowTable = ({ headerHeight = 50, rowHeight = 50 }) => {
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

    const headerRenderer = ({ label, dataKey, sortBy, sortDirection }) => {
        return (
            <TableCell
                component="div"
                className={clsx(classes.tableCell, classes.flexContainer)}
                variant="head"
                style={{ height: headerHeight }}
                align="left"
                sortDirection={sortDirection.toLowerCase()}
            >
                <TableSortLabel
                    active={sortBy === dataKey}
                    direction={
                        sortBy === dataKey
                            ? sortDirection.toLowerCase()
                            : defaultSortDirection.toLowerCase()
                    }
                >
                    <strong>{label}</strong>
                </TableSortLabel>
            </TableCell>
        );
    };
    headerRenderer.propTypes = {
        label: PropTypes.string.isRequired,
        dataKey: PropTypes.string.isRequired,
        sortBy: PropTypes.string.isRequired,
        sortDirection: PropTypes.oneOf([SortDirection.ASC, SortDirection.DESC])
            .isRequired,
    };

    const cellDataGetter = ({ dataKey, rowData }) => {
        return workflowColumns[dataKey].getData
            ? workflowColumns[dataKey].getData(rowData)
            : rowData[dataKey];
    };
    cellDataGetter.propTypes = {
        dataKey: PropTypes.string.isRequired,
        rowData: PropTypes.object.isRequired,
    };

    const cellRenderer = ({ dataKey, rowData, cellData }) => {
        return (
            <TableCell
                component="div"
                className={clsx(classes.tableCell, classes.flexContainer)}
                variant="body"
                style={{ height: rowHeight }}
                align="left"
            >
                {workflowColumns[dataKey].display
                    ? workflowColumns[dataKey].display(rowData)
                    : cellData}
            </TableCell>
        );
    };
    cellRenderer.propTypes = {
        dataKey: PropTypes.string.isRequired,
        rowData: PropTypes.object.isRequired,
        cellData: PropTypes.any,
    };

    const [sortBy, setSortBy] = useState();
    const [sortDirection, setSortDirection] = useState(defaultSortDirection);
    const workflowSort = ({ sortBy, sortDirection }) => {
        setSortBy(sortBy);
        setSortDirection(sortDirection);
        const stabilizedWorkflows = workflows.map((el, index) => [el, index]);
        const comparator =
            workflowColumns[sortBy].comparator ||
            createDefaultComparator(sortBy);
        stabilizedWorkflows.sort(
            (a, b) => comparator(a[0], b[0], sortDirection) || a[1] - b[1],
        );
        setWorkflows(stabilizedWorkflows.map((el) => el[0]));
    };

    return loadingWorkflows ? (
        <CircularProgress />
    ) : workflows.length < 1 ? (
        <span>No workflow found.</span>
    ) : (
        <WindowScroller>
            {({ height }) => (
                <AutoSizer disableHeight>
                    {({ width }) => (
                        <Table
                            rowCount={workflows.length}
                            rowGetter={({ index }) => workflows[index]}
                            height={height - 128}
                            width={width}
                            rowHeight={rowHeight}
                            gridStyle={{
                                direction: 'inherit',
                            }}
                            headerHeight={headerHeight}
                            rowClassName={clsx(
                                classes.flexContainer,
                                classes.tableRowHover,
                            )}
                            sort={workflowSort}
                            sortBy={sortBy}
                            sortDirection={sortDirection}
                        >
                            {Object.keys(workflowColumns).map((colKey) => {
                                return (
                                    <Column
                                        key={colKey}
                                        headerRenderer={headerRenderer}
                                        className={classes.flexContainer}
                                        cellRenderer={cellRenderer}
                                        cellDataGetter={cellDataGetter}
                                        dataKey={colKey}
                                        width={
                                            workflowColumns[colKey].width || 150
                                        }
                                        label={
                                            workflowColumns[colKey].label || ''
                                        }
                                        defaultSortDirection={
                                            defaultSortDirection
                                        }
                                    />
                                );
                            })}
                        </Table>
                    )}
                </AutoSizer>
            )}
        </WindowScroller>
    );
};
WorkflowTable.propTypes = {
    headerHeight: PropTypes.number,
    rowHeight: PropTypes.number,
};
export default WorkflowTable;
