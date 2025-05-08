#!/usr/bin/env bash

pnpm changeset version
git add .
git commit -m "chore: update versions"
pnpm install --frozen-lockfile
