import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../routes/route_paths.dart';

class CartTermsBox extends StatelessWidget {
  const CartTermsBox({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(height: 24),
        const Text(
          'Terms & Conditions',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
        const SizedBox(height: 10),
        const _TermItem('Minimum order quantity is 10 units unless stated otherwise.'),
        const _TermItem('Orders are subject to stock availability and confirmation.'),
        const _TermItem('Prices include GST where applicable; invoices are GST-compliant.'),
        const _TermItem('Delivery timelines vary by location and order size.'),
        const _TermItem(
          'Returns for defective goods must be reported within the specified timeframe.',
        ),
        const SizedBox(height: 10),
        Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            const Text(
              'By placing an order, you agree to our ',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
            ),
            GestureDetector(
              onTap: () => context.push(RoutePaths.terms),
              child: const Text(
                'Terms & Conditions',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
            ),
            const Text(
              '.',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],
        ),
      ],
    );
  }
}

class _TermItem extends StatelessWidget {
  const _TermItem(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}
