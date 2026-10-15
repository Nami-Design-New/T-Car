# Account routes and layout composition

This diagram reflects the current App Router structure under
`src/app/[locale]/account`. The route group `(sections)` does not appear in the
URL; it exists to share the account shell between the section pages.

```mermaid
flowchart TD
    localeLayout["[locale]/layout.tsx; children: React.ReactNode"]
    accountLayout["account/layout.tsx; children: ReactNode; metadata: noindex"]
    accountPage["account/page.tsx; params + searchParams; redirects to a section"]

    sectionsLayout["account/(sections)/layout.tsx; children: ReactNode"]
    accountShell["features/account/AccountLayout; children: ReactNode; account title + points + sidebar"]

    profilePage["account/(sections)/profile/page.tsx; getProfile()"]
    bookingsPage["account/(sections)/bookings/page.tsx; searchParams.status + getMyBookings()"]
    walletPage["account/(sections)/wallet/page.tsx"]
    bankAccountsPage["account/(sections)/bank-accounts/page.tsx"]
    notificationsPage["account/(sections)/notifications/page.tsx; getNotifications()"]
    pointsPage["account/(sections)/points/page.tsx; getPoints()"]

    sectionsLoading["account/(sections)/loading.tsx; PageSkeleton"]
    sectionsError["account/(sections)/error.tsx; ErrorState + retry"]

    bookingDetails["account/bookings/[id]/page.tsx; params.id + getBookingDetails()"]
    bookingLoading["account/bookings/[id]/loading.tsx; PageSkeleton"]
    bookingError["account/bookings/[id]/error.tsx; RouteError"]
    bookingNotFound["account/bookings/[id]/not-found.tsx; ResourceNotFound"]

    localeLayout --> accountLayout
    accountLayout --> accountPage
    accountPage -->|"redirect"| sectionsLayout

    accountLayout --> sectionsLayout
    sectionsLayout -->|"wraps children"| accountShell
    accountShell -->|"renders children in .account-content"| profilePage
    accountShell --> bookingsPage
    accountShell --> walletPage
    accountShell --> bankAccountsPage
    accountShell --> notificationsPage
    accountShell --> pointsPage

    sectionsLayout -.-> sectionsLoading
    sectionsLayout -.-> sectionsError

    accountLayout -->|"outside (sections) group"| bookingDetails
    bookingDetails -.-> bookingLoading
    bookingDetails -.-> bookingError
    bookingDetails -.-> bookingNotFound

    style localeLayout fill:#DCCCFF,stroke:#874FFF
    style accountLayout fill:#C2E5FF,stroke:#3DADFF
    style sectionsLayout fill:#C6FAF6,stroke:#5AD8CC
    style accountShell fill:#C6FAF6,stroke:#5AD8CC
    style accountPage fill:#FFECBD,stroke:#FFC943
    style bookingDetails fill:#C2E5FF,stroke:#3DADFF
```

## Children composition

| Layer | `children` behavior |
| --- | --- |
| `src/app/[locale]/layout.tsx` | Receives the locale route tree and renders it inside the site shell, including `<main>{children}</main>`. |
| `src/app/[locale]/account/layout.tsx` | Receives the account route tree and returns `{children}` unchanged. Its role is metadata (`noindex`), not visual layout. |
| `src/app/[locale]/account/(sections)/layout.tsx` | Receives a section page and passes it to `<AccountLayout>{children}</AccountLayout>`. |
| `src/features/account/components/AccountLayout.tsx` | Receives the section page as `children` and renders it inside `.account-content`, alongside the account title, points summary, and `AccountNav`. |
| `src/app/[locale]/account/bookings/[id]/page.tsx` | Is outside `(sections)`, so it receives the account passthrough and does not render the sidebar/title shell. It keeps a full-width booking-details layout. |

## Route notes

- `/account` redirects to `/account/profile`, while legacy `/account?tab=...` values are mapped to their section route.
- The primary account navigation links to `profile`, `bookings`, `wallet`, `bank-accounts`, and `notifications`.
- `points/page.tsx` exists as an account section route but is not one of the five primary navigation tabs.
- `/account/bookings/[id]` has its own loading, error, and not-found boundaries.
- Section routes share the `(sections)/loading.tsx` and `(sections)/error.tsx` boundaries; the account shell remains available while the section content loads or fails.
