# Security Specification for Maisha Borka House

## 1. Data Invariants
1. Products can only be created and modified by verified store administrators.
2. Orders belong to the user who placed them (by `userId` or authenticated session email). Non-admin users can only query their own orders.
3. Reviews must bind to a valid `productId` and the user submitting them must be authenticated and setting their own accurate `userId`.
4. Customization variables can only be altered by validated administrators to prevent layout defacing.

## 2. The "Dirty Dozen" Malicious Payloads

### Payload A1: Product Spoofing (Non-Admin trying to update/create a product)
- **Path**: `/products/mysterious-borka`
- **Method**: `create`/`update`
- **Payload**: `{ "title": "Stolen Glory Borka", "slug": "stolen-glory", "sku": "BORKA-9999", "price": 100, "category": "General", "isFeatured": true }`
- **Identity**: `{ "uid": "scammer_user_123", "token": { "email": "scammer@attacker.com", "email_verified": true } }`
- **Expected Outcome**: `PERMISSION_DENIED` (not an admin)

### Payload A2: Self-Promotion to Admin Status
- **Path**: `/admins/scammer_user_123`
- **Method**: `create`
- **Payload**: `{ "email": "scammer@attacker.com" }`
- **Identity**: `{ "uid": "scammer_user_123" }`
- **Expected Outcome**: `PERMISSION_DENIED` (cannot write to admins collection without admin credentials)

### Payload B1: Arbitrary Billing Splicing (User altering total sum of existing order)
- **Path**: `/orders/order_xyz123`
- **Method**: `update`
- **Payload**: `{ "totalAmount": 0.01 }`
- **Identity**: `{ "uid": "user_buyer_77", "token": { "email": "buyer@regular.com" } }`
- **Expected Outcome**: `PERMISSION_DENIED` (cannot mutate existing completed orders or alter total billing after capture)

### Payload B2: Order Identity Spoofing (Creating order under another user's UID)
- **Path**: `/orders/hijacked_order`
- **Method**: `create`
- **Payload**: `{ "customerEmail": "victim@regular.com", "customerName": "Victim", "userId": "victim_uid_555", "items": [], "totalAmount": 999, "status": "pending" }`
- **Identity**: `{ "uid": "scammer_user_123", "token": { "email": "scammer@attacker.com", "email_verified": true } }`
- **Expected Outcome**: `PERMISSION_DENIED` (userId field in order must match authenticated request.auth.uid)

### Payload C1: Image URL Exploit (Poisoning review path with abnormal payload size)
- **Path**: `/reviews/bad_review_99`
- **Method**: `create`
- **Payload**: `{ "productId": "borka-luxury", "userId": "scammer_user_123", "userName": "Attacker", "rating": 5, "comment": "[1MB of garbage payload to exhaust resources...]" }`
- **Identity**: `{ "uid": "scammer_user_123", "token": { "email": "scammer@attacker.com", "email_verified": true } }`
- **Expected Outcome**: `PERMISSION_DENIED` (violates `.size() <= 1000` rule on comment string)

### Payload C2: Identity Theft in Reviews (Claiming to be someone else)
- **Path**: `/reviews/victim_review_1`
- **Method**: `create`
- **Payload**: `{ "productId": "borka-luxury", "userId": "victim_uid_555", "userName": "Impersonator", "rating": 5, "comment": "Great product!" }`
- **Identity**: `{ "uid": "scammer_user_123" }`
- **Expected Outcome**: `PERMISSION_DENIED` (incoming review userId must equal auth.uid)

### Payload D1: Layout Defacement (Non-admin changing custom colors on public store)
- **Path**: `/customization/global`
- **Method**: `write`
- **Payload**: `{ "accentColor": "#FF0000", "heroTitle": "HACKED" }`
- **Identity**: `{ "uid": "vandal_99" }`
- **Expected Outcome**: `PERMISSION_DENIED` (write permission requires admin check)

### Payload D2: Temporal Integrity Spoofing on Create
- **Path**: `/orders/timewarp_order`
- **Method**: `create`
- **Payload**: `{ "customerEmail": "user@test.com", "customerName": "Test", "items": [], "totalAmount": 100, "status": "pending", "createdAt": "2020-01-01" }`
- **Identity**: `{ "uid": "user_buyer_77" }`
- **Expected Outcome**: `PERMISSION_DENIED` (createdAt must equal request.time)

### Payload E1: Unordered State Shortcutting (Transition order status directly to completed)
- **Path**: `/orders/order_xyz123`
- **Method**: `update`
- **Payload**: `{ "status": "completed" }`
- **Identity**: `{ "uid": "scammer_user_123" }`
- **Expected Outcome**: `PERMISSION_DENIED` (only admins can mutate order status and delivery fields)

### Payload E2: Ghost Field Poisoning
- **Path**: `/products/elegant-abaya`
- **Method**: `update`
- **Payload**: `{ "title": "Abaya Premium", "ghostField": "bad-injection" }`
- **Identity**: `{ "uid": "admin_uid_firebase" }`
- **Expected Outcome**: `PERMISSION_DENIED` (diff affectedKeys does not permit injecting ghostField)

### Payload F1: SQL/NoSQL Garbage ID Attack
- **Path**: `/products/A$$#@_garbage_character_10000_of_noise_chars_longer_than_allowed_length`
- **Method**: `create`
- **Identity**: `admin_uid`
- **Expected Outcome**: `PERMISSION_DENIED` (document ID fails size and regular expression validation)

### Payload F2: Unauthorized Blanket Order Scraping
- **Method**: `list` (on orders)
- **Identity**: `scammer_user_123` trying to read all database orders without supplying secure query filter.
- **Expected Outcome**: `PERMISSION_DENIED` (the list operation enforces isOwner check on resource data)

---

## 3. The Test Runner Configuration

The Firestore Emulator utilizes these exact cases to confirm that permissions are strictly enforced. All 12 payloads return `PERMISSION_DENIED` and cannot be processed client-side.
