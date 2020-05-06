import { AutoSizer, Column, Table, WindowScroller } from 'react-virtualized';
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { SortDirection, getTimeString, numberComparator } from '../utils';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import CircularProgress from '@material-ui/core/CircularProgress';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FilterListIcon from '@material-ui/icons/FilterList';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import InputBase from '@material-ui/core/InputBase';
import { Link } from 'react-router-dom';
import LinkStyle from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import PropTypes from 'prop-types';
import ReplayIcon from '@material-ui/icons/Replay';
import SearchIcon from '@material-ui/icons/Search';
import Slider from '@material-ui/core/Slider';
import TableCell from '@material-ui/core/TableCell';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Tooltip from '@material-ui/core/Tooltip';
import ViewListIcon from '@material-ui/icons/ViewList';
import { arrayEqual } from '../utils';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { useApp } from '../App';
import { useAuth0 } from '../auth';

const useStyles = makeStyles((theme) => ({
    tableControl: {
        display: 'flex',
        justifyContent: 'flex-end',
    },
    flexContainer: {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
    },
    fixedWidthFilter: {
        width: 200,
    },
    filterItems: {
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(2),
    },
    filterItemCenter: {
        alignItems: 'center',
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

const defaultColumns = [
    'id',
    'name',
    'caperStrLabel',
    'submission',
    'start',
    'elapse',
    'status',
];

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
    },
    caperStrLabel: {
        label: 'Caper Label',
        getData: (workflow) =>
            (workflow.labels && workflow.labels['caper-str-label']) || '',
        display: function longStringDisplay(data) {
            return <TruncatedWithTooltip label={data} />;
        },
    },
    submission: {
        label: 'Submit',
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
    },
    status: {
        label: 'Status',
    },
    metadataArchiveStatus: {
        label: 'Metadata Archive',
    },
};

const TableControl = ({ selectedCols, setSelectedCols }) => {
    const classes = useStyles();
    const [colSelectOpen, setColSelectOpen] = React.useState(false);
    const handleColSelectOpen = () => {
        setColSelectOpen(true);
    };
    const handleColSelect = () => {
        setSelectedCols(checked);
        setColSelectOpen(false);
    };
    const handleCancelSelect = () => {
        setColSelectOpen(false);
    };
    const handleChange = (event) => {
        const targetName = event.target.name;
        const eventIndex = checked.indexOf(targetName);
        if (eventIndex === -1) {
            setChecked(
                Object.keys(workflowColumns).filter(
                    (col) => checked.indexOf(col) !== -1 || col === targetName,
                ),
            );
        } else {
            setChecked(checked.filter((col) => col !== targetName));
        }
    };

    const [checked, setChecked] = React.useState(selectedCols);

    return (
        <React.Fragment>
            <Box className={classes.tableControl}>
                <IconButton onClick={handleColSelectOpen}>
                    <ViewListIcon />
                </IconButton>
            </Box>
            <Dialog open={colSelectOpen} onClose={handleCancelSelect}>
                <DialogTitle>Select and order columns</DialogTitle>
                <DialogContent>
                    <FormControl component="fieldset">
                        <FormGroup>
                            {Object.keys(workflowColumns).map((colKey) => (
                                <FormControlLabel
                                    key={colKey}
                                    control={
                                        <Checkbox
                                            checked={
                                                checked.indexOf(colKey) !== -1
                                            }
                                            onChange={handleChange}
                                            name={colKey}
                                        />
                                    }
                                    label={
                                        workflowColumns[colKey].label || colKey
                                    }
                                />
                            ))}
                        </FormGroup>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleColSelect} color="primary">
                        Ok
                    </Button>
                    <Button onClick={handleCancelSelect} color="primary">
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
};
TableControl.propTypes = {
    selectedCols: PropTypes.arrayOf(PropTypes.string).isRequired,
    setSelectedCols: PropTypes.func.isRequired,
};

const FilterControl = ({ filtered = false, children }) => {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef(null);

    const handleToggle = (event) => {
        event.stopPropagation();
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClickAway = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return;
        }
        setOpen(false);
    };

    // return focus to the button when we transitioned from !open -> open
    const prevOpen = useRef(open);
    useEffect(() => {
        if (prevOpen.current === true && open === false) {
            anchorRef.current.focus();
        }

        prevOpen.current = open;
    }, [open]);

    return (
        <React.Fragment>
            <IconButton
                ref={anchorRef}
                onClick={handleToggle}
                color={filtered ? 'secondary' : 'default'}
            >
                <FilterListIcon fontSize="small" />
            </IconButton>
            <Popper
                open={open}
                anchorEl={anchorRef.current}
                placement="bottom-end"
                onClick={(event) => event.stopPropagation()}
            >
                <Paper>
                    <ClickAwayListener onClickAway={handleClickAway}>
                        {children}
                    </ClickAwayListener>
                </Paper>
            </Popper>
        </React.Fragment>
    );
};
FilterControl.propTypes = {
    filtered: PropTypes.bool,
    children: PropTypes.node,
};

const workflowDataGetter = ({ dataKey: colId, rowData: workflow }) => {
    return workflowColumns[colId].getData
        ? workflowColumns[colId].getData(workflow)
        : workflow[colId];
};

const SelectFilter = React.forwardRef(
    ({ colId, workflows, filters, dispatchFilters }, ref) => {
        const classes = useStyles();
        const allOptionSet = new Set();
        workflows.forEach((workflow) => {
            allOptionSet.add(
                workflowDataGetter({ dataKey: colId, rowData: workflow }) || '',
            );
        });
        const allOptions = Array.from(allOptionSet).sort();
        const [checked, setChecked] = useState(
            (filters[colId] && filters[colId].filterProps) || allOptions,
        );
        const filterFactory = (filterProps) => (workflow) =>
            filterProps.includes(
                workflowDataGetter({ dataKey: colId, rowData: workflow }) || '',
            );
        const handleChange = (event) => {
            const newChecked = checked.includes(event.target.name)
                ? checked.filter((v) => v !== event.target.name)
                : [...checked, event.target.name].sort();
            setChecked(newChecked);
            arrayEqual(newChecked, allOptions)
                ? dispatchFilters({ type: 'REMOVE', colId })
                : dispatchFilters({
                    type: 'UPDATE',
                    colId,
                    filterProps: newChecked,
                    filterFactory: filterFactory,
                });
        };
        const handleSelectAll = () => {
            if (arrayEqual(checked, allOptions)) {
                setChecked([]);
                dispatchFilters({
                    type: 'UPDATE',
                    colId,
                    filterProps: [],
                    filterFactory: filterFactory,
                });
            } else {
                setChecked(allOptions);
                dispatchFilters({ type: 'REMOVE', colId });
            }
        };

        return (
            <FormGroup ref={ref} className={classes.filterItems}>
                <FormControlLabel
                    control={
                        <Checkbox
                            name="Select all"
                            checked={arrayEqual(checked, allOptions)}
                            onChange={handleSelectAll}
                        />
                    }
                    label="Select all"
                />
                {allOptions.map((option) => (
                    <FormControlLabel
                        key={option}
                        control={
                            <Checkbox
                                name={option}
                                checked={checked.includes(option)}
                                onChange={handleChange}
                            />
                        }
                        label={option}
                    />
                ))}
            </FormGroup>
        );
    },
);
SelectFilter.propTypes = {
    colId: PropTypes.string.isRequired,
    workflows: PropTypes.arrayOf(PropTypes.object).isRequired,
    filters: PropTypes.object.isRequired,
    dispatchFilters: PropTypes.func.isRequired,
};
SelectFilter.displayName = 'SelectFilter';

const StringFilter = React.forwardRef(
    ({ colId, filters, dispatchFilters }, ref) => {
        const filterFactory = (filterProps) => (workflow) =>
            (
                workflowDataGetter({
                    dataKey: colId,
                    rowData: workflow,
                }).toLowerCase() || ''
            ).includes(filterProps.toLowerCase());
        const [filterString, setFilterString] = useState(
            filters[colId] ? filters[colId].filterProps || '' : '',
        );
        const handleInputChange = (event) =>
            setFilterString(event.target.value || '');
        const handleSubmit = (event) => {
            event.preventDefault();
            return filterString
                ? dispatchFilters({
                    type: 'UPDATE',
                    colId,
                    filterProps: filterString,
                    filterFactory: filterFactory,
                })
                : filters[colId]
                    ? dispatchFilters({ type: 'REMOVE', colId })
                    : null;
        };
        return (
            <Paper component="form" ref={ref} onSubmit={handleSubmit}>
                <IconButton type="submit" aria-label="search">
                    <SearchIcon />
                </IconButton>
                <InputBase
                    autoFocus
                    value={filterString}
                    onChange={handleInputChange}
                />
            </Paper>
        );
    },
);
StringFilter.propTypes = {
    colId: PropTypes.string.isRequired,
    filters: PropTypes.object.isRequired,
    dispatchFilters: PropTypes.func.isRequired,
};
StringFilter.displayName = 'StringFilter';

const SliderLabelComponent = ({ children, index, open, value }) => (
    <Tooltip
        open={open}
        enterTouchDelay={0}
        placement={index === 0 ? 'top' : 'bottom'}
        title={value}
    >
        {children}
    </Tooltip>
);
SliderLabelComponent.propTypes = {
    children: PropTypes.element.isRequired,
    index: PropTypes.number.isRequired,
    open: PropTypes.bool.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};
const SliderFilter = React.forwardRef(
    ({ colId, workflows, filters, dispatchFilters, valueDisplay }, ref) => {
        const classes = useStyles();
        const sliderRange = workflows.reduce(
            (range, workflow) => {
                const data =
                    workflowDataGetter({ dataKey: colId, rowData: workflow }) ||
                    NaN;
                return [
                    !isNaN(data) && data < range[0] ? data : range[0],
                    !isNaN(data) && data > range[1] ? data : range[1],
                ];
            },
            [+Infinity, -Infinity],
        );
        const filterFactory = (filterProps) => (workflow) => {
            const data = workflowDataGetter({
                dataKey: colId,
                rowData: workflow,
            });
            return (
                !isNaN(data) &&
                data >= Math.min(...filterProps) &&
                data <= Math.max(...filterProps)
            );
        };
        const [value, setValue] = React.useState(
            filters[colId] ? filters[colId].filterProps : sliderRange,
        );
        const handleChange = (event, newValue) => {
            setValue(newValue);
        };
        const handleChangeCommitted = () =>
            arrayEqual(value, sliderRange)
                ? filters[colId]
                    ? dispatchFilters({ type: 'REMOVE', colId })
                    : null
                : dispatchFilters({
                    type: 'UPDATE',
                    colId,
                    filterProps: value,
                    filterFactory: filterFactory,
                });
        const handleReset = () => {
            if (filters[colId]) {
                dispatchFilters({ type: 'REMOVE', colId });
            }
            setValue(sliderRange);
        };

        return (
            <Paper ref={ref} className={classes.fixedWidthFilter}>
                <Grid
                    container
                    spacing={2}
                    className={clsx(
                        classes.filterItems,
                        classes.filterItemCenter,
                    )}
                >
                    <Grid item xs>
                        <Slider
                            min={Math.min(...sliderRange)}
                            max={Math.max(...sliderRange)}
                            value={value}
                            onChange={handleChange}
                            onChangeCommitted={handleChangeCommitted}
                            valueLabelDisplay="on"
                            valueLabelFormat={valueDisplay || ((x) => x)}
                            ValueLabelComponent={SliderLabelComponent}
                        />
                    </Grid>
                    <Grid item>
                        <IconButton onClick={handleReset}>
                            <ReplayIcon color="primary" />
                        </IconButton>
                    </Grid>
                </Grid>
            </Paper>
        );
    },
);
SliderFilter.propTypes = {
    colId: PropTypes.string.isRequired,
    workflows: PropTypes.arrayOf(PropTypes.object).isRequired,
    filters: PropTypes.object.isRequired,
    dispatchFilters: PropTypes.func.isRequired,
    valueDisplay: PropTypes.func,
};
SliderFilter.displayName = 'SliderFilter';

const columnFilters = {
    id: function idFilterFactory(props) {
        return <StringFilter colId="id" {...props} />;
    },
    name: function nameFilterFactory(props) {
        return <SelectFilter colId="name" {...props} />;
    },
    caperStrLabel: function caperLabelFilterFactory(props) {
        return <StringFilter colId="caperStrLabel" {...props} />;
    },
    submission: function submissionFilterFactory(props) {
        return (
            <SliderFilter
                colId="submission"
                {...props}
                valueDisplay={workflowColumns.submission.display}
            />
        );
    },
    waiting: function waitingFilterFactory(props) {
        return (
            <SliderFilter
                colId="waiting"
                {...props}
                valueDisplay={workflowColumns.waiting.display}
            />
        );
    },
    start: function startFilterFactory(props) {
        return (
            <SliderFilter
                colId="start"
                {...props}
                valueDisplay={workflowColumns.start.display}
            />
        );
    },
    end: function endFilterFactory(props) {
        return (
            <SliderFilter
                colId="end"
                {...props}
                valueDisplay={workflowColumns.end.display}
            />
        );
    },
    elapse: function elapseFilterFactory(props) {
        return (
            <SliderFilter
                colId="elapse"
                {...props}
                valueDisplay={workflowColumns.elapse.display}
            />
        );
    },
    status: function statusFilterFactory(props) {
        return <SelectFilter colId="status" {...props} />;
    },
    metadataArchiveStatus: function archiveFilterFactory(props) {
        return <SelectFilter colId="metadataArchiveStatus" {...props} />;
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

    const filtersReducer = (state, action) => {
        const newState = { ...state };
        switch (action.type) {
        case 'UPDATE':
            newState[action.colId] = {
                filterProps: action.filterProps,
                filterFactory: action.filterFactory,
            };
            return newState;
        case 'REMOVE':
            delete newState[action.colId];
            return newState;
        default:
            console.error(`Unknown filter action ${action.type}!`);
        }
    };
    const [filters, dispatchFilters] = useReducer(filtersReducer, {});
    const [filteredWorkflows, setFilteredWorkflows] = useState(workflows);
    useEffect(
        () =>
            setFilteredWorkflows(
                workflows.filter((workflow) =>
                    Object.keys(filters)
                        .map((colId) =>
                            filters[colId].filterFactory(
                                filters[colId].filterProps,
                            )(workflow),
                        )
                        .every(Boolean),
                ),
            ),
        [workflows, filters, setFilteredWorkflows],
    );

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
                {columnFilters[dataKey] ? (
                    <FilterControl filtered={Boolean(filters[dataKey])}>
                        {columnFilters[dataKey]({
                            workflows,
                            filters,
                            dispatchFilters,
                        })}
                    </FilterControl>
                ) : null}
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
    };
    const [sortedWorkflows, setSortedWorkflows] = useState(workflows);
    useEffect(() => {
        if (!sortBy || !sortDirection) {
            setSortedWorkflows(filteredWorkflows);
            return;
        }
        const stabilizedWorkflows = filteredWorkflows.map((el, index) => [
            el,
            index,
        ]);
        const comparator =
            workflowColumns[sortBy].comparator || defaultComparator;
        stabilizedWorkflows.sort(
            (a, b) =>
                comparator(
                    workflowDataGetter({ dataKey: sortBy, rowData: a[0] }),
                    workflowDataGetter({ dataKey: sortBy, rowData: b[0] }),
                    sortDirection,
                ) || a[1] - b[1],
        );
        setSortedWorkflows(stabilizedWorkflows.map((el) => el[0]));
    }, [filteredWorkflows, sortBy, sortDirection, setSortedWorkflows]);

    const [selectedCols, setSelectedCols] = useState(
        Object.keys(workflowColumns).filter(
            (col) => defaultColumns.indexOf(col) !== -1,
        ),
    );

    return loadingWorkflows ? (
        <CircularProgress />
    ) : workflows.length < 1 ? (
        <span>No workflow found.</span>
    ) : (
        <React.Fragment>
            <TableControl
                selectedCols={selectedCols}
                setSelectedCols={setSelectedCols}
            />
            <WindowScroller>
                {({ height }) => (
                    <AutoSizer disableHeight>
                        {({ width }) => (
                            <Table
                                rowCount={sortedWorkflows.length}
                                rowGetter={({ index }) =>
                                    sortedWorkflows[index]
                                }
                                height={height - 176}
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
                                {selectedCols.map((colKey) => {
                                    return (
                                        <Column
                                            key={colKey}
                                            headerRenderer={headerRenderer}
                                            className={classes.flexContainer}
                                            cellRenderer={cellRenderer}
                                            cellDataGetter={workflowDataGetter}
                                            dataKey={colKey}
                                            width={
                                                workflowColumns[colKey].width ||
                                                width / selectedCols.length
                                            }
                                            label={
                                                workflowColumns[colKey].label ||
                                                ''
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
        </React.Fragment>
    );
};
WorkflowTable.propTypes = {
    headerHeight: PropTypes.number,
    rowHeight: PropTypes.number,
};
export default WorkflowTable;
