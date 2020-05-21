#!/bin/bash
set -e

root=$(pwd)
echo "Load configurations"
. $root/deploy.conf

echo "Create configuration files"
mkdir -p $root/src/flask_proxy/instance
proxy_config=$root/src/flask_proxy/instance/proxy_config.json
touch $proxy_config
dashboard_config=$root/src/react-dashboard/src/dashboard_config.json
touch $dashboard_config

echo "Setup react dashboard configurations"
echo '{"DASHBOARD_BASE": "'$DASHBOARD_BASE'",' > $dashboard_config
echo '"AUTH0_DOMAIN": "'$AUTH0_DOMAIN'",' >> $dashboard_config
echo '"API_AUDIENCE": "'$API_AUDIENCE'",' >> $dashboard_config
echo '"CLIENT_ID": "'$CLIENT_ID'"}' >> $dashboard_config

echo "Setup flask reverse proxy configurations"
echo '{"CROMWELL_SERVER": "'$CROMWELL_SERVER'",' > $proxy_config
echo '"DASHBOARD_BASE": "'$DASHBOARD_BASE'",' >> $proxy_config
echo '"AUTH0_DOMAIN": "'$AUTH0_DOMAIN'",' >> $proxy_config
echo '"API_AUDIENCE": "'$API_AUDIENCE'",' >> $proxy_config
echo '"ALGORITHMS": ["'$ALGORITHM'"],' >> $proxy_config
echo '"CREATE_PERMISSION": "'$CREATE_PERMISSION'",' >> $proxy_config
echo '"READ_PERMISSION": "'$READ_PERMISSION'",' >> $proxy_config
echo '"UPDATE_PERMISSION": "'$UPDATE_PERMISSION'"}' >> $proxy_config

echo "Install node packages"
cd $root/src/react-dashboard
npm install

echo "Build react dashboard"
npm run build

echo "Install flask reverse proxy"
cd $root
python3 -m venv $root/venv
source $root/venv/bin/activate
pip install -r $root/requirements.txt

echo "Start server"
cd $root/src/flask_proxy
python __init__.py
