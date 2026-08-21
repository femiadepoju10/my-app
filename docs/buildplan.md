The appropriate approach is to convert the MVP into a **sequential implementation roadmap**, where each step produces a concrete, testable component before the next step begins. Features that are useful but not necessary for the first operational marketplace should be explicitly excluded from MVP scope.

Below is the proposed **MVP Development Execution Chart** for review. It is intentionally granular so that it can subsequently be converted into a development specification or task board.

# Marketplace WebApp — MVP Development Execution Chart

## A. MVP Scope Definition

The MVP will support one complete transaction lifecycle:

> **Register → Authenticate → List Product → Browse → Purchase → Pay → Connect Buyer/Seller → Deliver → Inspect → Accept/Reject → Payout/Refund → Complete**

The MVP will contain **7 development phases and 50 atomic implementation steps**.

---

# PHASE 1 — APPLICATION FOUNDATION

### Objective

Establish the technical foundation on which every subsequent feature will depend.

| Step | Atomic Task                         | Expected Output                    | Status |
| ---- | ----------------------------------- | ---------------------------------- | ------ |
| 1.1  | Create project repository           | Source-code repository             | ☐      |
| 1.2  | Initialize frontend application     | Working frontend                   | ☐      |
| 1.3  | Initialize backend/API application  | Working backend                    | ☐      |
| 1.4  | Configure development environment   | Reproducible local environment     | ☐      |
| 1.5  | Configure environment variables     | Secure configuration system        | ☐      |
| 1.6  | Connect application to database     | Successful DB connection           | ☐      |
| 1.7  | Establish database migration system | Version-controlled schema          | ☐      |
| 1.8  | Create basic application layout     | Header/navigation/footer structure | ☐      |
| 1.9  | Configure error handling            | Standard application/API errors    | ☐      |
| 1.10 | Configure basic logging             | Server/application logs            | ☐      |

### Completion criterion

The application should run locally, communicate with the backend, and successfully read/write test data to the database.

---

# PHASE 2 — USER REGISTRATION AND AUTHENTICATION

### Objective

Prevent unauthenticated users from performing marketplace transactions.

## 2.1 User Database

| Step   | Atomic Task                                       |
| ------ | ------------------------------------------------- |
| 2.1.1  | Create Users table                                |
| 2.1.2  | Add user ID                                       |
| 2.1.3  | Add full name                                     |
| 2.1.4  | Add email                                         |
| 2.1.5  | Add phone number                                  |
| 2.1.6  | Add password hash                                 |
| 2.1.7  | Add account status                                |
| 2.1.8  | Add created/updated timestamps                    |
| 2.1.9  | Add unique constraint for email                   |
| 2.1.10 | Add unique constraint for phone where appropriate |

## 2.2 Registration

| Step   | Atomic Task                  |
| ------ | ---------------------------- |
| 2.2.1  | Create registration page     |
| 2.2.2  | Create registration form     |
| 2.2.3  | Validate name                |
| 2.2.4  | Validate email               |
| 2.2.5  | Validate phone               |
| 2.2.6  | Validate password            |
| 2.2.7  | Hash password                |
| 2.2.8  | Create user account          |
| 2.2.9  | Handle duplicate email       |
| 2.2.10 | Handle invalid input         |
| 2.2.11 | Display registration success |

## 2.3 Login

| Step  | Atomic Task                           |
| ----- | ------------------------------------- |
| 2.3.1 | Create login page                     |
| 2.3.2 | Create login form                     |
| 2.3.3 | Authenticate credentials              |
| 2.3.4 | Generate authentication session/token |
| 2.3.5 | Store authentication state            |
| 2.3.6 | Redirect authenticated user           |
| 2.3.7 | Handle invalid credentials            |
| 2.3.8 | Implement logout                      |

## 2.4 Password Recovery

