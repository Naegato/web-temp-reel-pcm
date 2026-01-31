# WEB TEMP REEL 

## Lancement

### /api:
```
cp .env.example .env

docker compose up -d

pnpm i

npx prisma generate
npx prisma migrate dev
npx prisma db seed

pnpm dev
```

### /front
```
pnpm i
pnpm dev
```


## INFORMATION

Password: 123

Users:

test@test.test
test@test2.test
test@test3.test

Advisor:

test2@test.test
test2@test2.test

Admin (director):

admin@test.test
