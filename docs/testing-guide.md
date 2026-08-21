# MVP Security Testing and Acceptance Test Guide

## Prerequisites

1. PostgreSQL is running locally on port 5432
2. Database `skillbridge` exists
3. Environment variables are set in `.env.local`
4. Run `npx prisma migrate dev --name init` to apply migrations
5. Run `npx prisma generate` to generate Prisma Client

## Automated Security Tests

Run the automated security test suite:

```bash
npx vitest run tests/security/
```

Expected result: All tests pass.

### Test Categories

1. **Authentication tests** (`tests/security/auth.test.ts`)
   - Unauthenticated access to protected routes returns 401
   - Admin routes return 403 for non-admin users
   - Passwords are hashed with bcrypt

2. **Marketplace tests** (`tests/security/marketplace.test.ts`)
   - Seller cannot purchase own item
   - Inactive products cannot be purchased
   - Duplicate pending transactions are prevented

3. **Payment tests** (`tests/security/payments.test.ts`)
   - Invalid webhook signatures return 401
   - Failed payments do not create successful transactions
   - Payment amounts are validated server-side

4. **Admin tests** (`tests/security/admin.test.ts`)
   - Unauthenticated admin access returns 401
   - Non-admin users get 403 on admin routes
   - Cleanup endpoint is admin-only

## End-to-End Acceptance Tests

Run the acceptance tests:

```bash
npx vitest run tests/e2e/
```

### Happy Path Test

1. **User A creates account**
   - Navigate to `/signup`
   - Fill in name, email, phone, password
   - Submit form
   - Verify account created (201 response)

2. **User A logs in**
   - Navigate to `/login`
   - Enter credentials
   - Verify redirect to `/dashboard`

3. **User A lists product**
   - Navigate to `/products/sell`
   - Fill in product details
   - Upload images
   - Submit form
   - Verify product created (201 response)

4. **User B creates account and logs in**
   - Repeat steps 1-2 with different email

5. **User B finds and purchases product**
   - Navigate to `/products`
   - Search/filter for User A's product
   - Click on product
   - Click "Buy Now"
   - Verify redirect to `/checkout/[id]`
   - Verify 10% service fee is shown
   - Complete payment (test mode)

6. **System verifies payment**
   - Webhook receives payment success
   - Transaction status changes to `payment_confirmed`
   - Product status changes to `reserved`

7. **Seller delivers item**
   - User A views transaction
   - Clicks "Mark as Delivered"
   - Status changes to `item_delivered`

8. **Buyer inspects and accepts**
   - User B views transaction
   - Clicks "I've Received the Item"
   - Clicks "Accept Item"
   - Confirms acceptance
   - Status changes to `payout_pending`

9. **Admin marks payout complete**
   - Admin logs in
   - Views transaction in admin panel
   - Clicks "Mark Payout Complete"
   - Status changes to `completed`

### Refund Path Test

1. **Repeat steps 1-8 from happy path**

2. **Buyer rejects item**
   - User B clicks "Report Problem"
   - Selects reason
   - Uploads evidence photos
   - Submits report
   - Status changes to `rejected`

3. **Seller escalates to dispute**
   - User A clicks "Escalate to Dispute"
   - Status changes to `disputed`

4. **Admin approves refund**
   - Admin views dispute
   - Clicks "Approve Refund"
   - Status changes to `refund_pending`
   - Admin clicks "Process Refund"
   - Status changes to `refund_completed`

## Manual Verification Checklist

### Authentication
- [ ] Unauthenticated user cannot access `/dashboard`
- [ ] Unauthenticated user cannot access `/admin`
- [ ] Unauthenticated user cannot access `/products/sell`
- [ ] Normal user cannot access `/admin/*`
- [ ] Admin can access `/admin/*`
- [ ] Logout clears session

### Marketplace
- [ ] Seller cannot buy own product (button hidden/disabled)
- [ ] Inactive products show "Not Available" button
- [ ] Sold products show "Sold" badge
- [ ] Two buyers cannot checkout same product simultaneously

### Payments
- [ ] Checkout shows correct fee breakdown
- [ ] Payment button redirects to Paystack
- [ ] Webhook updates transaction status
- [ ] Duplicate webhook calls do not duplicate records

### Transactions
- [ ] Only buyer can initiate payment
- [ ] Only seller can mark as delivered
- [ ] Only buyer can confirm receipt
- [ ] Only buyer can accept/reject
- [ ] Only admin can approve/process refunds
- [ ] Only admin can mark payout complete
- [ ] Invalid status transitions are rejected

### Admin
- [ ] Admin dashboard shows correct stats
- [ ] Admin can view all users
- [ ] Admin can view all transactions
- [ ] Admin can view disputes
- [ ] Admin can view refunds

### Notifications
- [ ] Registration creates notification
- [ ] Transaction status changes create notifications
- [ ] Notification bell shows unread count
- [ ] Mark as read works
- [ ] Notifications page lists all notifications

## Environment Variables Required

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/skillbridge
AUTH_SECRET=your-auth-secret
PAYSTACK_SECRET_KEY=your-paystack-secret-key
PAYSTACK_PUBLIC_KEY=your-paystack-public-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
RESEND_API_KEY=your-resend-api-key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Known Limitations

1. Paystack test mode is required for payment testing
2. Resend API key required for email testing (emails logged in dev mode)
3. Cloudinary account required for image upload
4. PostgreSQL must be running locally

## MVP Release Criteria

- [ ] All automated security tests pass
- [ ] Happy path acceptance test passes
- [ ] Refund path acceptance test passes
- [ ] Manual verification checklist complete
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] All environment variables documented
- [ ] Database connection verified
- [ ] Application starts without errors (`next dev`)
