import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/theme.dart';
import '../../config/contact.dart';
import '../../routes/route_paths.dart';
import 'static_content.dart';

class BlogScreen extends StatelessWidget {
  const BlogScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.canPop() ? context.pop() : context.go(RoutePaths.home),
        ),
        title: const Text('Blog'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          const Text(
            'Tips, trends, and insights for mobile retailers, distributors, and bulk buyers across India.',
            style: TextStyle(color: AppColors.textSecondary, height: 1.4),
          ),
          const SizedBox(height: 16),
          ...blogPosts.map(
            (post) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(post.date, style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                    const SizedBox(height: 6),
                    Text(post.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    Text(post.excerpt, style: const TextStyle(color: AppColors.textSecondary, height: 1.4)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});

  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  final _nameController = TextEditingController();
  final _businessController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _messageController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _businessController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  void _submit() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Thank you! Our sales team will contact you shortly with a bulk quote.'),
      ),
    );
    _nameController.clear();
    _businessController.clear();
    _phoneController.clear();
    _emailController.clear();
    _messageController.clear();
  }

  Future<void> _launch(String url) async {
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.canPop() ? context.pop() : context.go(RoutePaths.home),
        ),
        title: const Text('Contact Us'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          const Text(
            'Tell us the brands, models, and quantity you need. We respond to bulk enquiries within one business day.',
            style: TextStyle(color: AppColors.textSecondary, height: 1.4),
          ),
          const SizedBox(height: 16),
          _contactInfo(Icons.phone, 'Phone / WhatsApp', ContactConfig.contactPhoneDisplay, ContactConfig.contactPhoneTel),
          const SizedBox(height: 10),
          _contactInfo(Icons.email_outlined, 'Email', ContactConfig.contactEmail, 'mailto:${ContactConfig.contactEmail}'),
          const SizedBox(height: 10),
          const _ContactInfoStatic(Icons.schedule, 'Office Hours', 'Mon – Sat · 10:00 AM – 7:00 PM IST'),
          const SizedBox(height: 10),
          const _ContactInfoStatic(Icons.home_work_outlined, 'Address', ContactConfig.contactAddress),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Column(
              children: [
                TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Name *')),
                const SizedBox(height: 10),
                TextField(controller: _businessController, decoration: const InputDecoration(labelText: 'Business Name')),
                const SizedBox(height: 10),
                TextField(controller: _phoneController, decoration: const InputDecoration(labelText: 'Phone *'), keyboardType: TextInputType.phone),
                const SizedBox(height: 10),
                TextField(controller: _emailController, decoration: const InputDecoration(labelText: 'Email *'), keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 10),
                TextField(controller: _messageController, decoration: const InputDecoration(labelText: 'Message *'), maxLines: 4),
                const SizedBox(height: 16),
                FilledButton(onPressed: _submit, child: const Text('Request Bulk Quote')),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _contactInfo(IconData icon, String label, String value, String href) {
    return InkWell(
      onTap: () => _launch(href),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.borderLight),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text(value, style: const TextStyle(color: AppColors.primary)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ContactInfoStatic extends StatelessWidget {
  const _ContactInfoStatic(this.icon, this.label, this.value);

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(value, style: const TextStyle(color: AppColors.textSecondary)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
