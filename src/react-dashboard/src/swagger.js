import 'swagger-ui/dist/swagger-ui.css';
import React, { useEffect, useRef } from 'react';
import Box from '@material-ui/core/Box';
import SwaggerUI from 'swagger-ui';
// not declared dependency; swagger-ui uses the following to load YAML spec
import YAML from 'js-yaml';
import { useApp } from './App';
import { useAuth0 } from './auth';

const ApiDoc = () => {
    const apiDocContainer = useRef();
    const { authorizedFetch } = useAuth0();
    const { setAppBarTitle } = useApp();
    useEffect(() => setAppBarTitle('Cromwell API reference'), [setAppBarTitle]);

    useEffect(() => {
        authorizedFetch('/swagger/cromwell.yaml')
            .then((res) => {
                if (!res.ok) {
                    apiDocContainer.current.textContent = res.statusText;
                    throw new Error(res.statusText);
                }
                return res.text();
            })
            .then((res) =>
                SwaggerUI({
                    domNode: apiDocContainer.current,
                    spec: YAML.safeLoad(res),
                    deepLinking: true,
                    presets: [SwaggerUI.presets.apis],
                }),
            )
            .catch((err) => console.error(err));
    }, [authorizedFetch, apiDocContainer]);

    return <Box textAlign="start" ref={apiDocContainer} />;
};
export default ApiDoc;
