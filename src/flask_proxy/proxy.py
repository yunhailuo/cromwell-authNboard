from flask import Blueprint, request, Response, current_app
import requests

from auth import requires_auth

proxy = Blueprint('proxy', __name__,)


@proxy.route('/api/workflows/<path:subpath>', methods=['GET'])
@requires_auth(permissions=['read:workflows'])
def get_workflows(subpath):
    return proxy_request()


@proxy.route('/api/workflows/<path:subpath>/abort', methods=['POST'])
@proxy.route('/api/workflows/<path:subpath>/releaseHold', methods=['POST'])
@proxy.route('/api/workflows/<path:subpath>/labels', methods=['PATCH'])
@requires_auth(permissions=['update:workflows'])
def abort_release_workflow(subpath):
    return proxy_request()


@proxy.route('/api/workflows/<path:subpath>', methods=['POST'])
@requires_auth(
    permissions=['create:workflows', 'update:workflows']
)
def post_workflows(subpath):
    return proxy_request('api/workflows/{}'.format(subpath.lstrip('/')))


@proxy.route('/api/womtool/<path:subpath>', methods=['POST'])
@requires_auth(
    permissions=['read:workflows', 'create:workflows', 'update:workflows']
)
def womtool(subpath):
    return proxy_request()


@proxy.route('/engine/<path:subpath>', methods=['GET'])
@requires_auth(permissions=['read:workflows'])
def engine(subpath):
    return proxy_request()


@proxy.route('/swagger/cromwell.yaml', methods=['GET'])
@requires_auth
def get_api_swagger_doc():
    return proxy_request()


def proxy_request(path=None):
    if not path:
        path = request.path
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
