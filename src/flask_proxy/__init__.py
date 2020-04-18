from flask import Flask


def create_app(test_config=None):
    # create and configure the app
    app = Flask(
        __name__,
        static_url_path='/',
        static_folder='../react-dashboard/build',
        instance_relative_config=True
    )
    app.config.from_mapping(
        SECRET_KEY='dev',
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_json('proxy_config.json')
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    @app.route('/')
    @app.route(app.config['DASHBOARD_BASE'], strict_slashes=False)
    @app.route(
        '{}/<path:subpath>'.format(app.config['DASHBOARD_BASE']),
        strict_slashes=False
    )
    def index(subpath=None):
        return app.send_static_file('index.html')

    from proxy import proxy
    app.register_blueprint(proxy)

    from auth import AuthError, handle_auth_error
    app.register_error_handler(AuthError, handle_auth_error)

    return app


if __name__ == '__main__':
    create_app().run(debug=True, host='0.0.0.0', ssl_context='adhoc')