| Step  | Atomic Task                   |
| ----- | ----------------------------- |
| 2.4.1 | Create forgot-password page   |
| 2.4.2 | Generate password-reset token |
| 2.4.3 | Send reset notification       |
| 2.4.4 | Create reset-password page    |
| 2.4.5 | Validate reset token          |
| 2.4.6 | Hash new password             |
| 2.4.7 | Invalidate reset token        |

### Phase completion criterion

A new user can register, log in, log out, and recover a forgotten password.

---

# PHASE 3 — MARKETPLACE AND PRODUCT LISTINGS

### Objective

Allow authenticated users to create and manage products.

## 3.1 Product Database

Create:

**Products**

* ID
* Seller ID
* Title
* Description
* Category
* Condition
* Price
* Location
* Status
* Created date
* Updated date

Create:

**Product Images**

* ID
* Product ID
* Image URL
* Display order

---

## 3.2 Product Listing

| Step   | Atomic Task                          |
| ------ | ------------------------------------ |
| 3.2.1  | Create "Sell an Item" page           |
| 3.2.2  | Create product title field           |
| 3.2.3  | Create description field             |
| 3.2.4  | Create category field                |
| 3.2.5  | Create condition field               |
| 3.2.6  | Create price field                   |
| 3.2.7  | Create location field                |
| 3.2.8  | Create image upload component        |
| 3.2.9  | Validate image type                  |
| 3.2.10 | Validate image size                  |
| 3.2.11 | Upload images                        |
| 3.2.12 | Save image references                |
| 3.2.13 | Validate product information         |
| 3.2.14 | Create product record                |
| 3.2.15 | Set initial product status to ACTIVE |
| 3.2.16 | Display listing-success message      |

---

## 3.3 Seller Listing Management

| Step  | Atomic Task                          |
| ----- | ------------------------------------ |
| 3.3.1 | Create "My Listings" page            |
| 3.3.2 | Display seller's listings            |
| 3.3.3 | Display listing status               |
| 3.3.4 | Implement edit listing               |
| 3.3.5 | Implement delete/remove listing      |
| 3.3.6 | Prevent editing sold products        |
| 3.3.7 | Prevent purchasing inactive products |

---

# PHASE 4 — PRODUCT DISCOVERY AND PURCHASE

### Objective

Allow users to discover products and initiate purchases.

## 4.1 Marketplace

| Step  | Atomic Task              |
| ----- | ------------------------ |
| 4.1.1 | Create marketplace page  |
| 4.1.2 | Retrieve active products |
| 4.1.3 | Create product card      |
| 4.1.4 | Display product image    |
| 4.1.5 | Display title            |
| 4.1.6 | Display price            |
| 4.1.7 | Display condition        |
| 4.1.8 | Display location         |
| 4.1.9 | Implement pagination     |

## 4.2 Search and Filtering

For MVP, keep this deliberately simple.

| Step  | Atomic Task                    |
| ----- | ------------------------------ |
| 4.2.1 | Implement title/keyword search |
| 4.2.2 | Implement category filter      |
| 4.2.3 | Implement price filter         |
| 4.2.4 | Implement basic sorting        |
| 4.2.5 | Test combined filters          |

---

# PHASE 5 — TRANSACTION AND PAYMENT SYSTEM

This is the **core of the MVP**.

### Objective

Allow the buyer to pay through the platform while preventing the seller from receiving the money until the transaction is completed.

---

## 5.1 Transaction Database

Create:

**Transactions**

* Transaction ID
* Product ID
* Buyer ID
* Seller ID
* Product price
* Service fee
* Total amount
* Transaction status
* Created date
* Updated date

Create:

**Payments**

* Payment ID
* Transaction ID
* Payment reference
* Amount
* Payment status
* Gateway response
* Payment date

Create:

**Payouts**

* Payout ID
* Transaction ID
* Seller ID
* Amount
* Status
* Gateway reference
* Payout date

Create:

**Refunds**

