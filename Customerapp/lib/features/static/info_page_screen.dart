import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../routes/route_paths.dart';
import 'static_content.dart';

class InfoPageScreen extends StatelessWidget {
  const InfoPageScreen({super.key, required this.content});

  final StaticPageContent content;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.canPop() ? context.pop() : context.go(RoutePaths.home),
        ),
        title: Text(content.title),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          if (content.subtitle != null) ...[
            Text(
              content.subtitle!,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
          ],
          ...content.sections.map((section) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (section.title.isNotEmpty) ...[
                      Text(
                        section.title,
                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                    ],
                    if (section.body.isNotEmpty)
                      Text(
                        section.body,
                        style: const TextStyle(color: AppColors.textSecondary, height: 1.5),
                      ),
                    if (section.bullets != null) ...[
                      if (section.body.isNotEmpty) const SizedBox(height: 8),
                      ...section.bullets!.map(
                        (item) => Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('✓ ', style: TextStyle(color: AppColors.primary)),
                              Expanded(
                                child: Text(
                                  item,
                                  style: const TextStyle(color: AppColors.textSecondary, height: 1.4),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
