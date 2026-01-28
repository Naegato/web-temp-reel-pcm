up: db
	pnpm run start:dev
debug: db
	pnpm run start:debug

db: install
	docker compose up -d --remove-orphans
	sleep 5
	pnpm run db:migrate
	pnpm run db:generate

install:
	pnpm install

clear:
	rm -rf node_modules dist
	docker compose down

TIMESTAMP := $(shell date +%Y%m%d%H%M%S)

db-backup:
	@mkdir -p backup
	@docker compose exec -i db pg_dump -U username -d default_database > backup/db-backup-$(TIMESTAMP).sql
	@echo "Database backup created at backup/db-backup-$(TIMESTAMP).sql"

db/%:
	cat backup/$* | docker compose run --rm db psql "postgresql://username:password@db:5432/default_database"

db-drop:
	docker compose exec -i db psql -U username -d default_database -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

rm-rc-anonymous:
	ts-node -r tsconfig-paths/register src/main.cli.ts rm-rc-anonyme-users