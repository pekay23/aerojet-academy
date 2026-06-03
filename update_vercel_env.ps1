$env:DATABASE_URL = "postgresql://neondb_owner:npg_lPmU1f4rKBkj@ep-wandering-wave-ahyik1io-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
$env:DIRECT_URL = "postgresql://neondb_owner:npg_lPmU1f4rKBkj@ep-wandering-wave-ahyik1io.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

$envs = @("production", "preview", "development")

foreach ($e in $envs) {
    Write-Host "Removing old DATABASE_URL from $e..."
    bunx vercel env rm DATABASE_URL $e -y

    Write-Host "Adding new DATABASE_URL to $e..."
    bunx vercel env add DATABASE_URL $e --value "$env:DATABASE_URL"

    Write-Host "Removing old DIRECT_URL from $e..."
    bunx vercel env rm DIRECT_URL $e -y

    Write-Host "Adding new DIRECT_URL to $e..."
    bunx vercel env add DIRECT_URL $e --value "$env:DIRECT_URL"
}
Write-Host "Done!"
