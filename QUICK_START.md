# ⚡ Quick Setup Guide (5 Minutes)

Get your Concierge Lead Generation system running in 5 minutes!

## Step 1: Supabase Setup (2 minutes)

1. **Create Account**
   - Go to https://supabase.com
   - Sign up (it's free)
   - Create new project
   - Wait for project initialization (~1 minute)

2. **Run Database Schema**
   ```
   Dashboard > SQL Editor > New Query
   Paste contents of database-schema.sql
   Click "Run"
   ```

3. **Create Storage Bucket**
   ```
   Dashboard > Storage > New Bucket
   Name: lead-documents
   Privacy: Private
   ```

4. **Get API Keys**
   ```
   Dashboard > Settings > API
   Copy:
   - Project URL
   - anon/public key
   - service_role key (⚠️ Keep secret!)
   ```

## Step 2: Local Setup (2 minutes)

\`\`\`bash
# Clone and install
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your Supabase keys
# (Use your favorite editor: nano, vim, or VS Code)
\`\`\`

## Step 3: Email Setup (Optional - 1 minute)

**For Development**: Skip this! Emails will log to console.

**For Production**:
1. Sign up at https://resend.com (free tier)
2. Get API key
3. Add to .env.local

## Step 4: Run! (30 seconds)

\`\`\`bash
npm run dev
\`\`\`

Open http://localhost:3000

## 🎉 You're Done!

### Test It:

1. **Create a Lead**
   - Fill form on homepage
   - Check terminal for magic link
   - Copy link to browser

2. **Upload Documents**
   - Use the magic link
   - Drag and drop a test PDF
   - Watch progress update

3. **Create Admin User**
   ```sql
   -- In Supabase SQL Editor:
   INSERT INTO users (email, full_name, role)
   VALUES ('admin@test.com', 'Admin', 'admin');
   ```

## 🚀 Deploy to Production

### Vercel (Recommended - 2 minutes)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

### Update Production URL

\`\`\`env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
\`\`\`

## 🆘 Having Issues?

### Problem: "Invalid API key"
**Fix**: Double-check your Supabase URL and keys in .env.local

### Problem: Can't upload files
**Fix**: 
1. Verify storage bucket exists
2. Check bucket name is exactly: \`lead-documents\`
3. Ensure it's marked as "Private"

### Problem: Database errors
**Fix**: Re-run the database-schema.sql script

### Problem: Build errors
**Fix**: 
\`\`\`bash
rm -rf .next node_modules
npm install
npm run dev
\`\`\`

## 📚 Next Steps

- [ ] Customize branding (colors, fonts, logo)
- [ ] Set up email service (Resend)
- [ ] Create admin dashboard
- [ ] Build advisor portal
- [ ] Add your own document types
- [ ] Deploy to production

## 🎨 Quick Customization

### Change Colors

Edit \`tailwind.config.js\`:
\`\`\`js
colors: {
  navy: { 900: '#YOUR_COLOR' },
  gold: { 500: '#YOUR_COLOR' },
}
\`\`\`

### Change Fonts

Edit \`app/layout.tsx\`:
\`\`\`ts
import { Your_Font } from 'next/font/google';
\`\`\`

### Change Company Name

Global search and replace:
- "Your Financial Advisory Firm"
- "yourfirm.com"
- Update logos in \`/public\`

## 💡 Pro Tips

1. **Use Environment Variables**: Never commit secrets to git
2. **Test Locally First**: Always test changes locally before deploying
3. **Backup Database**: Regular exports from Supabase dashboard
4. **Monitor Logs**: Check Vercel/Netlify logs for errors
5. **Enable Analytics**: Add Plausible or Google Analytics

## 🔐 Security Reminders

✅ Keep service_role key secret
✅ Use HTTPS in production
✅ Enable RLS policies (already in schema)
✅ Regular security audits
✅ Update dependencies monthly

---

**Need help?** Check the full README.md or open an issue!

**Ready to customize?** See PROJECT_BLUEPRINT.md for architecture details!
