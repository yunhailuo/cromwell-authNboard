# Cromwell Authentication Proxy and Dashboard

This is a prototype which provides an authenticating proxy server and a dashboard UI for your Cromwell server.

![](demo.gif)

## Table of Contents

- [Introduction](#Introduction)
- [Deployment](#Deployment)

## Introduction

There are two components in this application:

- **Authenticating proxy server built with Flask**

  As mentioned in the Cromwell documentation, ["Cromwell is NOT on its own a security appliance!"](https://cromwell.readthedocs.io/en/stable/developers/Security/) This proxy server will authenticate incoming request by JWT token and forward valid requests to Cromwell REST API. In addition to identity authentication, there are three levels of permissions: 1) create workflows; 2) update workflow; 3) read workflows. You need to set them up properly with `develop.conf` and in Auth0.

- **Dashboard UI built with React**

  This dashboard allows you to monitor and manage workflows. Moreover, it authorizes a JWT token which you can use to query the Cromwell REST API through the authenticating proxy server.

## Deployment

0. **Requirements**

   - Python 3 and [packages](requirements.txt): required by the authenticating proxy server.
   - Node.js v12.16.3 (npm 6.14.4) and [packages](src/react-dashboard/package.json): required by the dashboard UI.

1. **Configurations**

   - `deploy.conf`

     You need to create this configuration file under the root of this repo. Please keep this file safe since it will contain key information about your auth0 setup. You can start with `deploy.template.conf` which is a template:

     ```
     cp deploy.template.conf deploy.conf
     ```

     All parameters are required for proper functionalities:

     | Parameters        | Description                                                                                                                                          |
     | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
     | CROMWELL_SERVER   | Cromwell server URL                                                                                                                                  |
     | DASHBOARD_BASE    | Relative path to serve react dashboard.<br>By default, the react dashboard is<br>integrated into and served from the<br>authenticating proxy server. |
     | CLIENT_ID         | Auth0 application client ID                                                                                                                          |
     | AUTH0_DOMAIN      | Auth0 domain                                                                                                                                         |
     | API_AUDIENCE      | Auth0 API audience                                                                                                                                   |
     | ALGORITHM         | Auth0 Access tokens signing algorithm                                                                                                                |
     | CREATE_PERMISSION | Permission name to create workflow                                                                                                                   |
     | READ_PERMISSION   | Permission name to read workflow                                                                                                                     |
     | UPDATE_PERMISSION | Permission name to manage workflow                                                                                                                   |

   - Auth0 settings

     This application (both the authenticating proxy and the dashboard) uses auth0 for authentication. [This tutorial](https://auth0.com/docs/quickstart/spa/react) is a great introduction to both Auth0 settings and the code used here to implement authentication.

     - [Application setting](https://auth0.com/docs/dashboard/reference/settings-application)

       Once the application is created, copy down the "Domain" and "Client ID" from your Auth0 dashboard. Remember to add your URL of this authNboard to "Allowed Callback URLs", "Allowed Logout URLs" and "Allowed Web Origins" to your Auth0 application.

     - [API setting](https://auth0.com/docs/dashboard/reference/settings-api)

       Once the API is created, copy down the "Identifier" as API audience and the "Signing Algorithm". Then add permissions to your API in Auth0. Though the authenticating proxy is designed to have three levels of permissions, you can use one permission across board. Just give the same permission name to CREATE_PERMISSION, READ_PERMISSION and UPDATE_PERMISSION.

     - [Users](https://auth0.com/docs/users/guides/create-users)

       Remember to give users proper permissions by either assigning directly or assigning through roles.

1. **Deploy**

   ```
   ./deploy.sh
   ```

   This script will:

   1. Copy configurations to `src/flask_proxy/instance/proxy_config.json` and `src/react-dashboard/src/dashboard_config.json` for authenticating proxy server and dashboard UI respectively.
   2. Install node packages for the dashboard UI.
   3. Build the dashboard UI.
   4. Install python packages for authenticating proxy server.
   5. Start the server in development mode.
