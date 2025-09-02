# PostgreSQL Database Setup on Render

## Step 1: Create PostgreSQL Database on Render

1. Go to your [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure your database:
   - **Name**: `healthme_db`
   - **Database**: `healthme`
   - **User**: `healthme_user`
   - **Region**: Choose the same region as your web service
   - **Plan**: Start with **Free** plan
4. Click **"Create Database"**

## Step 2: Get Database Connection Details

After creation, Render will show you:
- **External Database URL**: `postgresql://user:password@host:port/database`
- **Internal Database URL**: For services in the same region

## Step 3: Update Environment Variables

In your Render web service settings, add:

```
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
```

## Step 4: Deploy and Run Migration

1. **Deploy your code** to Render
2. **Run the migration** by connecting to your Render service shell:
   ```bash
   npm run db:migrate:postgres
   ```

## Step 5: Verify Setup

Your app will automatically:
- Use PostgreSQL in production (when `DATABASE_URL` is set)
- Use JSON file database in development
- Handle all database operations seamlessly

## Database Features

✅ **User Registration & Authentication**
✅ **Password Reset with Email**
✅ **Journal Reflections**
✅ **Chat Messages**
✅ **User Statistics**
✅ **Automatic Schema Migration**

## Troubleshooting

### Connection Issues
- Verify `DATABASE_URL` is correctly set
- Check that your web service and database are in the same region
- Ensure SSL is enabled for production connections

### Migration Issues
- Run migration manually: `npm run db:migrate:postgres`
- Check Render logs for detailed error messages
- Verify database permissions

### Performance
- PostgreSQL connection pooling is configured
- Indexes are created for optimal performance
- Connection limits are set appropriately

## Local Development

For local development, the app will automatically use the JSON file database. No additional setup required!

## Production Benefits

- ✅ **Persistent data** (survives server restarts)
- ✅ **Better performance** with proper indexing
- ✅ **ACID compliance** for data integrity
- ✅ **Connection pooling** for scalability
- ✅ **Automatic backups** (Render handles this)