* Refund ID
* Transaction ID
* Amount
* Reason
* Status
* Gateway reference
* Refund date

---

# 6. TRANSACTION STATE MACHINE

Before implementing the payment interface, the transaction states should be explicitly defined.

### MVP states

```text
ACTIVE
   ↓
RESERVED
   ↓
PAYMENT_PENDING
   ↓
PAYMENT_CONFIRMED
   ↓
SELLER_CONTACTED
   ↓
ITEM_DELIVERED
   ↓
INSPECTION_PENDING
   ↓
 ┌───────────────┐
 ↓               ↓
ACCEPTED       REJECTED
 ↓               ↓
PAYOUT        DISPUTE/RETURN
 ↓               ↓
COMPLETED    REFUND/RESOLUTION
```

The development team should implement these states before building the complete transaction interface.

---

# 7. BUY NOW / CHECKOUT

| Step | Atomic Task                            |
| ---- | -------------------------------------- |
| 7.1  | Add "Buy Now" button                   |
| 7.2  | Prevent seller from buying own product |
| 7.3  | Verify product is active               |
| 7.4  | Lock/reserve product                   |
| 7.5  | Create transaction                     |
| 7.6  | Calculate product price                |
| 7.7  | Calculate 10% service fee              |
| 7.8  | Calculate total payable                |
| 7.9  | Display checkout summary               |
| 7.10 | Display service fee clearly            |
| 7.11 | Require buyer confirmation             |
| 7.12 | Generate payment reference             |

Example:

```text
Product price:       ₦500,000
Service fee (10%):    ₦50,000
─────────────────────────────
Total:               ₦550,000
```

---

# 8. PAYMENT GATEWAY

### Objective

Integrate the chosen payment provider.

| Step | Atomic Task                                |
| ---- | ------------------------------------------ |
| 8.1  | Select payment provider                    |
| 8.2  | Create payment-provider account            |
| 8.3  | Configure test credentials                 |
| 8.4  | Configure payment initialization           |
| 8.5  | Redirect/open payment interface            |
| 8.6  | Process successful payment                 |
| 8.7  | Process failed payment                     |
| 8.8  | Implement server-side payment verification |
| 8.9  | Implement payment webhook                  |
| 8.10 | Validate webhook authenticity              |
| 8.11 | Update payment record                      |
| 8.12 | Update transaction status                  |
| 8.13 | Prevent duplicate payment processing       |
| 8.14 | Handle abandoned payment                   |
| 8.15 | Test payment reconciliation                |

### Critical rule

The frontend must **never** independently determine that payment was successful.

The backend should verify the payment with the payment provider/webhook before changing the transaction to:

> **PAYMENT_CONFIRMED**

---

# 9. POST-PAYMENT BUYER/SELLER CONNECTION

Once payment has been confirmed:

| Step | Atomic Task                                 |
| ---- | ------------------------------------------- |
| 9.1  | Change transaction to PAYMENT_CONFIRMED     |
| 9.2  | Mark product as SOLD/RESERVED               |
| 9.3  | Notify seller                               |
| 9.4  | Notify buyer                                |
| 9.5  | Reveal required seller information to buyer |
| 9.6  | Reveal required buyer information to seller |
| 9.7  | Display transaction instructions            |
| 9.8  | Create transaction tracking page            |

For MVP, this does **not** require an internal chat system.

---

# 10. DELIVERY/HANDOVER

The MVP should keep logistics simple.

The platform does not need to build a delivery company or logistics network.

Instead:

| Step | Atomic Task                              |
| ---- | ---------------------------------------- |
| 10.1 | Seller receives transaction notification |
| 10.2 | Seller contacts buyer                    |
| 10.3 | Buyer and seller arrange handover        |
| 10.4 | Seller hands over product                |
| 10.5 | Seller/buyer marks item as delivered     |
| 10.6 | Transaction moves to INSPECTION_PENDING  |

The transaction dashboard should clearly indicate:

