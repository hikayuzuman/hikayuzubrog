# RSS Auto Posting

This project can create new blog posts from an RSS feed and push them to GitHub.

## GitHub Actions
1. Add a repository secret named `RSS_URL` with your feed URL.
2. The workflow runs daily at 00:30 UTC and can be triggered manually.
3. New posts are generated under `src/content/posts/<slug>/index.md`.

## Local Run
```powershell
$env:RSS_URL="https://example.com/feed.xml"
$env:MAX_ITEMS="3"
npm run rss:post
```

## Notes
- The script skips items if a folder with the same slug already exists.
- You can change the schedule in `.github/workflows/rss-auto-post.yml`.
