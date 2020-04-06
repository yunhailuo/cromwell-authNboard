import os

from flask import Flask, request, Response
import requests


def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev',
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        print(os.path.abspath('config.py'))
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    @app.route('/<path:path>', methods=['GET', 'POST'])
    def proxy(path):
        response = requests.request(
            request.method,
            '{}/{}'.format(
                app.config['CROMWELL_SERVER'].rstrip('/'),
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

    return app


if __name__ == '__main__':
    create_app().run(debug=True)
