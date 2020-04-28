import { AutoSizer, Column, Table, WindowScroller } from 'react-virtualized';
import React, { useEffect, useState } from 'react';
import { SortDirection, getTimeString, numberComparator } from '../utils';
import CircularProgress from '@material-ui/core/CircularProgress';
import { Link } from 'react-router-dom';
import LinkStyle from '@material-ui/core/Link';
import PropTypes from 'prop-types';
import TableCell from '@material-ui/core/TableCell';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Tooltip from '@material-ui/core/Tooltip';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { useApp } from '../App';
import { useAuth0 } from '../auth';

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
        width: '100%',
    },
    truncated: {
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
}));

const defaultSortDirection = SortDirection.DESC;

const defaultComparator = (a, b, sortDirection = SortDirection.DESC) => {
    if (a && !b) return -1;
    if (!a && b) return 1;
    if (!a && !b) return 0;
    const descOrder = a > b ? -1 : a === b ? 0 : 1;
    return sortDirection === SortDirection.DESC ? descOrder : -descOrder;
};

const TruncatedWithTooltip = ({ label }) => {
    const classes = useStyles();

    return (
        <Tooltip title={label} className={classes.truncated}>
            <div>{label}</div>
        </Tooltip>
    );
};
TruncatedWithTooltip.propTypes = {
    label: PropTypes.string.isRequired,
};

const workflowColumns = {
    id: {
        label: 'ID',
        display: function idDisplay(data) {
            return (
                <LinkStyle component={Link} to={`/workflows/version/${data}`}>
                    {data}
                </LinkStyle>
            );
        },
        width: 200,
    },
    name: {
        label: 'Name',
        width: 100,
    },
    caperStrLabel: {
        label: 'Caper Label',
        getData: (workflow) =>
            (workflow.labels && workflow.labels['caper-str-label']) || '',
        display: function longStringDisplay(data) {
            return <TruncatedWithTooltip label={data} />;
        },
        width: 150,
    },
    submission: {
        label: 'Submitted',
        getData: (workflow) => Date.parse(workflow.submission),
        display: (data) => (data ? new Date(data).toLocaleString() : null),
        comparator: numberComparator,
    },
    waiting: {
        label: 'Waited',
        getData: (workflow) =>
            Date.parse(workflow.start) - Date.parse(workflow.submission),
        display: (data) => getTimeString(data),
        comparator: numberComparator,
        width: 100,
    },
    start: {
        label: 'Start',
        getData: (workflow) => Date.parse(workflow.start),
        display: (data) => (data ? new Date(data).toLocaleString() : null),
        comparator: numberComparator,
    },
    end: {
        label: 'End',
        getData: (workflow) => Date.parse(workflow.end),
        display: (data) => (data ? new Date(data).toLocaleString() : null),
        comparator: numberComparator,
    },
    elapse: {
        label: 'Elapse',
        getData: (workflow) =>
            Date.parse(workflow.end) - Date.parse(workflow.start),
        display: (data) => getTimeString(data),
        comparator: numberComparator,
        width: 100,
    },
    status: {
        label: 'Status',
    },
};

const WorkflowTable = ({ headerHeight = 50, rowHeight = 50 }) => {
    const classes = useStyles();
    const { authorizedFetch } = useAuth0();
    const { apiVersion, setAppBarTitle } = useApp();
    useEffect(() => setAppBarTitle('Workflows'), [setAppBarTitle]);

    const [loadingWorkflows, setLoadingWorkflows] = useState(true);
    const [workflows, setWorkflows] = useState([]);
    useEffect(() => {
        authorizedFetch(
            `/api/workflows/${apiVersion}/query?additionalQueryResultFields=labels`,
        )
            .then((res) => res.json())
            .then((res) => {
                setAppBarTitle(`${res.results.length} workflows`);
                setWorkflows(res.results);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoadingWorkflows(false));
    }, [authorizedFetch, apiVersion, setAppBarTitle]);

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

    const cellRenderer = ({ dataKey, cellData }) => {
        return (
            <TableCell
                component="div"
                className={clsx(classes.tableCell, classes.flexContainer)}
                variant="body"
                style={{ height: rowHeight }}
                align="left"
            >
                {workflowColumns[dataKey].display
                    ? workflowColumns[dataKey].display(cellData)
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
            workflowColumns[sortBy].comparator || defaultComparator;
        stabilizedWorkflows.sort(
            (a, b) =>
                comparator(
                    cellDataGetter({ dataKey: sortBy, rowData: a[0] }),
                    cellDataGetter({ dataKey: sortBy, rowData: b[0] }),
                    sortDirection,
                ) || a[1] - b[1],
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
