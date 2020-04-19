import React, { useState, useRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { refType } from '@material-ui/utils';
import Button from '@material-ui/core/Button';

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