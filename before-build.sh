pm2 stop drn-api

# PM2 errors out when there is no service to stop. Which causes Github Actions
# to abort
#
# To avoid that we are exiting with 0 status as if there was no error
exit 0
