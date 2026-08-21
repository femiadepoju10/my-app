The concept of this project is essentially a **transaction-protected marketplace**: sellers list products, buyers pay through the platform, the platform temporarily holds the buyer's funds, and the seller is paid only after the buyer confirms that the item has been received and is satisfactory.

For an MVP, the objective should be to prove the **listing → payment → controlled handover → buyer confirmation → seller payout/refund** cycle without attempting to build a full-scale marketplace.

# 1. Core MVP Concept

### Actors

There are initially three actors:

1. **Buyer**

   * Creates an account.
   * Browses products.
   * Selects a product.
   * Pays through the platform.
   * Receives the seller's contact/handover information after successful payment.
   * Inspects the product.
   * Confirms acceptance or rejects it.

2. **Seller**

   * Creates an account.
   * Lists products.
   * Uploads product images.
   * Sets the price and description.
   * Receives notification when a buyer has paid.
   * Hands over the product.
   * Receives payment after buyer acceptance.

3. **Platform/Admin**

   * Manages users and listings.
   * Monitors transactions.
   * Holds/controls transaction funds.
   * Releases seller payment after buyer approval.
   * Initiates/refunds buyer payment where appropriate.
   * Collects the **10% platform service fee**.

---

# 2. The Fundamental Transaction Model

The most important part of the MVP is not the product catalogue. It is the **transaction state machine**.

A transaction should move through something like:

**Listed → Purchased → Payment Confirmed → Seller Contacted → Item Delivered → Buyer Inspection → Accepted → Seller Paid**

or:

**Listed → Purchased → Payment Confirmed → Seller Contacted → Item Delivered → Buyer Inspection → Rejected → Item Returned/Confirmed → Buyer Refunded**

This should be the backbone of the application.

---

# 3. MVP Feature Breakdown

## A. Landing/Home Page

The public-facing homepage should be relatively simple.

### Features

* Platform logo/name
* Short explanation of how the marketplace works
* Search bar
* Featured/recent products
* Product categories
* "Sell an Item" button
* "Browse Products" button
* Login button
* Sign-up button
* Basic explanation of the transaction protection mechanism
* Service-fee disclosure

### Primary message

Something conceptually similar to:

> **Buy and sell with confidence. Your payment is protected until you confirm that you received the item as expected.**

The transaction protection mechanism should be one of the central selling propositions of the platform.

---

# 4. User Registration and Authentication

Authentication is a **mandatory MVP component**.

### Sign-up

Users should provide:

* Full name
* Email address
* Phone number
* Password
* Confirm password

Optional/possibly later:

* Profile photograph
* Address
* Government ID/KYC
* Bank account details

For the first MVP, extensive KYC can be deferred unless required by the payment provider or applicable regulatory requirements.

### Authentication

* Login
* Logout
* Password hashing
* Forgot password
* Password reset
* Email/phone verification
* Session management
* Protected user dashboard

### Important design decision

There should **not necessarily be separate buyer and seller accounts**.

One account should be capable of being both:

> **Buyer + Seller**

A user can list products and also purchase products.

---

# 5. User Dashboard

After authentication, the user should have a dashboard.

### Dashboard sections

**My Listings**

* Active
* Sold
* Drafts
* Removed

**My Purchases**

* Awaiting payment
* Payment completed
* Awaiting delivery
* Awaiting inspection
* Completed
* Disputed/refunded

**My Sales**

* Awaiting buyer confirmation
* Completed
* Refunded/disputed

**Account**

* Personal information
* Contact information
* Password
* Payment/payout information

---

# 6. Product Listing

This is one of the principal MVP features.

A seller should be able to click:

> **Sell an Item**

and complete a listing form.

### Required fields

* Product title
* Description
* Category
* Condition
* Price
* Location
* Product images

### Product images

The seller should be able to:

* Upload multiple images
* Select a primary image
* Remove/reorder images
* Preview images before publishing

For MVP, perhaps **up to 5 images per listing**.

### Condition

A simple predefined set:

* New
* Like New
* Good
* Fair
* Used

### Listing status

Each listing should have a status such as:

* Draft
* Active
* Reserved
* Sold
* Removed

---

# 7. Product Discovery

Potential buyers need to find products easily.

### MVP functionality

* Product catalogue
* Product cards
* Product image
* Product title
* Price
* Condition
* Location
* Seller name/rating, if implemented
* Search
* Category filtering
* Price filtering
* Sort by:

  * Newest
  * Price: low to high
  * Price: high to low

Do **not** over-engineer the search engine at MVP stage.

A basic database search/filter system is sufficient.

---

# 8. Product Details Page

When a buyer selects an item, they should see:

### Product information

