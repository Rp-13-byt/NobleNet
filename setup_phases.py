import subprocess
import os

def run_git(args):
    res = subprocess.run(["git"] + args, cwd=r"D:\NobleNet", capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error running git {' '.join(args)}:\n{res.stderr}")
    return res

# Configure user
run_git(["config", "user.name", "Rp-13-byt"])
run_git(["config", "user.email", "rajenpatel1902@gmail.com"])

# Create release branch
run_git(["checkout", "-b", "release-pipeline"])

phases = [
    {
        "phase": 1,
        "msg": "feat(core): phase 1 - monorepo structure, build configuration, and core project scaffolding",
        "patterns": [
            ".gitignore", "README.md", "package.json", "docker-compose.yml",
            "backend/package.json", "backend/tsconfig.json", "backend/.env.example",
            "frontend/package.json", "frontend/tsconfig.json", "frontend/tsconfig.app.json",
            "frontend/tsconfig.node.json", "frontend/vite.config.ts", "frontend/index.html",
            "frontend/eslint.config.js"
        ]
    },
    {
        "phase": 2,
        "msg": "feat(db): phase 2 - database connection lifecycle, mongoose models, and indexing",
        "patterns": [
            "backend/scripts/", "backend/src/config/", "backend/src/database/",
            "backend/src/core/utils/", "backend/src/core/errors/",
            "backend/src/modules/users/models/", "backend/src/modules/ngos/models/",
            "backend/src/modules/campaigns/models/"
        ]
    },
    {
        "phase": 3,
        "msg": "feat(auth): phase 3 - authentication service, jwt rotation, and rbac middleware",
        "patterns": [
            "backend/src/modules/auth/", "backend/src/core/middleware/authenticate.ts",
            "backend/src/core/middleware/validate.ts", "backend/src/core/auth/permissions.ts",
            "backend/tests/auth.test.ts", "backend/tests/setup.ts"
        ]
    },
    {
        "phase": 4,
        "msg": "feat(ngo): phase 4 - ngo registration, documentation tracking, and verification workflow",
        "patterns": [
            "backend/src/modules/ngos/controllers/", "backend/src/modules/ngos/services/",
            "backend/src/modules/ngos/routes/", "backend/src/modules/ngos/validations/",
            "backend/src/core/storage/"
        ]
    },
    {
        "phase": 5,
        "msg": "feat(campaigns): phase 5 - multi-campaign engine, categorization, and fund tracking",
        "patterns": [
            "backend/src/modules/campaigns/controllers/", "backend/src/modules/campaigns/services/",
            "backend/src/modules/campaigns/routes/", "backend/src/modules/campaigns/validations/"
        ]
    },
    {
        "phase": 6,
        "msg": "feat(wishlist): phase 6 - wishlist items, supply drives, and atomic inventory allocation",
        "patterns": [
            "backend/src/modules/wishlists/", "backend/tests/concurrency.test.ts"
        ]
    },
    {
        "phase": 7,
        "msg": "feat(volunteering): phase 7 - volunteer opportunity management and unique application flow",
        "patterns": [
            "backend/src/modules/volunteering/", "backend/tests/volunteer.test.ts"
        ]
    },
    {
        "phase": 8,
        "msg": "feat(payments): phase 8 - payment gateway integration, hmac verification, and 80g tax receipts",
        "patterns": [
            "backend/src/modules/donations/", "backend/src/modules/payments/",
            "backend/tests/payment.test.ts", "backend/tests/webhook.test.ts", "backend/tests/refund.test.ts"
        ]
    },
    {
        "phase": 9,
        "msg": "feat(admin): phase 9 - platform governance, kyc review queue, and immutable audit logging",
        "patterns": [
            "backend/src/modules/admin/", "backend/src/modules/audit/", "backend/tests/admin.complete.test.ts"
        ]
    },
    {
        "phase": 10,
        "msg": "feat(realtime): phase 10 - socket.io room governance and domain event bus",
        "patterns": [
            "backend/src/core/socket/", "backend/src/events/", "backend/src/server.ts",
            "backend/tests/socket.test.ts", "backend/src/core/middleware/correlationId.ts",
            "backend/src/core/middleware/errorHandler.ts"
        ]
    },
    {
        "phase": 11,
        "msg": "feat(notifications): phase 11 - notification persistence and centralized dashboard aggregation services",
        "patterns": [
            "backend/src/modules/notifications/", "backend/src/modules/dashboard/",
            "backend/src/app.ts", "backend/tests/security.rbac.test.ts",
            "backend/src/modules/reviews/", "backend/src/modules/impact/"
        ]
    },
    {
        "phase": 12,
        "msg": "feat(ui-public): phase 12 - public crowdfunding ui, discovery filters, and human storytelling layouts",
        "patterns": [
            "frontend/src/index.css", "frontend/src/layouts/", "frontend/src/components/ui/",
            "frontend/src/components/common/", "frontend/src/pages/Home.tsx",
            "frontend/src/pages/Discover.tsx", "frontend/src/pages/CampaignDetails.tsx",
            "frontend/src/pages/NGOs.tsx", "frontend/src/pages/NGOProfile.tsx",
            "frontend/src/pages/HowItWorks.tsx", "frontend/src/pages/Impact.tsx"
        ]
    },
    {
        "phase": 13,
        "msg": "feat(ui-ngo): phase 13 - ngo operations hub, interactive kpi cards, and campaign creation modal",
        "patterns": [
            "frontend/src/pages/organization/", "frontend/src/pages/me/",
            "frontend/src/pages/Volunteer.tsx", "frontend/src/pages/VolunteerDetails.tsx",
            "frontend/src/pages/Wishlist.tsx", "frontend/src/services/"
        ]
    },
    {
        "phase": 14,
        "msg": "feat(ui-admin): phase 14 - super admin moderation workspace and telemetry dashboard",
        "patterns": [
            "frontend/src/pages/admin/", "frontend/src/pages/Settings.tsx",
            "frontend/src/pages/Unauthorized.tsx"
        ]
    },
    {
        "phase": 15,
        "msg": "feat(release): phase 15 - escrow payment checkout, safe notification routing, and e2e integration",
        "patterns": ["."]  # All remaining files
    }
]

for p in phases:
    num = p["phase"]
    msg = p["msg"]
    patterns = p["patterns"]
    print(f"Staging Phase {num}...")
    for pat in patterns:
        run_git(["add", pat])
    
    # Check if anything staged
    status = run_git(["status", "--porcelain"]).stdout.strip()
    if status:
        res = run_git(["commit", "-m", msg])
        if res.returncode == 0:
            run_git(["tag", f"phase-{num}"])
            print(f"Committed & tagged: phase-{num}")
        else:
            print(f"Failed commit for phase {num}: {res.stderr}")
    else:
        print(f"No changes staged for phase {num}, skipping.")

print("All phases built successfully!")