> **Item received? Inspect the item before accepting the transaction.**

---

# 11. BUYER INSPECTION

This is another critical MVP component.

### Inspection screen

Display:

* Product
* Seller
* Amount paid
* Product photographs
* Product description
* Transaction ID

Two primary actions:

### **ACCEPT ITEM**

and

### **REPORT PROBLEM**

---

## 11.1 Acceptance

| Step   | Atomic Task                |
| ------ | -------------------------- |
| 11.1.1 | Buyer clicks Accept        |
| 11.1.2 | Display confirmation       |
| 11.1.3 | Require final confirmation |
| 11.1.4 | Change transaction status  |
| 11.1.5 | Trigger payout             |
| 11.1.6 | Notify seller              |
| 11.1.7 | Notify buyer               |
| 11.1.8 | Mark transaction completed |

---

# 12. SELLER PAYOUT

| Step | Atomic Task                 |
| ---- | --------------------------- |
| 12.1 | Verify buyer acceptance     |
| 12.2 | Calculate seller amount     |
| 12.3 | Calculate platform fee      |
| 12.4 | Create payout record        |
| 12.5 | Initiate payout             |
| 12.6 | Receive payout confirmation |
| 12.7 | Update payout status        |
| 12.8 | Notify seller               |
| 12.9 | Mark transaction completed  |

### Example

```text
Buyer paid:          ₦550,000

Platform fee:         ₦50,000
Seller proceeds:     ₦500,000
```

---

# 13. REJECTION / DISPUTE

If the buyer is dissatisfied:

| Step  | Atomic Task                    |
| ----- | ------------------------------ |
| 13.1  | Buyer clicks "Report Problem"  |
| 13.2  | Display rejection reasons      |
| 13.3  | Buyer selects reason           |
| 13.4  | Buyer provides explanation     |
| 13.5  | Allow supporting photographs   |
| 13.6  | Submit dispute                 |
| 13.7  | Freeze payout                  |
| 13.8  | Change transaction to DISPUTED |
| 13.9  | Notify seller                  |
| 13.10 | Notify administrator           |

---

# 14. RETURN / REFUND

For MVP, the platform should not attempt to automate complicated return logistics.

Instead:

```text
Buyer rejects item
       ↓
Dispute opened
       ↓
Seller notified
       ↓
Return arranged
       ↓
Seller confirms receipt
       ↓
Admin/system verifies condition
       ↓
Refund initiated
```

### Implementation steps

| Step  | Atomic Task                     |
| ----- | ------------------------------- |
| 14.1  | Create return status            |
| 14.2  | Record reason for rejection     |
| 14.3  | Notify seller                   |
| 14.4  | Allow seller response           |
| 14.5  | Record return arrangement       |
| 14.6  | Record item-return confirmation |
| 14.7  | Verify refund eligibility       |
| 14.8  | Create refund record            |
| 14.9  | Initiate refund                 |
| 14.10 | Verify refund                   |
| 14.11 | Update transaction              |
| 14.12 | Notify buyer                    |
| 14.13 | Notify seller                   |

---

# 15. ADMINISTRATIVE SYSTEM

The administrator is required for MVP because disputes cannot be completely automated initially.

## 15.1 Admin Authentication

| Step   | Atomic Task                        |
| ------ | ---------------------------------- |
| 15.1.1 | Create admin role                  |
| 15.1.2 | Create admin login                 |
| 15.1.3 | Restrict admin routes              |
| 15.1.4 | Implement role-based authorization |

---

## 15.2 Admin Dashboard

Display:

* Total users
* Active products
* Transactions
* Completed transactions
* Pending transactions
* Disputed transactions
* Refunds
* Platform revenue

---

## 15.3 User Management

| Step   | Atomic Task        |
| ------ | ------------------ |
| 15.3.1 | View users         |
| 15.3.2 | Search users       |
| 15.3.3 | View user details  |
| 15.3.4 | Suspend account    |
| 15.3.5 | Reactivate account |

