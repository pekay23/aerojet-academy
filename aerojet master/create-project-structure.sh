#!/bin/bash

################################################################################
# AEROJET ACADEMY - PROJECT STRUCTURE GENERATOR
# Creates all folders and files for the complete project
# Run this script from your project root directory
################################################################################

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        AEROJET ACADEMY - PROJECT STRUCTURE SETUP          ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""

# Function to create directory
create_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
        echo -e "${GREEN}✓${NC} Created directory: $1"
    else
        echo -e "${YELLOW}→${NC} Directory exists: $1"
    fi
}

# Function to create file with optional content
create_file() {
    if [ ! -f "$1" ]; then
        touch "$1"
        if [ ! -z "$2" ]; then
            echo "$2" > "$1"
        fi
        echo -e "${GREEN}✓${NC} Created file: $1"
    else
        echo -e "${YELLOW}→${NC} File exists: $1"
    fi
}

################################################################################
# ROOT LEVEL FILES
################################################################################

echo ""
echo -e "${BLUE}[1/15] Creating root configuration files...${NC}"

create_file ".gitignore" "# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage
.vitest/

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env.production
.env.staging

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Prisma
prisma/migrations/

# IDE
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
.idea/

# Uploads
public/uploads/"

create_file ".env.example" "# Database
DATABASE_URL=\"postgresql://user:password@localhost:5432/aerojet_academy\"

# NextAuth
NEXTAUTH_URL=\"http://localhost:3000\"
NEXTAUTH_SECRET=\"generate_with_openssl_rand_base64_32\"

# Email (Resend)
RESEND_API_KEY=\"re_...\"
FROM_EMAIL=\"noreply@aerojet-academy.com\"

# File Upload (UploadThing)
UPLOADTHING_SECRET=\"sk_...\"
UPLOADTHING_APP_ID=\"...\"
UPLOADTHING_TOKEN=\"...\"

# App
NEXT_PUBLIC_APP_URL=\"http://localhost:3000\"

# Admin (for seeding)
ADMIN_EMAIL=\"admin@aerojet-academy.com\"
ADMIN_PASSWORD=\"REDACTED_PASSWORD\"

# Monitoring (Optional)
SENTRY_DSN=\"\"
SENTRY_AUTH_TOKEN=\"\""

create_file ".eslintrc.json" "{
  \"extends\": [\"next/core-web-vitals\", \"next/typescript\"],
  \"rules\": {
    \"@typescript-eslint/no-explicit-any\": \"warn\",
    \"@typescript-eslint/no-unused-vars\": \"warn\"
  }
}"

create_file ".prettierrc" "{
  \"semi\": false,
  \"trailingComma\": \"es5\",
  \"singleQuote\": true,
  \"tabWidth\": 2,
  \"useTabs\": false,
  \"printWidth\": 100
}"

create_file ".prettierignore" "node_modules
.next
out
build
dist
coverage
*.lock
package-lock.json
*.md"

create_file "components.json" "{
  \"\$schema\": \"https://ui.shadcn.com/schema.json\",
  \"style\": \"default\",
  \"rsc\": true,
  \"tsx\": true,
  \"tailwind\": {
    \"config\": \"tailwind.config.ts\",
    \"css\": \"app/globals.css\",
    \"baseColor\": \"slate\",
    \"cssVariables\": true
  },
  \"aliases\": {
    \"components\": \"@/components\",
    \"utils\": \"@/lib/utils\"
  }
}"

create_file "next.config.ts" "import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
}

export default nextConfig"

create_file "postcss.config.mjs" "/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
  },
}

export default config"

create_file "tailwind.config.ts" "import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config"

create_file "tsconfig.json" "{
  \"compilerOptions\": {
    \"target\": \"ES2017\",
    \"lib\": [\"dom\", \"dom.iterable\", \"esnext\"],
    \"allowJs\": true,
    \"skipLibCheck\": true,
    \"strict\": true,
    \"noEmit\": true,
    \"esModuleInterop\": true,
    \"module\": \"esnext\",
    \"moduleResolution\": \"bundler\",
    \"resolveJsonModule\": true,
    \"isolatedModules\": true,
    \"jsx\": \"preserve\",
    \"incremental\": true,
    \"plugins\": [
      {
        \"name\": \"next\"
      }
    ],
    \"paths\": {
      \"@/*\": [\"./*\"]
    }
  },
  \"include\": [\"next-env.d.ts\", \"**/*.ts\", \"**/*.tsx\", \".next/types/**/*.ts\"],
  \"exclude\": [\"node_modules\"]
}"

create_file "vitest.config.ts" "import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})"

create_file "middleware.ts" "export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/staff/:path*',
    '/applicant/:path*',
    '/student/:path*',
    '/instructor/:path*',
  ],
}"

create_file "README.md" "# Aerojet Academy Portal System

