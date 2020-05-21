import React, { useImperativeHandle, useRef, useState } from 'react';
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';
import { SortDirection } from 'react-virtualized';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { makeStyles } from '@material-ui/core/styles';
import { refType } from '@material-ui/utils';

const useStyles = makeStyles({
    fileInputDisplay: {
        flexGrow: 1,
        textAlign: 'start',
    },
    fileInput: {
        display: 'none',
    },
});

export const SingleFileUpload = ({ inputRef: parentRef, accept = '.' }) => {
    const classes = useStyles();

    const [selectedFile, setSelectedFile] = useState();
    const handleFileInputChange = (event) => {
        setSelectedFile(event.target.value);
    };

    const fileInputRef = useRef();
    useImperativeHandle(parentRef, () => ({
        focus: () => {},
        value: fileInputRef.current.value,
        files: fileInputRef.current.files,
        reset: () => {
            fileInputRef.current.value = null;
            setSelectedFile(null);
        },
    }));

    return (
        <React.Fragment>
            <div className={classes.fileInputDisplay}>{selectedFile}</div>
            <label>
                <Button variant="contained" color="primary" component="span">
                    Upload
                </Button>
                <input
                    accept={accept}
                    className={classes.fileInput}
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                />
            </label>
        </React.Fragment>
    );
};
SingleFileUpload.propTypes = {
    inputRef: refType.isRequired,
    accept: PropTypes.string,
};

export const getTimeString = (milliseconds) => {
    if (isNaN(milliseconds)) return '';
    const seconds = milliseconds / 1000;
    const minutes = seconds / 60;
    if (minutes < 1) return seconds.toFixed(1) + ' sec';
    const hours = minutes / 60;
    if (hours < 1) return minutes.toFixed(1) + ' min';
    return hours.toFixed(1) + ' hr';
};

export { SortDirection };

export const numberComparator = (a, b, sortDirection = SortDirection.DESC) => {
    if (isNaN(a) && !isNaN(b)) return 1;
    if (!isNaN(a) && isNaN(b)) return -1;
    if (isNaN(a) && isNaN(b)) return 0;
    const descOrder = Math.sign(b - a);
    return sortDirection === SortDirection.DESC ? descOrder : -descOrder;
};

export const arrayEqual = (array1, array2) => {
    const sortedArray1 = array1.slice(0).sort();
    const sortedArray2 = array2.slice(0).sort();
    return (
        array1.length === array2.length &&
        sortedArray1.every((value, index) => value === sortedArray2[index])
    );
};

export const SimpleObjectTable = ({ obj = {} }) =>
    obj && Object.keys(obj).length > 0 ? (
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
    ) : (
        <Table size="small">
            <TableBody>
                <TableRow>
                    <TableCell component="th" scope="row" colSpan={2}>
                        N/A
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
SimpleObjectTable.propTypes = {
    obj: PropTypes.object,
};
