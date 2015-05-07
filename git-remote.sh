#!/bin/sh

if [ $1 = 'init' ]; then
  if [ ! -d '.git' ]; then
    git init
  fi
fi

url=git@github.com:pjanaya/nodejs-express4-mysql.git

if ! git remote -v | grep -q 'upstream'; then
  git remote add upstream $url
fi

echo 'fetch upstream...'
git fetch upstream master
git checkout master
git merge upstream/master