* Image gallery
* Product title
* Price
* Description
* Condition
* Location
* Seller information
* Listing date
* Availability

### Transaction information

The page should clearly show:

> **Platform Service Fee: 10%**

and calculate the amount payable.

For example:

| Item price | 10% service fee | Buyer pays |
| ---------: | --------------: | ---------: |
|   ₦100,000 |         ₦10,000 |   ₦110,000 |

However, there is an important commercial decision here: **who pays the 10%?**

The specification currently says the platform charges a 10% service fee, but it does not explicitly state whether this is deducted from the seller's proceeds or added to the buyer's payment.

For the MVP, I would recommend:

**Buyer pays ₦110,000 → Seller receives ₦100,000 → Platform retains ₦10,000.**

This makes the platform's revenue model straightforward and transparent.

---

# 9. Purchase Flow

The buyer clicks:

> **Buy Now**

The platform creates a transaction.

### Transaction record

The database should record something like:

```text
Transaction ID
Buyer ID
Seller ID
Product ID
Product Price
Service Fee
Total Amount
Payment Status
Delivery Status
Inspection Status
Payout Status
Refund Status
Created At
Updated At
```

The product should then temporarily become:

> **Reserved**

so another buyer cannot purchase it simultaneously.

---

# 10. Payment

Payment must occur **inside the platform**.

For a Nigerian MVP, the platform would typically integrate a payment processor such as Paystack or Flutterwave, subject to the provider's marketplace/payment-holding capabilities and applicable regulatory requirements.

The payment flow should be:

**Buyer → Payment Gateway → Platform-controlled transaction flow → Seller payout after acceptance**

The application should never treat a client-side "payment successful" message as sufficient evidence.

Payment confirmation should come from the payment provider through a secure server-side mechanism/webhook.

### Payment statuses

For example:

* Pending
* Successful
* Failed
* Cancelled
* Refunded
* Partially refunded

---

# 11. The Critical Escrow-Like Mechanism

This is the feature that differentiates the platform from a conventional classified-advertisement website.

After successful payment:

### The buyer does NOT immediately pay the seller.

Instead, the transaction enters:

> **Payment Secured – Awaiting Seller Fulfilment**

The platform retains control of the transaction funds until the buyer confirms acceptance.

Strictly speaking, whether the platform may legally hold customer funds in the proposed manner depends on the payment structure, payment provider, and Nigerian regulatory requirements. Therefore, the production implementation should use a compliant marketplace/payment architecture rather than assuming that the platform itself can operate an unrestricted escrow account.

---

# 12. Seller Notification

Once payment is confirmed:

Seller receives:

> **Your item has been purchased. Payment has been secured by the platform. Please proceed with the handover.**

The seller should see:

* Product
* Buyer name
* Transaction ID
* Amount
* Payment status
* Buyer contact details, where appropriate
* Handover instructions

---

# 13. Connecting Buyer and Seller

This is an important part of the business logic.

Before payment:

> Buyer and seller contact information should be restricted.

After payment:

> The platform reveals the necessary contact/handover information.

The platform can therefore control the transaction until payment has occurred.

For MVP, this could simply mean revealing:

* Buyer's name
* Buyer's phone number
* Seller's name
* Seller's phone number

A later version could introduce an **in-app messaging system**, which would be considerably safer and more controllable.

---

# 14. Buyer Inspection

After receiving the product, the buyer enters:

> **My Purchase → Inspect Item**

They have two options:

### Option 1 — Accept Item

> **Item received and satisfactory**

The buyer confirms acceptance.

Transaction becomes:

**COMPLETED**

The platform then initiates seller payout.

---

### Option 2 — Reject Item

> **Item is not as described / I do not accept this item**

The transaction becomes:

**DISPUTED / RETURN PENDING**

The platform then requires confirmation that the item remains with the buyer or has been returned to the seller, depending on the agreed transaction protocol.

This needs to be designed carefully because the phrase "confirm that the item is still with the seller" is potentially ambiguous. The MVP should define exactly **who has physical possession at each stage**.

---

# 15. Recommended MVP Dispute Flow

A simpler and more defensible workflow would be:

### Buyer rejects item

Buyer provides:

* Reason for rejection
* Optional photographs
* Optional description of discrepancy

Transaction becomes:

> **Under Review**

The seller is notified.

Seller responds:

* Accepts return
* Disputes rejection

If the seller accepts the return:

**Buyer returns item → Seller confirms receipt → Platform refunds buyer**

If there is disagreement:

**Admin reviews dispute → Admin determines refund/payout**

This introduces an essential role:

> **Administrator**

Without an admin dispute mechanism, the platform has no reliable way to resolve situations in which buyer and seller provide contradictory claims.

---

# 16. Seller Payout

Once the buyer confirms:

