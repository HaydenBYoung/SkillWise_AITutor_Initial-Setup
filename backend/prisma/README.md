This folder contains the Prisma schema and a SQL migration for the `users` table.

Quick setup and migrate instructions:

1. Install Prisma CLI and client (dev dependency):

```powershell
# from backend folder
npm install -D prisma @prisma/client
```

2. Generate Prisma client:

```powershell
npx prisma generate
```

3. Run migrations (deploy existing SQL migrations to the database):

```powershell
# Uses DATABASE_URL from environment
npx prisma migrate deploy
```

Notes:

- The included `schema.prisma` defines a `User` model mapping to the `users` table.
- A simple SQL migration has been added under `prisma/migrations/001_create_users/migration.sql` that will create the table for projects that prefer direct SQL migrations.
- If you prefer to use `prisma migrate dev` to generate migrations from the schema, you can run:

```powershell
npx prisma migrate dev --name init
```

Be sure your `DATABASE_URL` environment variable points to a running PostgreSQL instance before running the migration commands.
