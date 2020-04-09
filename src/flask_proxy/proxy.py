from flask import Blueprint, request, Response, current_app
import requests

from auth import requires_auth

proxy = Blueprint('proxy', __name__,)


@proxy.route(
    '/engine/<path:subpath>',
    defaults={'prefix': 'engine'},
    methods=['GET', 'POST']
)
@proxy.route(
    '/api/<path:subpath>',
    defaults={'prefix': 'api'},
    methods=['GET', 'POST']
)
@requires_auth
def get_post(subpath, prefix):
    path = '{}/{}'.format(
        prefix, subpath.lstrip('/')
    )
    response = requests.request(
        request.method,
        '{}/{}'.format(
            current_app.config['CROMWELL_SERVER'].rstrip('/'),
            path
        ),
        params=request.args,
        stream=True,
        headers={
            key: value
            for (key, value) in request.headers
            if key != 'Host'
        },
        allow_redirects=False,
        data=request.get_data(),
    )
    # https://stackoverflow.com/questions/6656363/proxying-to-another-web-service-with-flask#answer-36601467
    excluded_headers = [
        'content-encoding',
        'content-length',
        'transfer-encoding',
        'connection'
    ]
    headers = [
        (name, value)
        for (name, value) in response.raw.headers.items()
        if name.lower() not in excluded_headers
    ]
    return Response(
        response.iter_content(1024),
        status=response.status_code,
        headers=headers
    )
