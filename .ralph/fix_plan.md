# Ralph Fix Plan - 山信二手平台

## M1 Priority - 总站框架 + 统一登录

### Core Authentication (NextAuth configured, needs middleware)
- [x] Add authentication middleware to protect routes
- [x] Update User model with student info fields (studentId, school, major, class)
- [x] Create user profile page with student information
- [ ] Add registration flow with student ID verification

### Home Page Navigation (Partially done - needs station cards)
- [x] Basic home page structure exists
- [x] Add four station navigation cards (二手平台，个人课表，商家点评，学校新闻)
- [x] Add user login status display in header
- [x] Add logout functionality

## M2 Priority - 二手平台分站

### Product Management
- [ ] Product listing page with filters
- [ ] Product creation form
- [ ] Product detail page
- [ ] Product image upload
- [ ] Product CRUD operations (edit, delete, mark as sold)

### Product API
- [ ] GET /api/products - list products with filters
- [ ] POST /api/products - create product
- [ ] GET /api/products/[id] - get product details
- [ ] PUT /api/products/[id] - update product
- [ ] DELETE /api/products/[id] - delete product

## M3 Priority - 个人课表 x 地图

### Course Schedule
- [ ] Course data model
- [ ] Course import/add form
- [ ] Weekly/daily view toggle
- [ ] Click course to show classroom location

### Campus Map
- [ ] Classroom location data
- [ ] Map visualization component
- [ ] Distance calculation
- [ ] Walking time estimation

## M4 Priority - 商家点评分站

### Merchant System
- [ ] Merchant listing page
- [ ] Merchant detail page
- [ ] Merchant review form
- [ ] Rating system (1-5 stars)
- [ ] Merchant ranking/leaderboard

## M5 Priority - 学校新闻分站

### News System
- [ ] News listing page
- [ ] News categories
- [ ] News detail page
- [ ] News search

## Infrastructure
- [x] Database migration for all models
- [x] Environment configuration
- [ ] Testing framework setup
- [ ] API error handling middleware

## Completed
- [x] Project initialization
- [x] Next.js 16 + React 19 setup
- [x] TypeScript configuration
- [x] Tailwind CSS setup
- [x] Prisma ORM with comprehensive schema
- [x] NextAuth.js authentication setup
- [x] Login page UI
- [x] Register page
- [x] Password reset flow
- [x] Email verification flow
- [x] User profile API
- [x] Profile page

## Notes
- Focus on M1 completion first (portal + auth)
- Test in browser after UI changes
- Update this file after each milestone
