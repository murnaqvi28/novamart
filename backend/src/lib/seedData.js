export const categories = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Home & Living', slug: 'home' },
  { name: 'Beauty', slug: 'beauty' },
  { name: 'Sports & Fitness', slug: 'sports' },
  { name: 'Books', slug: 'books' },
];

// [name, category, price, compareAt, stock, featured, description]
export const products = [
  ['Aero Wireless Headphones', 'electronics', 12999, 15999, 25, true, 'Over-ear Bluetooth headphones with active noise cancellation and 40-hour battery life.'],
  ['Pulse Smartwatch S2', 'electronics', 18499, null, 14, true, 'Fitness tracking, heart-rate monitor, SpO2 and 7-day battery with AMOLED display.'],
  ['Volt 20000mAh Power Bank', 'electronics', 5499, 6499, 40, false, 'Fast-charging power bank with dual USB-C PD ports. Charges a phone up to 4 times.'],
  ['Echo Mini Bluetooth Speaker', 'electronics', 4299, null, 3, false, 'Pocket-sized waterproof speaker with deep bass and 12-hour playtime.'],
  ['Orbit Wireless Earbuds', 'electronics', 7999, 9499, 0, false, 'True wireless earbuds with touch controls and a compact charging case.'],
  ['Nimbus Mechanical Keyboard', 'electronics', 9999, null, 18, false, 'Hot-swappable 75% keyboard with tactile switches and RGB backlight.'],
  ['Classic Cotton Kurta', 'fashion', 3499, 4299, 30, true, 'Breathable pure cotton kurta with a tailored fit, perfect for everyday wear.'],
  ['Urban Denim Jacket', 'fashion', 6999, null, 12, false, 'Mid-wash denim jacket with a relaxed fit and metal buttons.'],
  ['Lawn Printed 3-Piece Suit', 'fashion', 5999, 7499, 20, true, 'Unstitched printed lawn shirt, dupatta and trouser fabric.'],
  ['Everyday Leather Sneakers', 'fashion', 8499, null, 9, false, 'Minimal white leather sneakers with a cushioned insole.'],
  ['Woollen Winter Shawl', 'fashion', 2999, null, 4, false, 'Soft hand-finished woollen shawl for chilly evenings.'],
  ['Halo Table Lamp', 'home', 4599, 5299, 15, true, 'Warm-white LED table lamp with a linen shade and touch dimmer.'],
  ['Terra Ceramic Dinner Set (18 pc)', 'home', 11999, null, 7, false, 'Stoneware dinner set for six with a matte glaze finish.'],
  ['Cloud Memory Foam Pillow', 'home', 3299, 3999, 35, false, 'Contoured memory foam pillow with a removable bamboo cover.'],
  ['Woven Cotton Throw', 'home', 2799, null, 22, false, 'Lightweight cotton throw blanket with tasselled edges.'],
  ['Brew Pour-Over Coffee Kit', 'home', 3899, null, 2, false, 'Glass carafe, stainless filter and gooseneck kettle in one kit.'],
  ['Glow Vitamin C Serum', 'beauty', 2499, 2999, 50, true, 'Brightening serum with 15% vitamin C and hyaluronic acid.'],
  ['Hydra Daily Moisturiser', 'beauty', 1899, null, 45, false, 'Lightweight gel moisturiser suitable for all skin types.'],
  ['Oud Noir Eau de Parfum', 'beauty', 6499, 7999, 10, false, 'Long-lasting warm fragrance with notes of oud, amber and vanilla.'],
  ['Herbal Hair Oil', 'beauty', 999, null, 60, false, 'Cold-pressed blend of coconut, almond and amla oils.'],
  ['FlexGrip Yoga Mat', 'sports', 2999, 3599, 28, true, '6mm non-slip yoga mat with carrying strap.'],
  ['Adjustable Dumbbell Set (20kg)', 'sports', 14999, null, 5, false, 'Space-saving adjustable dumbbells with quick-lock plates.'],
  ['Strike Cricket Bat (English Willow)', 'sports', 16999, 19999, 6, true, 'Grade 2 English willow bat with a thick edge and cane handle.'],
  ['Sprint Running Shoes', 'sports', 9499, null, 16, false, 'Lightweight running shoes with responsive foam cushioning.'],
  ['Hydro Steel Water Bottle', 'sports', 1599, null, 80, false, 'Insulated 750ml bottle that keeps drinks cold for 24 hours.'],
  ['The Pragmatic Tester', 'books', 2199, null, 25, false, 'A practical guide to building quality into software teams.'],
  ['Clean Code Essentials', 'books', 2599, 2999, 19, false, 'Principles and patterns for writing readable, maintainable code.'],
  ['Atomic Routines', 'books', 1799, null, 33, true, 'Small habits that compound into remarkable results.'],
  ['History of the Silk Road', 'books', 2399, null, 8, false, 'An illustrated journey across the ancient trade routes of Asia.'],
  ['Mindful Cooking', 'books', 1999, null, 0, false, 'Seasonal recipes and simple techniques for home cooks.'],
];

export const users = [
  { name: 'Store Admin', email: 'admin@novamart.pk', password: 'Admin@123', role: 'admin' },
  { name: 'Ali Raza', email: 'ali@example.com', password: 'Customer@123', role: 'customer' },
  { name: 'Sara Khan', email: 'sara@example.com', password: 'Customer@123', role: 'customer' },
];

export const coupons = [
  { code: 'WELCOME10', type: 'percent', value: 10, min_subtotal: 2000, is_active: true, expires_at: null },
  { code: 'FLAT500', type: 'fixed', value: 500, min_subtotal: 3000, is_active: true, expires_at: null },
  { code: 'EXPIRED20', type: 'percent', value: 20, min_subtotal: 0, is_active: true, expires_at: '2024-01-01T00:00:00Z' },
  { code: 'INACTIVE15', type: 'percent', value: 15, min_subtotal: 0, is_active: false, expires_at: null },
];

// [productIndex, userEmail, rating, comment]
export const reviews = [
  [0, 'ali@example.com', 5, 'Amazing noise cancellation, battery lasts forever.'],
  [0, 'sara@example.com', 4, 'Very comfortable, slightly heavy for long use.'],
  [1, 'ali@example.com', 4, 'Great tracking accuracy and the display is bright.'],
  [6, 'sara@example.com', 5, 'Fabric quality is excellent, fits perfectly.'],
  [11, 'ali@example.com', 5, 'Gives the room a lovely warm glow.'],
  [16, 'sara@example.com', 4, 'Noticeable difference after two weeks.'],
  [22, 'ali@example.com', 5, 'Superb pickup and balance.'],
  [20, 'sara@example.com', 3, 'Good grip but has a strong smell at first.'],
];