> **I have received and accepted this item**

the platform calculates:

**Seller payout = Product price**

and:

**Platform revenue = 10% service fee**

Example:

**Product:** ₦100,000
**Service fee:** ₦10,000
**Buyer pays:** ₦110,000

After acceptance:

**Seller receives:** ₦100,000
**Platform retains:** ₦10,000

The payout should be triggered through the payment provider rather than manually transferring money.

---

# 17. Refund

If the transaction is rejected and the refund conditions are satisfied:

**Buyer receives ₦110,000**

or, depending on the commercial policy, the platform could have a separate non-refundable processing component. For a simple MVP, however, a full refund is much easier to communicate.

The transaction should record:

* Refund requested
* Refund approved
* Refund initiated
* Refund successful
* Refund failed

---

# 18. Admin Dashboard

This is **essential**, not optional.

The administrator should be able to see:

### Users

* Total users
* Buyers
* Sellers
* Suspended users
* User details

### Products

* Active listings
* Sold products
* Reported listings
* Remove/suspend listing

### Transactions

* Transaction ID
* Buyer
* Seller
* Product
* Amount
* Service fee
* Payment status
* Delivery status
* Inspection status
* Payout status
* Refund status

### Disputes

* Open disputes
* Buyer complaint
* Seller response
* Evidence
* Transaction history
* Resolution

### Financial dashboard

* Gross transaction value
* Platform fees
* Pending payouts
* Completed payouts
* Refunds

---

# 19. Notifications

The MVP should have basic notifications.

### Email notifications

At minimum:

**Buyer**

* Account created
* Payment successful
* Seller notified
* Item ready for inspection
* Transaction completed
* Refund initiated

**Seller**

* Product purchased
* Payment secured
* Buyer contact released
* Buyer accepted item
* Payout initiated
* Buyer rejected item
* Dispute opened

In-app notifications can be added later.

---

# 20. Database Structure

A reasonable MVP database might contain these core tables:

```text
Users
 ├── id
 ├── name
 ├── email
 ├── phone
 ├── password_hash
 └── created_at

Products
 ├── id
 ├── seller_id
 ├── title
 ├── description
 ├── category
 ├── condition
 ├── price
 ├── location
 ├── status
 └── created_at

ProductImages
 ├── id
 ├── product_id
 ├── image_url
 └── sort_order

Transactions
 ├── id
 ├── product_id
 ├── buyer_id
 ├── seller_id
 ├── item_price
 ├── service_fee
 ├── total_amount
 ├── status
 └── created_at

Payments
 ├── id
 ├── transaction_id
 ├── payment_reference
 ├── amount
 ├── status
 └── paid_at

Payouts
 ├── id
 ├── transaction_id
 ├── seller_id
 ├── amount
 ├── status
 └── paid_at

Refunds
 ├── id
 ├── transaction_id
 ├── amount
 ├── reason
 └── status

Disputes
 ├── id
 ├── transaction_id
 ├── opened_by
 ├── reason
 ├── evidence
 ├── status
 └── resolution

Notifications
 ├── id
 ├── user_id
 ├── type
 ├── message
 └── read_at
```

---

# 21. MVP Screens

The entire first version could be built around approximately **12–15 screens**.

| #  | Screen             | Purpose                 |
| -- | ------------------ | ----------------------- |
| 1  | Landing Page       | Introduce platform      |
| 2  | Sign Up            | Create account          |
| 3  | Login              | Authenticate            |
| 4  | Marketplace        | Browse products         |
| 5  | Product Details    | Examine product         |
| 6  | Sell an Item       | Create listing          |
| 7  | My Dashboard       | Manage activity         |
| 8  | My Listings        | Manage products         |
| 9  | My Purchases       | Track purchases         |
| 10 | Checkout           | Pay for product         |
| 11 | Transaction Status | Track transaction       |
| 12 | Inspection         | Accept/reject item      |
| 13 | Dispute/Return     | Handle rejection        |
| 14 | Profile            | Manage account          |
| 15 | Admin Dashboard    | Platform administration |

---

# 22. MVP Transaction State Machine

This should probably be the **technical centrepiece of the application**.

```text
                 ┌───────────────┐
                 │    LISTED     │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │   RESERVED    │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │ PAYMENT       │
                 │ SUCCESSFUL    │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │ SELLER/BUYER  │
                 │ CONNECTED     │
                 └───────┬───────┘
                         │
                         ▼
                 ┌───────────────┐
                 │ ITEM RECEIVED │
                 └───────┬───────┘
                         │
                  ┌──────┴──────┐
                  ▼             ▼
             ACCEPTED        REJECTED
                  │             │
                  ▼             ▼
             SELLER PAID    DISPUTE/RETURN
                                │
                         ┌──────┴──────┐
                         ▼             ▼
                       REFUND        SELLER PAID
```

