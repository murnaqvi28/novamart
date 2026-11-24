export const PRODUCT_SELECT = `
  SELECT p.id, p.name, p.slug, p.description, p.price, p.compare_at_price, p.stock,
         p.image_url, p.is_featured, p.is_active, p.created_at,
         c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
         COALESCE(r.avg_rating, 0) AS rating, COALESCE(r.review_count, 0) AS review_count
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN (
    SELECT product_id, ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*)::int AS review_count
    FROM reviews GROUP BY product_id
  ) r ON r.product_id = p.id`;

export function formatProduct(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    compareAtPrice: row.compare_at_price,
    stock: row.stock,
    inStock: row.stock > 0,
    imageUrl: row.image_url,
    isFeatured: row.is_featured,
    isActive: row.is_active,
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    category: row.category_id ? { id: row.category_id, name: row.category_name, slug: row.category_slug } : null,
    createdAt: row.created_at,
  };
}

export function formatUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.created_at };
}

export function formatOrder(o, items) {
  return {
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    paymentMethod: o.payment_method,
    cardLast4: o.card_last4,
    subtotal: o.subtotal,
    discount: o.discount,
    shippingFee: o.shipping_fee,
    total: o.total,
    couponCode: o.coupon_code,
    shipping: { name: o.ship_name, phone: o.ship_phone, address: o.ship_address, city: o.ship_city, postalCode: o.ship_postal },
    ...(o.customer_email ? { customer: { name: o.customer_name, email: o.customer_email } } : {}),
    ...(o.item_count !== undefined ? { itemCount: Number(o.item_count) } : {}),
    ...(items ? { items: items.map((i) => ({ productId: i.product_id, name: i.product_name, unitPrice: i.unit_price, quantity: i.quantity, lineTotal: i.line_total, imageUrl: i.image_url ?? null, slug: i.slug ?? null })) } : {}),
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };
}
