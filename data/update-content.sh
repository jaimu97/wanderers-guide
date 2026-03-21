#!/bin/bash
set -euo pipefail
DB_URL=${1:-"postgresql://postgres:postgres@127.0.0.1:54322/postgres"}
echo "Deleting old content"
# WHERE user_id IS NULL should mean only official content is deleted... i fucking hope
psql "$DB_URL" -c "DELETE FROM public.content_source WHERE user_id IS NULL;"
echo "Importing new content... make sure data.sql is in the same folder as this script."
psql "$DB_URL" -f data.sql
echo "All data successfully wiped! (or hopefully just the wg data and player info is safe...)"