---

## 15.4 Product Management

| Step   | Atomic Task                       |
| ------ | --------------------------------- |
| 15.4.1 | View products                     |
| 15.4.2 | Search products                   |
| 15.4.3 | View product details              |
| 15.4.4 | Remove problematic listing        |
| 15.4.5 | Restore listing where appropriate |

---

## 15.5 Transaction Management

| Step   | Atomic Task               |
| ------ | ------------------------- |
| 15.5.1 | View all transactions     |
| 15.5.2 | Search transaction        |
| 15.5.3 | View transaction timeline |
| 15.5.4 | View payment information  |
| 15.5.5 | View payout information   |
| 15.5.6 | View refund information   |
| 15.5.7 | View dispute information  |

---

# 16. NOTIFICATION SYSTEM

The MVP requires only essential transactional notifications.

| Event                 | Buyer | Seller | Admin |
| --------------------- | :---: | :----: | :---: |
| Registration          |   ✓   |    ✓   |   —   |
| Payment successful    |   ✓   |    ✓   |   —   |
| Seller contacted      |   ✓   |    ✓   |   —   |
| Item delivered        |   ✓   |    ✓   |   —   |
| Inspection required   |   ✓   |    —   |   —   |
| Item accepted         |   ✓   |    ✓   |   —   |
| Payout initiated      |   —   |    ✓   |   —   |
| Item rejected         |   ✓   |    ✓   |   ✓   |
| Dispute opened        |   ✓   |    ✓   |   ✓   |
| Refund initiated      |   ✓   |    ✓   |   ✓   |
| Transaction completed |   ✓   |    ✓   |   —   |

For MVP, these can initially be **email notifications + in-app status messages**.

---

# 17. TRANSACTION HISTORY

Each user should have a permanent record of their transactions.

### Buyer

```text
My Purchases

Laptop
₦550,000
Payment Confirmed
Inspection Pending
```

### Seller

```text
My Sales

Laptop
₦500,000
Buyer Accepted
Payout Completed
```

### Atomic implementation

| Step | Task                                |
| ---- | ----------------------------------- |
| 17.1 | Create transaction-history endpoint |
| 17.2 | Create buyer transaction page       |
| 17.3 | Create seller transaction page      |
| 17.4 | Display transaction status          |
| 17.5 | Display transaction timeline        |
| 17.6 | Display payment details             |
| 17.7 | Display payout/refund status        |

---

# 18. SECURITY AND BUSINESS-LOGIC TESTING

This should occur **before the MVP is considered complete**.

The development team should specifically test:

### Authentication

* [ ] Unauthenticated user cannot access protected pages
* [ ] User cannot access another user's dashboard
* [ ] User cannot modify another user's product
* [ ] Passwords are never stored in plaintext

### Marketplace

* [ ] Seller cannot purchase own item
* [ ] Inactive product cannot be purchased
* [ ] Sold product cannot be purchased again
* [ ] Two buyers cannot successfully purchase the same item

### Payments

* [ ] Failed payment does not create successful transaction
* [ ] Fake frontend payment response cannot trigger payout
* [ ] Duplicate webhook does not duplicate transaction
* [ ] Duplicate payout cannot occur
* [ ] Payment amount is validated server-side

### Transaction protection

* [ ] Seller cannot receive payment before acceptance
* [ ] Buyer cannot falsely trigger seller payout
* [ ] Rejected transaction cannot automatically pay seller
* [ ] Refund cannot occur twice

### Administration

* [ ] Normal user cannot access admin functions
* [ ] Admin actions are authenticated
* [ ] Transaction records cannot be arbitrarily altered from frontend

---

# 19. MVP ACCEPTANCE TEST

The MVP should not be declared complete merely because every page has been created.

It should pass an **end-to-end transaction test**.

### Test Scenario

**User A**

