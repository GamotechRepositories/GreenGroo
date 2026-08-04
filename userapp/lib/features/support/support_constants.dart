import '../../config/contact.dart';

class SupportIssueOption {
  const SupportIssueOption({required this.value, required this.label});

  final String value;
  final String label;
}

const supportIssueOptions = <SupportIssueOption>[
  SupportIssueOption(value: 'payment', label: 'Payment Issue'),
  SupportIssueOption(value: 'order', label: 'Order Issue'),
  SupportIssueOption(value: 'return_refund', label: 'Return & Refund'),
  SupportIssueOption(value: 'product_inquiry', label: 'Product Inquiry'),
  SupportIssueOption(value: 'delivery', label: 'Delivery Issue'),
  SupportIssueOption(value: 'place_order', label: 'Want to place order?'),
  SupportIssueOption(value: 'other', label: 'Other'),
];

const supportContactPhone = ContactConfig.contactPhoneDisplay;
const supportContactPhoneHref = ContactConfig.contactPhoneTel;
const supportContactEmail = ContactConfig.contactEmail;
const supportWhatsAppHref = ContactConfig.supportWhatsAppUrl;

const supportFaqs = <Map<String, String>>[
  {
    'question': 'How can I track my order?',
    'answer':
        'Go to My Orders in your account to see live status and tracking details once your order is shipped.',
  },
  {
    'question': 'What is your return and refund policy?',
    'answer':
        'Eligible products can be returned within the return window shown on the product page. Refunds are processed after inspection.',
  },
  {
    'question': 'How can I cancel my order?',
    'answer':
        'Open the order from My Orders and use Cancel if the order is still eligible. For help, contact our support team.',
  },
  {
    'question': 'How can I upload payment screenshot?',
    'answer':
        'Use the attachment field in this support form to upload your payment screenshot, or send it on WhatsApp.',
  },
];
