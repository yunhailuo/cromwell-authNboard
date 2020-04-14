from functools import wraps

from authlib.jose import JsonWebToken
from authlib.jose.errors import (
    MissingClaimError,
    InvalidClaimError,
    ExpiredTokenError,
    InvalidTokenError,
)
from flask import current_app, request, jsonify, _request_ctx_stack
import requests

from utils import decorator


# Error handler
class AuthError(Exception):
    def __init__(self, error, status_code):
        self.error = error
        self.status_code = status_code


def handle_auth_error(ex):
    response = jsonify(ex.error)
    response.status_code = ex.status_code
    return response


def get_token_from_header():
    """Obtains the Access Token from the Authorization Header
    """
    auth = request.headers.get("Authorization", None)
    if not auth:
        raise AuthError(
            {
                "code": "authorization_header_missing",
                "description": "Authorization header is expected"
            },
            401
        )

    parts = auth.split()

    if parts[0].lower() != "bearer":
        raise AuthError(
            {
                "code": "invalid_header",
                "description": "Authorization header must start with Bearer"
            },
            401
        )
    elif len(parts) == 1:
        raise AuthError(
            {"code": "invalid_header", "description": "Token not found"}, 401
        )
    elif len(parts) > 2:
        raise AuthError(
            {
                "code": "invalid_header",
                "description": "Authorization header must be Bearer token"
            },
            401
        )

    token = parts[1]
    return token


@decorator
def requires_auth(func, permissions=[]):
    """Determines if the Access Token is valid
    """
    @wraps(func)
    def decorated(*args, **kwargs):
        token = get_token_from_header()
        jwks = requests.get(
            "https://{}/.well-known/jwks.json".format(
                current_app.config["AUTH0_DOMAIN"]
            )
        ).json()

        def load_key(header, payload):
            kid = header['kid']
            for key in jwks["keys"]:
                if key["kid"] == kid:
                    return key
            raise AuthError(
                {
                    "code": "invalid_header",
                    "description": "Unable to find appropriate key"
                },
                401
            )

        jwt = JsonWebToken(current_app.config['ALGORITHMS'])
        try:
            payload = jwt.decode(
                token,
                load_key,
                claims_options={
                    "iss": {
                        "essential": True,
                        "value": "https://{}/".format(
                            current_app.config["AUTH0_DOMAIN"]
                        )
                    },
                    "aud": {
                        "essential": True,
                        "value": current_app.config["API_AUDIENCE"]
                    }
                }
            )
        except (
            MissingClaimError,
            InvalidClaimError,
            ExpiredTokenError,
            InvalidTokenError
        ) as e:
            raise AuthError(
                {"code": e.error, "description": e.description}, 401
            )
        except Exception:
            raise AuthError(
                {
                    "code": "invalid_header",
                    "description": "Unable to decode authentication token."
                },
                401
            )
        if (
            not permissions
            or (set(permissions) & set(payload.get('permissions', [])))
        ):
            _request_ctx_stack.top.current_user = payload
            return func(*args, **kwargs)
        raise AuthError(
            {
                "code": "missing_permission",
                "description": "missing {} permission".format(
                    ', '.join(set(permissions))
                )
            },
            401
        )

    return decorated