→ Creates account
→ Logs in
→ Lists product
→ Uploads photographs
→ Publishes product

**User B**

→ Creates account
→ Logs in
→ Finds product
→ Opens product
→ Clicks Buy
→ Sees 10% service fee
→ Pays successfully

**System**

→ Verifies payment
→ Reserves product
→ Records transaction
→ Connects buyer and seller

**Seller**

→ Receives notification
→ Hands over product

**Buyer**

→ Confirms receipt
→ Inspects product
→ Accepts product

**System**

→ Initiates seller payout
→ Records platform commission
→ Marks transaction completed

Then repeat the entire test with:

**Buyer → Reject Item → Dispute → Return → Refund**

If both pathways work reliably, the core MVP has been demonstrated.

---

# 20. What Is Explicitly OUTSIDE MVP

To prevent scope creep, the following should **not be implemented in the first version**.

| Feature                           | Future Version |
| --------------------------------- | -------------- |
| In-app chat                       | V1.1           |
| Seller ratings/reviews            | V1.1           |
| Buyer ratings/reviews             | V1.1           |
| Advanced seller profiles          | V1.1           |
| Wishlist                          | V1.1           |
| Favourite products                | V1.1           |
| Push notifications                | V1.1           |
| SMS notifications                 | V1.1           |
| Advanced analytics                | V1.1           |
| Product recommendations           | V2.0           |
| AI recommendations                | V2.0           |
| AI-generated descriptions         | V2.0           |
| Automated logistics               | V2.0           |
| Delivery tracking                 | V2.0           |
| Seller verification/KYC expansion | V2.0           |
| Identity verification             | V2.0           |
| Seller subscriptions              | V2.0           |
| Sponsored listings                | V2.0           |
| Advertising                       | V2.0           |
| Auctions                          | V2.0           |
| Multiple currencies               | V2.0           |
| International transactions        | V2.0           |
| Advanced fraud detection          | V2.0           |
| Mobile applications               | V2.0           |
| Loyalty programme                 | V2.0           |
| Advanced dispute automation       | V2.0           |

---

# 21. Final MVP Development Sequence

The complete implementation order should therefore be:

```text
1. FOUNDATION
       ↓
2. DATABASE
       ↓
3. AUTHENTICATION
       ↓
4. USER DASHBOARD
       ↓
5. PRODUCT LISTING
       ↓
6. IMAGE UPLOAD
       ↓
7. MARKETPLACE
       ↓
8. SEARCH/FILTER
       ↓
9. PRODUCT DETAILS
       ↓
10. TRANSACTION ENGINE
       ↓
11. CHECKOUT
       ↓
12. PAYMENT GATEWAY
       ↓
13. PAYMENT VERIFICATION
       ↓
14. BUYER/SELLER CONNECTION
       ↓
15. DELIVERY/HANDOVER STATUS
       ↓
16. BUYER INSPECTION
       ↓
17. ACCEPTANCE
       ↓
18. SELLER PAYOUT
       ↓
19. REJECTION
       ↓
20. DISPUTE
       ↓
21. RETURN
       ↓
22. REFUND
       ↓
23. ADMIN DASHBOARD
       ↓
24. NOTIFICATIONS
       ↓
25. TRANSACTION HISTORY
       ↓
26. SECURITY TESTING
       ↓
27. END-TO-END TESTING
       ↓
28. MVP RELEASE
```

## The key principle

The development team should **not build all pages first and then attempt to connect them**. Each phase should be implemented, integrated, and tested before moving to the next.

Most importantly, the **transaction engine should be treated as the central domain of the application**. The listing and marketplace components ultimately exist to feed transactions into this engine, while the payment, inspection, payout, refund, and dispute modules determine how those transactions terminate.

This structure also gives a clean boundary for the next development stage: **MVP = one reliable, protected marketplace transaction; V1.1 = convenience and trust features; V2.0 = scale, automation, logistics, intelligence, and monetisation expansion.**