---

# 23. What Should NOT Be in the MVP

A major risk would be attempting to build too much initially.

The following should probably be **Version 2+**:

* AI-powered product recommendations
* Advanced seller analytics
* Seller subscriptions
* Advertising
* Auctions
* Live streaming
* In-app video calls
* Sophisticated recommendation engine
* Loyalty programme
* Wallet system
* Cryptocurrency
* Multiple currencies
* International shipping
* Automated logistics
* Complex seller verification
* Social-media-style feeds
* Advanced reviews
* Chatbots
* AI product descriptions
* Machine-learning fraud detection

The MVP should establish one thing:

> **Can strangers successfully buy and sell products through the platform while trusting the platform to protect the transaction?**

---

# 24. Recommended MVP Development Phases

## Phase 1 — Foundation

* [ ] Project setup
* [ ] Database
* [ ] User registration
* [ ] Login/logout
* [ ] Authentication
* [ ] User profiles
* [ ] Admin authentication

## Phase 2 — Marketplace

* [ ] Product creation
* [ ] Image upload
* [ ] Product catalogue
* [ ] Product search
* [ ] Categories
* [ ] Product details
* [ ] Edit/delete listing

## Phase 3 — Transactions

* [ ] Buy Now
* [ ] Transaction creation
* [ ] Product reservation
* [ ] Checkout
* [ ] Payment gateway
* [ ] Payment verification
* [ ] Transaction status management
* [ ] Buyer/seller connection

## Phase 4 — Protected Transaction

* [ ] Buyer receives item
* [ ] Inspection interface
* [ ] Accept item
* [ ] Reject item
* [ ] Seller payout
* [ ] Refund mechanism
* [ ] Transaction history

## Phase 5 — Disputes

* [ ] Dispute creation
* [ ] Evidence submission
* [ ] Seller response
* [ ] Admin review
* [ ] Refund decision
* [ ] Payout decision

## Phase 6 — Administration

* [ ] User management
* [ ] Product management
* [ ] Transaction monitoring
* [ ] Dispute management
* [ ] Financial dashboard
* [ ] Platform fee reporting

## Phase 7 — Notifications

* [ ] Email verification
* [ ] Payment notification
* [ ] Purchase notification
* [ ] Seller notification
* [ ] Inspection notification
* [ ] Payout notification
* [ ] Refund notification

---

# 25. The MVP in One User Journey

The entire product can ultimately be demonstrated with this single scenario:

### Seller

**Femi** signs up → lists a laptop for **₦500,000** → uploads five photographs → publishes listing.

### Buyer

**John** signs up → finds the laptop → clicks **Buy Now**.

The system calculates:

**Laptop:** ₦500,000
**10% service fee:** ₦50,000
**Total:** ₦550,000

John pays **₦550,000 through the platform**.

### Platform

Payment is verified → laptop becomes **Reserved/Sold** → seller receives notification → buyer and seller contact information becomes available.

### Handover

Seller gives John the laptop.

John examines it.

### Scenario A: Everything is satisfactory

John clicks:

> **Accept Item**

System:

**₦500,000 → Seller**
**₦50,000 → Platform**

Transaction:

> **COMPLETED**

### Scenario B: Item is not satisfactory

John clicks:

> **Reject Item**

and provides a reason.

Transaction becomes:

> **DISPUTED**

The platform verifies the return/possession condition.

If the refund conditions are satisfied:

**₦550,000 → Buyer**

Transaction:

> **REFUNDED**

---

# 26. The Actual MVP

If the development team needs an extremely concise definition of what constitutes **MVP v1.0**, it is this:

> **An authenticated two-sided marketplace in which users can list products with photographs and prices, other authenticated users can purchase those products through an integrated payment gateway, the platform retains control of the transaction until the buyer confirms satisfactory receipt, and the system subsequently initiates either seller payout or buyer refund, with the platform retaining a 10% service fee and an administrator managing exceptions and disputes.**

That is a **genuine MVP**. Everything else should be evaluated against whether it is necessary to make that transaction cycle work.

### One architectural recommendation

The most important design decision is to build the system around a **transaction state machine rather than around the product listing itself**. The product catalogue is relatively conventional; the difficult and commercially valuable component is the controlled movement of money and possession through **payment → fulfilment → inspection → acceptance/rejection → payout/refund**.

For an eventual Nigerian deployment, the payment architecture should also be designed around a **licensed payment provider's marketplace/split-payment or compliant funds-flow capabilities**, rather than simply creating an application-owned "wallet" and assuming that the platform can legally hold customer funds. This becomes particularly important once real monetary transactions begin.
