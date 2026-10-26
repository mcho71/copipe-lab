#!/bin/sh
# Prints a fresh frontdoor URL for the given org alias (sf org open can hand out an expired token).
# Usage: scripts/login-url.sh <alias> [path]
alias="$1"; path="${2:-/lightning/n/calendarHost}"
user=$(sf org display -o "$alias" --json | jq -r .result.username)
CORE=$(npm root -g)/@salesforce/cli/node_modules/@salesforce/core
node -e "const {AuthInfo,Connection}=require('$CORE');(async()=>{const c=await Connection.create({authInfo:await AuthInfo.create({username:'$user'})});await c.refreshAuth();console.log(c.instanceUrl+'/secur/frontdoor.jsp?sid='+encodeURIComponent(c.accessToken)+'&retURL='+encodeURIComponent('$path'))})()"