## Overview
Complete portal system for Aerojet Aviation Training Academy with separate interfaces for public, applicants, students, instructors, and staff.

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
# Edit .env.local with your values
\`\`\`

3. Set up database:
\`\`\`bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
\`\`\`

4. Run development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

See \`docs/SETUP.md\` for detailed documentation.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Prisma (PostgreSQL)
- NextAuth.js
- Tailwind CSS
- shadcn/ui"

create_file "LICENSE" "MIT License

Copyright (c) 2026 Aerojet Aviation Training Academy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the \"Software\"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE."

################################################################################
# APP DIRECTORY
################################################################################

echo ""
echo -e "${BLUE}[2/15] Creating app directory structure...${NC}"

# Root app files
create_dir "app"
create_file "app/layout.tsx" ""
create_file "app/globals.css" ""
create_file "app/providers.tsx" ""
create_file "app/error.tsx" ""
create_file "app/not-found.tsx" ""
create_file "app/loading.tsx" ""
create_file "app/robots.txt" ""
create_file "app/sitemap.ts" ""

# (public) - Public Website
create_dir "app/(public)"
create_file "app/(public)/layout.tsx" ""
create_file "app/(public)/page.tsx" ""
create_file "app/(public)/loading.tsx" ""
create_file "app/(public)/error.tsx" ""

create_dir "app/(public)/about"
create_file "app/(public)/about/page.tsx" ""
create_dir "app/(public)/about/accra-mro-project"
create_file "app/(public)/about/accra-mro-project/page.tsx" ""

create_dir "app/(public)/courses"
create_file "app/(public)/courses/page.tsx" ""
create_dir "app/(public)/courses/four-year-b1-b2"
create_file "app/(public)/courses/four-year-b1-b2/page.tsx" ""
create_dir "app/(public)/courses/two-year-b1"
create_file "app/(public)/courses/two-year-b1/page.tsx" ""
create_dir "app/(public)/courses/military-certification"
create_file "app/(public)/courses/military-certification/page.tsx" ""
create_dir "app/(public)/courses/modular-training"
create_file "app/(public)/courses/modular-training/page.tsx" ""
create_dir "app/(public)/courses/exam-only"
create_file "app/(public)/courses/exam-only/page.tsx" ""
create_dir "app/(public)/courses/revision-support"
create_file "app/(public)/courses/revision-support/page.tsx" ""
create_dir "app/(public)/courses/module-requirements"
create_file "app/(public)/courses/module-requirements/page.tsx" ""

create_dir "app/(public)/admissions"
create_file "app/(public)/admissions/page.tsx" ""
create_dir "app/(public)/admissions/entry-requirements"
create_file "app/(public)/admissions/entry-requirements/page.tsx" ""
create_dir "app/(public)/admissions/fees-and-payment"
create_file "app/(public)/admissions/fees-and-payment/page.tsx" ""
create_dir "app/(public)/admissions/faq"
create_file "app/(public)/admissions/faq/page.tsx" ""

create_dir "app/(public)/newsroom"
create_file "app/(public)/newsroom/page.tsx" ""
create_dir "app/(public)/newsroom/[slug]"
create_file "app/(public)/newsroom/[slug]/page.tsx" ""

create_dir "app/(public)/contact"
create_file "app/(public)/contact/page.tsx" ""

create_dir "app/(public)/privacy-policy"
create_file "app/(public)/privacy-policy/page.tsx" ""

create_dir "app/(public)/online-application-terms"
create_file "app/(public)/online-application-terms/page.tsx" ""

create_dir "app/(public)/_components"
create_file "app/(public)/_components/Hero.tsx" ""
create_file "app/(public)/_components/TrustStrip.tsx" ""
create_file "app/(public)/_components/ProgramCard.tsx" ""
create_file "app/(public)/_components/EnrollmentSteps.tsx" ""
create_file "app/(public)/_components/CourseComparison.tsx" ""
create_file "app/(public)/_components/NewsCard.tsx" ""

# (auth) - Authentication
create_dir "app/(auth)"
create_file "app/(auth)/layout.tsx" ""

create_dir "app/(auth)/login"
create_file "app/(auth)/login/page.tsx" ""
create_dir "app/(auth)/login/_components"
create_file "app/(auth)/login/_components/LoginForm.tsx" ""

create_dir "app/(auth)/register"
create_file "app/(auth)/register/page.tsx" ""
create_dir "app/(auth)/register/_components"
create_file "app/(auth)/register/_components/RegistrationForm.tsx" ""
create_file "app/(auth)/register/_components/PaymentInstructions.tsx" ""

create_dir "app/(auth)/forgot-password"
create_file "app/(auth)/forgot-password/page.tsx" ""

create_dir "app/(auth)/reset-password"
create_file "app/(auth)/reset-password/page.tsx" ""

create_dir "app/(auth)/verify-email"
create_file "app/(auth)/verify-email/page.tsx" ""

# (staff) - Staff/Admin Portal
create_dir "app/(staff)"
create_file "app/(staff)/layout.tsx" ""
create_file "app/(staff)/page.tsx" ""
create_file "app/(staff)/loading.tsx" ""
create_file "app/(staff)/error.tsx" ""

create_dir "app/(staff)/dashboard"
create_file "app/(staff)/dashboard/page.tsx" ""

create_dir "app/(staff)/users"
create_file "app/(staff)/users/page.tsx" ""
create_dir "app/(staff)/users/[id]"
create_file "app/(staff)/users/[id]/page.tsx" ""
create_dir "app/(staff)/users/[id]/edit"
create_file "app/(staff)/users/[id]/edit/page.tsx" ""
create_dir "app/(staff)/users/create"
create_file "app/(staff)/users/create/page.tsx" ""

create_dir "app/(staff)/applicants"
create_file "app/(staff)/applicants/page.tsx" ""
create_dir "app/(staff)/applicants/[id]"
create_file "app/(staff)/applicants/[id]/page.tsx" ""

create_dir "app/(staff)/students"
create_file "app/(staff)/students/page.tsx" ""
create_dir "app/(staff)/students/[id]"
create_file "app/(staff)/students/[id]/page.tsx" ""
create_dir "app/(staff)/students/[id]/grades"
create_file "app/(staff)/students/[id]/grades/page.tsx" ""
create_dir "app/(staff)/students/[id]/attendance"
create_file "app/(staff)/students/[id]/attendance/page.tsx" ""
create_dir "app/(staff)/students/[id]/wallet"
create_file "app/(staff)/students/[id]/wallet/page.tsx" ""
create_dir "app/(staff)/students/import"
create_file "app/(staff)/students/import/page.tsx" ""

create_dir "app/(staff)/enrollments"
create_file "app/(staff)/enrollments/page.tsx" ""
create_dir "app/(staff)/enrollments/pending"
create_file "app/(staff)/enrollments/pending/page.tsx" ""
create_dir "app/(staff)/enrollments/[id]"
create_file "app/(staff)/enrollments/[id]/page.tsx" ""

create_dir "app/(staff)/payments"
create_file "app/(staff)/payments/page.tsx" ""
create_dir "app/(staff)/payments/pending"
create_file "app/(staff)/payments/pending/page.tsx" ""
create_dir "app/(staff)/payments/approved"
create_file "app/(staff)/payments/approved/page.tsx" ""
create_dir "app/(staff)/payments/rejected"
create_file "app/(staff)/payments/rejected/page.tsx" ""
create_dir "app/(staff)/payments/[id]"
create_file "app/(staff)/payments/[id]/page.tsx" ""

create_dir "app/(staff)/finance"
create_file "app/(staff)/finance/page.tsx" ""
create_dir "app/(staff)/finance/wallet-topups"
create_file "app/(staff)/finance/wallet-topups/page.tsx" ""
create_dir "app/(staff)/finance/transactions"
create_file "app/(staff)/finance/transactions/page.tsx" ""
create_dir "app/(staff)/finance/reports"
create_file "app/(staff)/finance/reports/page.tsx" ""

create_dir "app/(staff)/courses"
create_file "app/(staff)/courses/page.tsx" ""
create_dir "app/(staff)/courses/create"
create_file "app/(staff)/courses/create/page.tsx" ""
create_dir "app/(staff)/courses/[id]"
create_file "app/(staff)/courses/[id]/page.tsx" ""
create_dir "app/(staff)/courses/[id]/edit"
create_file "app/(staff)/courses/[id]/edit/page.tsx" ""

create_dir "app/(staff)/classes"
create_file "app/(staff)/classes/page.tsx" ""
create_dir "app/(staff)/classes/create"
create_file "app/(staff)/classes/create/page.tsx" ""
create_dir "app/(staff)/classes/[id]"
create_file "app/(staff)/classes/[id]/page.tsx" ""
create_dir "app/(staff)/classes/[id]/roster"
create_file "app/(staff)/classes/[id]/roster/page.tsx" ""

create_dir "app/(staff)/exams/events"
create_file "app/(staff)/exams/events/page.tsx" ""
create_dir "app/(staff)/exams/events/create"
create_file "app/(staff)/exams/events/create/page.tsx" ""
create_dir "app/(staff)/exams/events/[id]"
create_file "app/(staff)/exams/events/[id]/page.tsx" ""
create_dir "app/(staff)/exams/events/[id]/pools"
create_file "app/(staff)/exams/events/[id]/pools/page.tsx" ""
create_dir "app/(staff)/exams/events/[id]/go-no-go"
create_file "app/(staff)/exams/events/[id]/go-no-go/page.tsx" ""

create_dir "app/(staff)/exams/pools/[id]"
create_file "app/(staff)/exams/pools/[id]/page.tsx" ""
create_dir "app/(staff)/exams/pools/[id]/members"
create_file "app/(staff)/exams/pools/[id]/members/page.tsx" ""

create_dir "app/(staff)/exams/bookings"
create_file "app/(staff)/exams/bookings/page.tsx" ""

create_dir "app/(staff)/exams/results"
create_file "app/(staff)/exams/results/page.tsx" ""
create_dir "app/(staff)/exams/results/upload"
create_file "app/(staff)/exams/results/upload/page.tsx" ""

create_dir "app/(staff)/instructors"
create_file "app/(staff)/instructors/page.tsx" ""
create_dir "app/(staff)/instructors/[id]"
create_file "app/(staff)/instructors/[id]/page.tsx" ""
create_dir "app/(staff)/instructors/[id]/assignments"
create_file "app/(staff)/instructors/[id]/assignments/page.tsx" ""

create_dir "app/(staff)/reports"
create_file "app/(staff)/reports/page.tsx" ""
create_dir "app/(staff)/reports/enrollment-trends"
create_file "app/(staff)/reports/enrollment-trends/page.tsx" ""
create_dir "app/(staff)/reports/revenue"
create_file "app/(staff)/reports/revenue/page.tsx" ""
create_dir "app/(staff)/reports/pool-analytics"
create_file "app/(staff)/reports/pool-analytics/page.tsx" ""
create_dir "app/(staff)/reports/attendance"
create_file "app/(staff)/reports/attendance/page.tsx" ""

create_dir "app/(staff)/audit-logs"
create_file "app/(staff)/audit-logs/page.tsx" ""

create_dir "app/(staff)/settings"
create_file "app/(staff)/settings/page.tsx" ""
create_dir "app/(staff)/settings/general"
create_file "app/(staff)/settings/general/page.tsx" ""
create_dir "app/(staff)/settings/bank-details"
create_file "app/(staff)/settings/bank-details/page.tsx" ""
create_dir "app/(staff)/settings/email"
create_file "app/(staff)/settings/email/page.tsx" ""
create_dir "app/(staff)/settings/permissions"
create_file "app/(staff)/settings/permissions/page.tsx" ""

create_dir "app/(staff)/_components"
create_file "app/(staff)/_components/StaffSidebar.tsx" ""
create_file "app/(staff)/_components/UserActionsMenu.tsx" ""
create_file "app/(staff)/_components/PaymentApprovalCard.tsx" ""
create_file "app/(staff)/_components/PoolStatusBadge.tsx" ""
create_file "app/(staff)/_components/GoNoGoMeter.tsx" ""
create_file "app/(staff)/_components/RevenueChart.tsx" ""

# (applicant) - Applicant Portal
create_dir "app/(applicant)"
create_file "app/(applicant)/layout.tsx" ""
create_file "app/(applicant)/page.tsx" ""
create_file "app/(applicant)/loading.tsx" ""
create_file "app/(applicant)/error.tsx" ""

create_dir "app/(applicant)/dashboard"
create_file "app/(applicant)/dashboard/page.tsx" ""

create_dir "app/(applicant)/application/status"
create_file "app/(applicant)/application/status/page.tsx" ""
create_dir "app/(applicant)/application/payment"
create_file "app/(applicant)/application/payment/page.tsx" ""

create_dir "app/(applicant)/courses"
create_file "app/(applicant)/courses/page.tsx" ""
create_dir "app/(applicant)/courses/[id]"
create_file "app/(applicant)/courses/[id]/page.tsx" ""
create_dir "app/(applicant)/courses/purchase"
create_file "app/(applicant)/courses/purchase/page.tsx" ""

create_dir "app/(applicant)/exam-pools"
create_file "app/(applicant)/exam-pools/page.tsx" ""
create_dir "app/(applicant)/exam-pools/[id]"
create_file "app/(applicant)/exam-pools/[id]/page.tsx" ""

create_dir "app/(applicant)/profile"
create_file "app/(applicant)/profile/page.tsx" ""

create_dir "app/(applicant)/_components"
create_file "app/(applicant)/_components/ApplicationStatusCard.tsx" ""
create_file "app/(applicant)/_components/CourseCard.tsx" ""
create_file "app/(applicant)/_components/PaymentUpload.tsx" ""

# (student) - Student Portal
create_dir "app/(student)"
create_file "app/(student)/layout.tsx" ""
create_file "app/(student)/page.tsx" ""
create_file "app/(student)/loading.tsx" ""
create_file "app/(student)/error.tsx" ""

create_dir "app/(student)/dashboard"
create_file "app/(student)/dashboard/page.tsx" ""

create_dir "app/(student)/wallet"
create_file "app/(student)/wallet/page.tsx" ""
create_dir "app/(student)/wallet/top-up"
create_file "app/(student)/wallet/top-up/page.tsx" ""
create_dir "app/(student)/wallet/transactions"
create_file "app/(student)/wallet/transactions/page.tsx" ""

create_dir "app/(student)/courses"
create_file "app/(student)/courses/page.tsx" ""
create_dir "app/(student)/courses/[id]"
create_file "app/(student)/courses/[id]/page.tsx" ""
create_dir "app/(student)/courses/[id]/materials"
create_file "app/(student)/courses/[id]/materials/page.tsx" ""
create_dir "app/(student)/courses/[id]/grades"
create_file "app/(student)/courses/[id]/grades/page.tsx" ""
create_dir "app/(student)/courses/enroll"
create_file "app/(student)/courses/enroll/page.tsx" ""

create_dir "app/(student)/exam-pools"
create_file "app/(student)/exam-pools/page.tsx" ""
create_dir "app/(student)/exam-pools/my-bookings"
create_file "app/(student)/exam-pools/my-bookings/page.tsx" ""
create_dir "app/(student)/exam-pools/[id]"
create_file "app/(student)/exam-pools/[id]/page.tsx" ""
create_dir "app/(student)/exam-pools/[id]/join"
create_file "app/(student)/exam-pools/[id]/join/page.tsx" ""

create_dir "app/(student)/exams"
create_file "app/(student)/exams/page.tsx" ""
create_dir "app/(student)/exams/schedule"
create_file "app/(student)/exams/schedule/page.tsx" ""
create_dir "app/(student)/exams/results"
create_file "app/(student)/exams/results/page.tsx" ""

create_dir "app/(student)/grades"
create_file "app/(student)/grades/page.tsx" ""

create_dir "app/(student)/attendance"
create_file "app/(student)/attendance/page.tsx" ""

create_dir "app/(student)/certificates"
create_file "app/(student)/certificates/page.tsx" ""

create_dir "app/(student)/notifications"
create_file "app/(student)/notifications/page.tsx" ""

create_dir "app/(student)/profile"
create_file "app/(student)/profile/page.tsx" ""
create_dir "app/(student)/profile/settings"
create_file "app/(student)/profile/settings/page.tsx" ""
create_dir "app/(student)/profile/change-password"
create_file "app/(student)/profile/change-password/page.tsx" ""

create_dir "app/(student)/_components"
create_file "app/(student)/_components/StudentSidebar.tsx" ""
create_file "app/(student)/_components/WalletCard.tsx" ""
create_file "app/(student)/_components/PoolCard.tsx" ""
create_file "app/(student)/_components/GradeCard.tsx" ""
create_file "app/(student)/_components/AttendanceChart.tsx" ""
create_file "app/(student)/_components/UpcomingExamCard.tsx" ""

# (instructor) - Instructor Portal
create_dir "app/(instructor)"
create_file "app/(instructor)/layout.tsx" ""
create_file "app/(instructor)/page.tsx" ""
create_file "app/(instructor)/loading.tsx" ""
create_file "app/(instructor)/error.tsx" ""

create_dir "app/(instructor)/dashboard"
create_file "app/(instructor)/dashboard/page.tsx" ""

create_dir "app/(instructor)/classes"
create_file "app/(instructor)/classes/page.tsx" ""
create_dir "app/(instructor)/classes/[id]"
create_file "app/(instructor)/classes/[id]/page.tsx" ""
create_dir "app/(instructor)/classes/[id]/roster"
create_file "app/(instructor)/classes/[id]/roster/page.tsx" ""
create_dir "app/(instructor)/classes/[id]/attendance"
create_file "app/(instructor)/classes/[id]/attendance/page.tsx" ""
create_dir "app/(instructor)/classes/[id]/grades"
create_file "app/(instructor)/classes/[id]/grades/page.tsx" ""
create_dir "app/(instructor)/classes/[id]/materials"
create_file "app/(instructor)/classes/[id]/materials/page.tsx" ""

create_dir "app/(instructor)/schedule"
create_file "app/(instructor)/schedule/page.tsx" ""

create_dir "app/(instructor)/students"
create_file "app/(instructor)/students/page.tsx" ""
create_dir "app/(instructor)/students/[id]"
create_file "app/(instructor)/students/[id]/page.tsx" ""

create_dir "app/(instructor)/grading/pending"
create_file "app/(instructor)/grading/pending/page.tsx" ""
create_dir "app/(instructor)/grading/history"
create_file "app/(instructor)/grading/history/page.tsx" ""

create_dir "app/(instructor)/profile"
create_file "app/(instructor)/profile/page.tsx" ""

create_dir "app/(instructor)/_components"
create_file "app/(instructor)/_components/InstructorSidebar.tsx" ""
create_file "app/(instructor)/_components/ClassCard.tsx" ""
create_file "app/(instructor)/_components/AttendanceForm.tsx" ""
create_file "app/(instructor)/_components/GradingForm.tsx" ""

################################################################################
# API ROUTES
################################################################################

echo ""
echo -e "${BLUE}[3/15] Creating API routes...${NC}"

create_dir "app/api"

# Auth API
create_dir "app/api/auth/[...nextauth]"
create_file "app/api/auth/[...nextauth]/route.ts" ""

# Public API
create_dir "app/api/public/register"
create_file "app/api/public/register/route.ts" ""
create_dir "app/api/public/contact"
create_file "app/api/public/contact/route.ts" ""
create_dir "app/api/public/submit-payment-proof"
create_file "app/api/public/submit-payment-proof/route.ts" ""

# Staff API
create_dir "app/api/staff/users"
create_file "app/api/staff/users/route.ts" ""
create_dir "app/api/staff/users/[id]"
create_file "app/api/staff/users/[id]/route.ts" ""
create_dir "app/api/staff/users/create"
create_file "app/api/staff/users/create/route.ts" ""

create_dir "app/api/staff/applicants"
create_file "app/api/staff/applicants/route.ts" ""
create_dir "app/api/staff/applicants/[id]/approve"
create_file "app/api/staff/applicants/[id]/approve/route.ts" ""

create_dir "app/api/staff/students"
create_file "app/api/staff/students/route.ts" ""
create_dir "app/api/staff/students/[id]"
create_file "app/api/staff/students/[id]/route.ts" ""
create_dir "app/api/staff/students/[id]/wallet"
create_file "app/api/staff/students/[id]/wallet/route.ts" ""
create_dir "app/api/staff/students/import"
create_file "app/api/staff/students/import/route.ts" ""

create_dir "app/api/staff/enrollments"
create_file "app/api/staff/enrollments/route.ts" ""
create_dir "app/api/staff/enrollments/[id]/approve"
create_file "app/api/staff/enrollments/[id]/approve/route.ts" ""

create_dir "app/api/staff/payments/pending"
create_file "app/api/staff/payments/pending/route.ts" ""
create_dir "app/api/staff/payments/[id]/approve"
create_file "app/api/staff/payments/[id]/approve/route.ts" ""

create_dir "app/api/staff/wallet-topups/pending"
create_file "app/api/staff/wallet-topups/pending/route.ts" ""
create_dir "app/api/staff/wallet-topups/[id]/approve"
create_file "app/api/staff/wallet-topups/[id]/approve/route.ts" ""

create_dir "app/api/staff/courses"
create_file "app/api/staff/courses/route.ts" ""
create_dir "app/api/staff/courses/[id]"
create_file "app/api/staff/courses/[id]/route.ts" ""

create_dir "app/api/staff/classes"
create_file "app/api/staff/classes/route.ts" ""
create_dir "app/api/staff/classes/[id]"
create_file "app/api/staff/classes/[id]/route.ts" ""
create_dir "app/api/staff/classes/[id]/roster"
create_file "app/api/staff/classes/[id]/roster/route.ts" ""

create_dir "app/api/staff/exam-events"
create_file "app/api/staff/exam-events/route.ts" ""
create_dir "app/api/staff/exam-events/[id]"
create_file "app/api/staff/exam-events/[id]/route.ts" ""
create_dir "app/api/staff/exam-events/[id]/pools"
create_file "app/api/staff/exam-events/[id]/pools/route.ts" ""
create_dir "app/api/staff/exam-events/[id]/go-no-go"
create_file "app/api/staff/exam-events/[id]/go-no-go/route.ts" ""
create_dir "app/api/staff/exam-events/upcoming"
create_file "app/api/staff/exam-events/upcoming/route.ts" ""

create_dir "app/api/staff/exam-pools/[id]"
create_file "app/api/staff/exam-pools/[id]/route.ts" ""
create_dir "app/api/staff/exam-pools/[id]/confirm"
create_file "app/api/staff/exam-pools/[id]/confirm/route.ts" ""

create_dir "app/api/staff/audit-logs"
create_file "app/api/staff/audit-logs/route.ts" ""

create_dir "app/api/staff/reports/enrollment"
create_file "app/api/staff/reports/enrollment/route.ts" ""
create_dir "app/api/staff/reports/revenue"
create_file "app/api/staff/reports/revenue/route.ts" ""
create_dir "app/api/staff/reports/pools"
create_file "app/api/staff/reports/pools/route.ts" ""

create_dir "app/api/staff/settings"
create_file "app/api/staff/settings/route.ts" ""
create_dir "app/api/staff/settings/[key]"
create_file "app/api/staff/settings/[key]/route.ts" ""

# Applicant API
create_dir "app/api/applicant/dashboard"
create_file "app/api/applicant/dashboard/route.ts" ""
create_dir "app/api/applicant/courses"
create_file "app/api/applicant/courses/route.ts" ""
create_dir "app/api/applicant/courses/[id]"
create_file "app/api/applicant/courses/[id]/route.ts" ""
create_dir "app/api/applicant/courses/[id]/purchase"
create_file "app/api/applicant/courses/[id]/purchase/route.ts" ""
create_dir "app/api/applicant/profile"
create_file "app/api/applicant/profile/route.ts" ""
create_dir "app/api/applicant/upload-payment"
create_file "app/api/applicant/upload-payment/route.ts" ""

# Student API
create_dir "app/api/student/dashboard"
create_file "app/api/student/dashboard/route.ts" ""

create_dir "app/api/student/wallet"
create_file "app/api/student/wallet/route.ts" ""
create_dir "app/api/student/wallet/top-up"
create_file "app/api/student/wallet/top-up/route.ts" ""
create_dir "app/api/student/wallet/transactions"
create_file "app/api/student/wallet/transactions/route.ts" ""

create_dir "app/api/student/courses"
create_file "app/api/student/courses/route.ts" ""
create_dir "app/api/student/courses/[id]"
create_file "app/api/student/courses/[id]/route.ts" ""
create_dir "app/api/student/courses/[id]/materials"
create_file "app/api/student/courses/[id]/materials/route.ts" ""

create_dir "app/api/student/exam-pools/available"
create_file "app/api/student/exam-pools/available/route.ts" ""
create_dir "app/api/student/exam-pools/my-bookings"
create_file "app/api/student/exam-pools/my-bookings/route.ts" ""
create_dir "app/api/student/exam-pools/[id]/join"
create_file "app/api/student/exam-pools/[id]/join/route.ts" ""

create_dir "app/api/student/grades"
create_file "app/api/student/grades/route.ts" ""

create_dir "app/api/student/attendance"
create_file "app/api/student/attendance/route.ts" ""

create_dir "app/api/student/exams"
create_file "app/api/student/exams/route.ts" ""
create_dir "app/api/student/exams/results"
create_file "app/api/student/exams/results/route.ts" ""

create_dir "app/api/student/certificates"
create_file "app/api/student/certificates/route.ts" ""

create_dir "app/api/student/notifications"
create_file "app/api/student/notifications/route.ts" ""

create_dir "app/api/student/profile"
create_file "app/api/student/profile/route.ts" ""
create_dir "app/api/student/profile/change-password"
create_file "app/api/student/profile/change-password/route.ts" ""

# Instructor API
create_dir "app/api/instructor/dashboard"
create_file "app/api/instructor/dashboard/route.ts" ""

create_dir "app/api/instructor/classes"
create_file "app/api/instructor/classes/route.ts" ""
create_dir "app/api/instructor/classes/[id]"
create_file "app/api/instructor/classes/[id]/route.ts" ""
create_dir "app/api/instructor/classes/[id]/roster"
create_file "app/api/instructor/classes/[id]/roster/route.ts" ""
create_dir "app/api/instructor/classes/[id]/attendance"
create_file "app/api/instructor/classes/[id]/attendance/route.ts" ""
create_dir "app/api/instructor/classes/[id]/grades"
create_file "app/api/instructor/classes/[id]/grades/route.ts" ""

create_dir "app/api/instructor/schedule"
create_file "app/api/instructor/schedule/route.ts" ""

create_dir "app/api/instructor/profile"
create_file "app/api/instructor/profile/route.ts" ""

# UploadThing API
create_dir "app/api/uploadthing"
create_file "app/api/uploadthing/route.ts" ""

# Cron API
create_dir "app/api/cron/check-pools"
create_file "app/api/cron/check-pools/route.ts" ""
create_dir "app/api/cron/check-events"
create_file "app/api/cron/check-events/route.ts" ""
create_dir "app/api/cron/send-reminders"
create_file "app/api/cron/send-reminders/route.ts" ""

# Webhooks API
create_dir "app/api/webhooks/stripe"
create_file "app/api/webhooks/stripe/route.ts" ""
create_dir "app/api/webhooks/uploadthing"
create_file "app/api/webhooks/uploadthing/route.ts" ""

################################################################################
# COMPONENTS
################################################################################

echo ""
echo -e "${BLUE}[4/15] Creating components...${NC}"

create_dir "components"

# UI Components (shadcn/ui)
create_dir "components/ui"
create_file "components/ui/button.tsx" ""
create_file "components/ui/card.tsx" ""
create_file "components/ui/dialog.tsx" ""
create_file "components/ui/dropdown-menu.tsx" ""
create_file "components/ui/input.tsx" ""
create_file "components/ui/label.tsx" ""
create_file "components/ui/select.tsx" ""
create_file "components/ui/separator.tsx" ""
create_file "components/ui/table.tsx" ""
create_file "components/ui/tabs.tsx" ""
create_file "components/ui/toast.tsx" ""
create_file "components/ui/toaster.tsx" ""
create_file "components/ui/tooltip.tsx" ""
create_file "components/ui/badge.tsx" ""
create_file "components/ui/avatar.tsx" ""
create_file "components/ui/progress.tsx" ""
create_file "components/ui/switch.tsx" ""
create_file "components/ui/skeleton.tsx" ""
create_file "components/ui/sheet.tsx" ""
create_file "components/ui/alert.tsx" ""
create_file "components/ui/alert-dialog.tsx" ""
create_file "components/ui/command.tsx" ""

# Layout Components
create_dir "components/layouts"
create_file "components/layouts/PublicNav.tsx" ""
create_file "components/layouts/PublicFooter.tsx" ""
create_file "components/layouts/DashboardSidebar.tsx" ""
create_file "components/layouts/MobileNav.tsx" ""
create_file "components/layouts/BreadcrumbNav.tsx" ""

# Shared Components
create_dir "components/shared"
create_file "components/shared/LoadingSpinner.tsx" ""
create_file "components/shared/PageLoading.tsx" ""
create_file "components/shared/EmptyState.tsx" ""
create_file "components/shared/ErrorMessage.tsx" ""
create_file "components/shared/ConfirmDialog.tsx" ""
create_file "components/shared/DataTable.tsx" ""
create_file "components/shared/Pagination.tsx" ""
create_file "components/shared/SearchInput.tsx" ""
create_file "components/shared/FileUpload.tsx" ""
create_file "components/shared/DatePicker.tsx" ""
create_file "components/shared/StatusBadge.tsx" ""
create_file "components/shared/UserAvatar.tsx" ""
create_file "components/shared/ThemeToggle.tsx" ""

# Form Components
create_dir "components/forms"
create_file "components/forms/FormField.tsx" ""
create_file "components/forms/FormError.tsx" ""
create_file "components/forms/FormSuccess.tsx" ""
create_file "components/forms/SubmitButton.tsx" ""

# Chart Components
create_dir "components/charts"
create_file "components/charts/RevenueChart.tsx" ""
create_file "components/charts/EnrollmentChart.tsx" ""
create_file "components/charts/AttendanceChart.tsx" ""
create_file "components/charts/PoolFillChart.tsx" ""

################################################################################
# LIB (LIBRARIES)
################################################################################

echo ""
echo -e "${BLUE}[5/15] Creating lib directory...${NC}"

create_dir "lib"

# Auth
create_dir "lib/auth"
create_file "lib/auth/index.ts" ""
create_file "lib/auth/auth-options.ts" ""
create_file "lib/auth/session.ts" ""
create_file "lib/auth/permissions.ts" ""
create_file "lib/auth/middleware-helpers.ts" ""

# Database
create_dir "lib/database"
create_file "lib/database/prisma.ts" ""
create_file "lib/database/seed-utils.ts" ""

# Email
create_dir "lib/email"
create_file "lib/email/index.ts" ""
create_file "lib/email/sender.ts" ""
create_file "lib/email/templates.ts" ""
create_file "lib/email/types.ts" ""

# Wallet
create_dir "lib/wallet"
create_file "lib/wallet/index.ts" ""
create_file "lib/wallet/operations.ts" ""
create_file "lib/wallet/balance.ts" ""
create_file "lib/wallet/transactions.ts" ""
create_file "lib/wallet/types.ts" ""

# Pools
create_dir "lib/pools"
create_file "lib/pools/index.ts" ""
create_file "lib/pools/join.ts" ""
create_file "lib/pools/confirm.ts" ""
create_file "lib/pools/validation.ts" ""
create_file "lib/pools/types.ts" ""

# Students
create_dir "lib/students"
create_file "lib/students/index.ts" ""
create_file "lib/students/id-generator.ts" ""
create_file "lib/students/promotion.ts" ""
create_file "lib/students/types.ts" ""

# Staff
create_dir "lib/staff"
create_file "lib/staff/index.ts" ""
create_file "lib/staff/permissions.ts" ""
create_file "lib/staff/approvals.ts" ""
create_file "lib/staff/types.ts" ""

# Payments
create_dir "lib/payments"
create_file "lib/payments/index.ts" ""
create_file "lib/payments/verification.ts" ""
create_file "lib/payments/stripe.ts" ""
create_file "lib/payments/types.ts" ""

# Uploads
create_dir "lib/uploads"
create_file "lib/uploads/uploadthing.ts" ""
create_file "lib/uploads/validation.ts" ""

# Validation
create_dir "lib/validation"
create_file "lib/validation/schemas.ts" ""
create_file "lib/validation/auth.ts" ""
create_file "lib/validation/student.ts" ""
create_file "lib/validation/pool.ts" ""
create_file "lib/validation/payment.ts" ""

# Security
create_dir "lib/security"
create_file "lib/security/rate-limit.ts" ""
create_file "lib/security/encryption.ts" ""
create_file "lib/security/sanitization.ts" ""
create_file "lib/security/csrf.ts" ""

# Analytics
create_dir "lib/analytics"
create_file "lib/analytics/events.ts" ""
create_file "lib/analytics/reports.ts" ""
create_file "lib/analytics/metrics.ts" ""

# Utils
create_dir "lib/utils"
create_file "lib/utils/index.ts" ""
create_file "lib/utils/date.ts" ""
create_file "lib/utils/currency.ts" ""
create_file "lib/utils/string.ts" ""
create_file "lib/utils/array.ts" ""
create_file "lib/utils/validation.ts" ""
create_file "lib/utils/constants.ts" ""

################################################################################
# HOOKS
################################################################################

echo ""
echo -e "${BLUE}[6/15] Creating hooks...${NC}"

create_dir "hooks"
create_file "hooks/use-current-user.ts" ""
create_file "hooks/use-current-role.ts" ""
create_file "hooks/use-wallet-balance.ts" ""
create_file "hooks/use-toast.ts" ""
create_file "hooks/use-debounce.ts" ""
create_file "hooks/use-pagination.ts" ""
create_file "hooks/use-table-sort.ts" ""
create_file "hooks/use-table-filter.ts" ""
create_file "hooks/use-mobile.ts" ""
create_file "hooks/use-confirm-dialog.ts" ""

################################################################################
# TYPES
################################################################################

echo ""
echo -e "${BLUE}[7/15] Creating types...${NC}"

create_dir "types"
create_file "types/index.ts" ""
create_file "types/next-auth.d.ts" ""
create_file "types/api.ts" ""
create_file "types/database.ts" ""
create_file "types/wallet.ts" ""
create_file "types/pool.ts" ""
create_file "types/student.ts" ""
create_file "types/course.ts" ""
create_file "types/enums.ts" ""

################################################################################
# PRISMA
################################################################################

echo ""
echo -e "${BLUE}[8/15] Creating prisma directory...${NC}"

create_dir "prisma"
create_file "prisma/schema.prisma" ""
create_file "prisma/seed.ts" ""
create_dir "prisma/seed-data"
create_file "prisma/seed-data/users.json" "[]"
create_file "prisma/seed-data/courses.json" "[]"
create_file "prisma/seed-data/settings.json" "[]"

################################################################################
# PUBLIC
################################################################################

echo ""
echo -e "${BLUE}[9/15] Creating public directory...${NC}"

create_dir "public"
create_dir "public/images/logos"
create_dir "public/images/courses"
create_dir "public/images/partners"
create_dir "public/images/hero"
create_dir "public/documents"
create_file "public/favicon.ico" ""

################################################################################
# SCRIPTS
################################################################################

echo ""
echo -e "${BLUE}[10/15] Creating scripts...${NC}"

create_dir "scripts"
create_file "scripts/seed-database.ts" ""
create_file "scripts/migrate-data.ts" ""
create_file "scripts/generate-student-ids.ts" ""
create_file "scripts/export-data.ts" ""
create_file "scripts/cleanup-old-files.ts" ""
create_file "scripts/check-pool-status.ts" ""

################################################################################
# TESTS
################################################################################

echo ""
echo -e "${BLUE}[11/15] Creating tests...${NC}"

create_dir "tests"
create_file "tests/setup.ts" ""

create_dir "tests/unit/lib"
create_file "tests/unit/lib/wallet.test.ts" ""
create_file "tests/unit/lib/pools.test.ts" ""
create_file "tests/unit/lib/student-id.test.ts" ""

create_dir "tests/unit/utils"
create_file "tests/unit/utils/date.test.ts" ""
create_file "tests/unit/utils/currency.test.ts" ""

create_dir "tests/integration/api"
create_file "tests/integration/api/auth.test.ts" ""
create_file "tests/integration/api/pool-join.test.ts" ""
create_file "tests/integration/api/payment-approval.test.ts" ""

create_dir "tests/integration/workflows"
create_file "tests/integration/workflows/registration.test.ts" ""
create_file "tests/integration/workflows/pool-confirmation.test.ts" ""

create_dir "tests/e2e"
create_file "tests/e2e/student-journey.test.ts" ""
create_file "tests/e2e/staff-approval.test.ts" ""
create_file "tests/e2e/pool-joining.test.ts" ""

create_dir "tests/fixtures"
create_file "tests/fixtures/users.ts" ""
create_file "tests/fixtures/pools.ts" ""
create_file "tests/fixtures/transactions.ts" ""

################################################################################
# DOCS
################################################################################

echo ""
echo -e "${BLUE}[12/15] Creating docs...${NC}"

create_dir "docs"
create_file "docs/README.md" "# Aerojet Academy Documentation

## Quick Links
- [Setup Guide](./SETUP.md)
- [API Documentation](./API.md)
- [Database Schema](./DATABASE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Security Guidelines](./SECURITY.md)
- [Contributing](./CONTRIBUTING.md)

## Architecture
- [System Overview](./architecture/system-overview.md)
- [Data Flow](./architecture/data-flow.md)
- [Security Model](./architecture/security-model.md)"

create_file "docs/SETUP.md" "# Setup Guide

Coming soon..."

create_file "docs/API.md" "# API Documentation

Coming soon..."

create_file "docs/DATABASE.md" "# Database Schema

Coming soon..."

create_file "docs/DEPLOYMENT.md" "# Deployment Guide

Coming soon..."

create_file "docs/SECURITY.md" "# Security Guidelines

Coming soon..."

create_file "docs/CONTRIBUTING.md" "# Contributing Guide

Coming soon..."

create_file "docs/CHANGELOG.md" "# Changelog

## [Unreleased]
- Initial project structure"

create_dir "docs/architecture"
create_file "docs/architecture/system-overview.md" "# System Overview

Coming soon..."

create_file "docs/architecture/data-flow.md" "# Data Flow

Coming soon..."

create_file "docs/architecture/security-model.md" "# Security Model

Coming soon..."

################################################################################
# GITHUB
################################################################################

echo ""
echo -e "${BLUE}[13/15] Creating GitHub workflows...${NC}"

create_dir ".github/workflows"
create_file ".github/workflows/ci.yml" "name: CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm test"

create_file ".github/workflows/deploy-staging.yml" "name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Staging
        run: echo 'Deploy to staging'"

create_file ".github/workflows/deploy-production.yml" "name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Production
        run: echo 'Deploy to production'"

create_file ".github/CODEOWNERS" "# Code Owners
* @your-org/aerojet-team

# API Routes
/app/api/ @your-org/backend-team

# Components
/components/ @your-org/frontend-team

# Database
/prisma/ @your-org/database-team"

################################################################################
# HUSKY
################################################################################

echo ""
echo -e "${BLUE}[14/15] Creating Husky hooks...${NC}"

create_dir ".husky"
create_file ".husky/pre-commit" "#!/usr/bin/env sh
. \"\$(dirname -- \"\$0\")/_/husky.sh\"

npm run lint"

create_file ".husky/pre-push" "#!/usr/bin/env sh
. \"\$(dirname -- \"\$0\")/_/husky.sh\"

npm test"

################################################################################
# VSCODE
################################################################################

echo ""
echo -e "${BLUE}[15/15] Creating VS Code settings...${NC}"

create_dir ".vscode"
create_file ".vscode/settings.json" "{
  \"editor.formatOnSave\": true,
  \"editor.defaultFormatter\": \"esbenp.prettier-vscode\",
  \"editor.codeActionsOnSave\": {
    \"source.fixAll.eslint\": true
  },
  \"typescript.tsdk\": \"node_modules/typescript/lib\",
  \"typescript.enablePromptUseWorkspaceTsdk\": true
}"

create_file ".vscode/extensions.json" "{
  \"recommendations\": [
    \"dbaeumer.vscode-eslint\",
    \"esbenp.prettier-vscode\",
    \"prisma.prisma\",
    \"bradlc.vscode-tailwindcss\"
  ]
}"

create_file ".vscode/launch.json" "{
  \"version\": \"0.2.0\",
  \"configurations\": [
    {
      \"name\": \"Next.js: debug server-side\",
      \"type\": \"node-terminal\",
      \"request\": \"launch\",
      \"command\": \"npm run dev\"
    },
    {
      \"name\": \"Next.js: debug client-side\",
      \"type\": \"chrome\",
      \"request\": \"launch\",
      \"url\": \"http://localhost:3000\"
    }
  ]
}"

################################################################################
# COMPLETION
################################################################################

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  SETUP COMPLETE! ✓                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Project structure created successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "1. Install dependencies:"
echo "   ${GREEN}npm install${NC}"
echo ""
echo "2. Copy your public website files to:"
echo "   ${GREEN}app/(public)/${NC}"
echo ""
echo "3. Set up environment variables:"
echo "   ${GREEN}cp .env.example .env.local${NC}"
echo "   ${GREEN}# Edit .env.local with your values${NC}"
echo ""
echo "4. Initialize database:"
echo "   ${GREEN}npx prisma generate${NC}"
echo "   ${GREEN}npx prisma migrate dev --name init${NC}"
echo ""
echo "5. Start development server:"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo -e "${BLUE}All files and folders have been created!${NC}"
echo -e "${YELLOW}Empty files are ready to be filled one by one.${NC}"
echo ""
