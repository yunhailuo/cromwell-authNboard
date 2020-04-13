from flask import Blueprint, request, Response, current_app
import requests

from auth import requires_auth

proxy = Blueprint('proxy', __name__,)


@proxy.route('/engine/<path:subpath>', methods=['GET'])
@requires_auth(permissions=['read:workflows'])
def engine_get(subpath):
    return proxy_request('engine/{}'.format(subpath.lstrip('/')))


@proxy.route('/api/<path:subpath>', methods=['GET'])
@requires_auth(permissions=['read:workflows'])
def api_get(subpath):
    return proxy_request('api/{}'.format(subpath.lstrip('/')))


@proxy.route('/api/<path:subpath>', methods=['POST'])
@requires_auth(
    permissions=['read:workflows', 'create:workflows', 'update:workflows']
)
def api_post(subpath):
    return proxy_request('api/{}'.format(subpath.lstrip('/')))


def proxy_request(path):
    response = requests.request(
        request.method,
        '{}/{}'.format(
            current_app.config['CROMWELL_SERVER'].rstrip('/'),
            path.lstrip('/')
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
