import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useApp } from '../App';
import { useAuth0 } from '../auth';

export const ExecutionChart = ({ metadata }) => {
    const { authorizedFetch } = useAuth0();
    const { apiVersion } = useApp();

    useEffect(() => {
        authorizedFetch(`/api/workflows/${apiVersion}/${metadata.id}/timing`)
            .then((res) => res.text())
            .then((res) => {
                const domparser = new DOMParser();
                let doc = domparser.parseFromString(res, 'text/html');
                for (let e of doc.scripts) {
                    if (e.innerHTML.length > 0) {
                        var script = document.createElement('script');
                        script.type = 'text/javascript';
                        script.text = e.text;
                        document
                            .getElementById('chart_div')
                            .appendChild(script);
                    }
                }
            })
            .catch((err) => console.error(err));
    }, [metadata, authorizedFetch, apiVersion]);

    return <div id="chart_div" />;
};
ExecutionChart.propTypes = {
    metadata: PropTypes.object.isRequired,
};
