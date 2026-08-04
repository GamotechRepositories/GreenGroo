import '../../config/contact.dart';

class InfoSection {
  const InfoSection({required this.title, required this.body, this.bullets});

  final String title;
  final String body;
  final List<String>? bullets;
}

class StaticPageContent {
  const StaticPageContent({
    required this.title,
    this.subtitle,
    required this.sections,
  });

  final String title;
  final String? subtitle;
  final List<InfoSection> sections;
}

class BlogPost {
  const BlogPost({
    required this.title,
    required this.date,
    required this.excerpt,
  });

  final String title;
  final String date;
  final String excerpt;
}

const aboutPage = StaticPageContent(
  title: 'About BulkMobileMart',
  sections: [
    InfoSection(
      title: '',
      body:
          'BulkMobileMart was built for businesses that sell mobiles — not end-customers shopping one phone at a time. We connect retailers, online marketplace sellers, and regional distributors with genuine wholesale stock at prices that protect your margins.',
    ),
    InfoSection(
      title: 'Our Mission',
      body:
          'Make bulk smartphone sourcing simple, transparent, and reliable for every serious seller in India — with honest pricing, proper documentation, and support you can reach on a phone call.',
    ),
    InfoSection(
      title: 'Who We Serve',
      body: '',
      bullets: [
        'Mobile retail shops & multi-brand stores',
        'Amazon / Flipkart / Meesho resellers',
        'Corporate gifting & bulk procurement',
        'Regional distributors & sub-dealers',
      ],
    ),
    InfoSection(
      title: 'What We Offer',
      body: '',
      bullets: [
        'Latest smartphones — all major brands',
        'Mix-and-match bulk orders',
        'GST-compliant invoices',
        'IMEI-verified genuine units',
        'Warehouse pickup & courier delivery',
        'Repeat-order loyalty pricing',
      ],
    ),
  ],
);

const privacyPolicyPage = StaticPageContent(
  title: 'Privacy Policy',
  subtitle: 'Last updated: June 5, 2026',
  sections: [
    InfoSection(
      title: 'Information We Collect',
      body:
          'When you register, request a bulk quote, or contact us, we may collect your name, email, phone number, business details, and order-related information necessary to process your requests.',
    ),
    InfoSection(
      title: 'How We Use Your Information',
      body:
          'We use your data to process orders, send quotes, provide customer support, improve our services, and share relevant updates about bulk deals and new arrivals if you subscribe to our newsletter.',
    ),
    InfoSection(
      title: 'Data Security',
      body:
          'We implement reasonable security measures to protect your personal information. Passwords are encrypted and access to customer data is restricted to authorized personnel only.',
    ),
    InfoSection(
      title: 'Sharing of Information',
      body:
          'We do not sell your personal information. We may share data with trusted service providers (such as payment processors and courier partners) only as needed to fulfill your orders.',
    ),
    InfoSection(
      title: 'Contact Us',
      body:
          'For privacy-related questions, email us at ${ContactConfig.contactEmail} or call ${ContactConfig.contactPhoneDisplay}.',
    ),
  ],
);

const termsPage = StaticPageContent(
  title: 'Terms & Conditions',
  subtitle: 'Last updated: June 5, 2026',
  sections: [
    InfoSection(
      title: 'General',
      body:
          'By using BulkMobileMart, you agree to these terms. Our platform is intended for businesses, retailers, and distributors purchasing mobile devices in bulk — not for individual retail consumers.',
    ),
    InfoSection(
      title: 'Orders & Minimum Quantity',
      body:
          'Minimum order quantity is 10 units unless otherwise stated. All orders are subject to stock availability and confirmation by our sales team. Prices quoted are valid for the period specified in your bulk quote.',
    ),
    InfoSection(
      title: 'Payment & Invoicing',
      body:
          'Payment terms will be communicated at the time of order confirmation. GST-compliant invoices are provided for all eligible business purchases.',
    ),
    InfoSection(
      title: 'Delivery',
      body:
          'We ship pan-India through trusted courier partners. Delivery timelines vary by location and order size. Risk of loss passes to the buyer upon successful delivery.',
    ),
    InfoSection(
      title: 'Returns & Refunds',
      body:
          'Return eligibility depends on product category and condition. Contact support for return requests within the applicable window shown on your order or product page.',
    ),
    InfoSection(
      title: 'Contact',
      body:
          'Questions about these terms? Email ${ContactConfig.contactEmail} or call ${ContactConfig.contactPhoneDisplay}.',
    ),
  ],
);

const shippingDetailsPage = StaticPageContent(
  title: 'Shipping Details',
  subtitle: 'Last updated: June 10, 2026',
  sections: [
    InfoSection(
      title: 'Delivery Coverage',
      body:
          'BulkMobileMart ships across India through trusted courier and logistics partners. We deliver to most pin codes; remote or restricted areas may require additional time or confirmation before dispatch.',
    ),
    InfoSection(
      title: 'Processing Time',
      body:
          'Orders are typically processed within 1–2 business days after confirmation. You will receive order status updates via email and can track progress from your account under My Orders.',
    ),
    InfoSection(
      title: 'Delivery Charges',
      body:
          'Standard delivery charges apply on orders below ₹999. Orders of ₹999 and above qualify for free delivery on eligible products. Final shipping cost is shown at checkout before you place your order.',
    ),
    InfoSection(
      title: 'Estimated Delivery',
      body: '',
      bullets: [
        'Metro cities: 3–5 business days after dispatch',
        'Tier 2 & 3 cities: 5–8 business days after dispatch',
        'Bulk or high-value orders may require scheduled delivery',
      ],
    ),
    InfoSection(
      title: 'Cash on Delivery (COD)',
      body:
          'COD is available on eligible orders. A 10% advance payment is required at checkout; the balance is collected at delivery. Please ensure someone is available at the delivery address.',
    ),
    InfoSection(
      title: 'Contact for Shipping Help',
      body:
          'For shipping queries, email ${ContactConfig.contactEmail} or call ${ContactConfig.contactPhoneDisplay}. Our office is at ${ContactConfig.contactAddress}.',
    ),
  ],
);

const blogPosts = <BlogPost>[
  BlogPost(
    title: 'How to Start a Mobile Retail Business in India',
    date: 'May 28, 2026',
    excerpt:
        'A practical guide for new retailers — licensing, sourcing, margins, and choosing the right wholesale partner.',
  ),
  BlogPost(
    title: 'Bulk Smartphone Buying: 5 Mistakes to Avoid',
    date: 'May 15, 2026',
    excerpt:
        'Learn how to verify IMEI, avoid grey-market stock, and negotiate better bulk pricing for your store.',
  ),
  BlogPost(
    title: 'GST Invoices & Compliance for Mobile Distributors',
    date: 'May 2, 2026',
    excerpt:
        'Why proper GST billing matters for B2B mobile trade and how BulkMobileMart keeps your records clean.',
  ),
  BlogPost(
    title: 'Top Selling Smartphone Brands for Q2 2026',
    date: 'Apr 20, 2026',
    excerpt:
        'Market trends, fast-moving models, and which brands retailers are stocking in bulk this quarter.',
  ),
];
