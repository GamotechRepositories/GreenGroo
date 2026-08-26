import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/shift_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/buttons/primary_button.dart';

class SelectShiftScreen extends StatefulWidget {
  const SelectShiftScreen({
    super.key,
    this.embedded = false,
    this.onBookingDone,
  });

  final bool embedded;
  final VoidCallback? onBookingDone;

  @override
  State<SelectShiftScreen> createState() => _SelectShiftScreenState();
}

class _SelectShiftScreenState extends State<SelectShiftScreen> {
  DateTime _selectedDate = DateTime.now();
  bool _loading = true;
  AvailableSlotsResponse? _slotsResponse;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadSlots();
  }

  String _formatDateString(DateTime dt) {
    final y = dt.year.toString().padLeft(4, '0');
    final m = dt.month.toString().padLeft(2, '0');
    final d = dt.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  Future<void> _loadSlots() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    final dateStr = _formatDateString(_selectedDate);
    final res = await ShiftService.instance.fetchAvailableSlots(dateStr);

    if (mounted) {
      setState(() {
        _slotsResponse = res;
        _loading = false;
        if (res == null) {
          _error = 'Failed to load available shifts for this date';
        }
      });
      final msgs = await AuthService.instance.consumeSlotCancellationAlerts();
      if (!mounted || msgs.isEmpty) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msgs.join('\n')),
          duration: const Duration(seconds: 6),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _onConfirmBooking(ShiftSlotInfo slot) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          AppLocalizations.of(context).confirmShiftTitle,
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDialogRow(AppLocalizations.of(context).date, _slotsResponse?.date ?? _formatDateString(_selectedDate)),
            const SizedBox(height: 8),
            _buildDialogRow(AppLocalizations.of(context).shifts, slot.shiftName),
            const SizedBox(height: 8),
            _buildDialogRow(AppLocalizations.of(context).workingHoursLabel, '${slot.startTime} – ${slot.endTime}'),
            const SizedBox(height: 8),
            _buildDialogRow(AppLocalizations.of(context).store, _slotsResponse?.storeName ?? 'Dark Store'),
            const SizedBox(height: 12),
            Text(
              AppLocalizations.of(context).confirmBookQuestion,
              style: const TextStyle(fontSize: 13, color: Colors.black87),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              await _processBooking(slot);
            },
            child: Text(AppLocalizations.of(context).confirmShiftTitle, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildDialogRow(String label, String value) {
    return Row(
      children: [
        Text('$label: ', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black54)),
        Expanded(
          child: Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
        ),
      ],
    );
  }

  Future<void> _processBooking(ShiftSlotInfo slot) async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Processing booking...')),
    );

    try {
      final booking = await ShiftService.instance.bookSlot(slot.id);
      if (mounted && booking != null) {
        _showSuccessBottomSheet(booking);
        _loadSlots();
        widget.onBookingDone?.call();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showSuccessBottomSheet(ShiftBookingInfo booking) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          bool isNotificationOn = booking.notificationEnabled;
          int selectedMins = booking.notificationTimeMinutes;

          return Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: const BoxDecoration(
                    color: Color(0xFFDCFCE7),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 34),
                ),
                const SizedBox(height: 12),
                Text(
                  AppLocalizations.of(context).shiftBookedSuccessfully,
                  style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  AppLocalizations.of(context).shiftConfirmedSubtitle,
                  style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Date', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
                          Text(booking.dateString, style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Working Hours', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
                          Text('${booking.startTime} – ${booking.endTime}', style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Store', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
                          Text(booking.storeName, style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFFDE68A)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.notifications_active_rounded, color: Color(0xFFD97706), size: 24),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '🔔 Shift Reminder',
                              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF92400E)),
                            ),
                            Text(
                              'Get push alert before shift starts',
                              style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFFB45309)),
                            ),
                          ],
                        ),
                      ),
                      Switch(
                        value: isNotificationOn,
                        activeTrackColor: const Color(0xFFD97706),
                        onChanged: (val) async {
                          setModalState(() => isNotificationOn = val);
                          await ShiftService.instance.toggleNotification(booking.id, val, selectedMins);
                        },
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),
                PrimaryButton(
                  label: 'Done',
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateStr = _formatDateString(_selectedDate);

    final content = RefreshIndicator(
      onRefresh: _loadSlots,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF047857), Color(0xFF059669)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.2),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          AppLocalizations.of(context).todayUpper,
                          style: const TextStyle(
                            color: Colors.white70,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            letterSpacing: 1.2,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.access_time_rounded, color: Colors.white, size: 14),
                              const SizedBox(width: 4),
                              Text(
                                _slotsResponse?.serverTime.isNotEmpty == true
                                    ? _slotsResponse!.serverTime.substring(11, 16)
                                    : AppLocalizations.of(context).liveServerTime,
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      dateStr,
                      style: GoogleFonts.inter(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _slotsResponse?.storeName ?? 'Dark Store Hub',
                      style: GoogleFonts.inter(fontSize: 13, color: Colors.white70),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              SizedBox(
                height: 40,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: 7,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    final date = DateTime.now().add(Duration(days: index));
                    final isSelected = date.day == _selectedDate.day && date.month == _selectedDate.month;
                    final dayName = weekdayNames[date.weekday - 1];
                    final label = index == 0 ? '${AppLocalizations.of(context).todayUpper} ($dayName)' : '$dayName ${date.day}/${date.month}';

                    return GestureDetector(
                      onTap: () {
                        setState(() => _selectedDate = date);
                        _loadSlots();
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.primary : AppColors.cardBackground,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: isSelected ? AppColors.primary : AppColors.cardBorder),
                        ),
                        child: Center(
                          child: Text(
                            label,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: isSelected ? Colors.white : AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 24),
              Text(
                AppLocalizations.of(context).availableShiftSlots,
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                AppLocalizations.of(context).filterServerTimeHint,
                style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 16),

              if (_loading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (_error != null)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(30),
                    child: Text(_error!, style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                  ),
                )
              else () {
                final activeSlotId = _slotsResponse?.activeBooking?.slotId;
                final availableSlotsList = (_slotsResponse?.slots ?? []).where((slot) {
                  final isUserBooked = activeSlotId != null &&
                      activeSlotId.isNotEmpty &&
                      activeSlotId == slot.id;
                  return !isUserBooked;
                }).toList();

                if (availableSlotsList.isEmpty) {
                  return Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(30),
                    decoration: BoxDecoration(
                      color: AppColors.cardBackground,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.cardBorder),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.event_busy_rounded, color: Colors.grey, size: 48),
                        const SizedBox(height: 12),
                        Text(
                          AppLocalizations.of(context).noAvailableSlotsForDate,
                          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          AppLocalizations.of(context).allSlotsBookedOrEnded,
                          style: GoogleFonts.inter(color: AppColors.textSecondary, fontSize: 12),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: availableSlotsList.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final slot = availableSlotsList[index];
                    final isUserBooked = slot.isBookedByMe || _slotsResponse?.activeBooking?.slotId == slot.id;

                    final isEnded = slot.status == 'ENDED';
                    final isFull = slot.status == 'FULL' || slot.remainingCapacity == 0;
                    final isFew = slot.status == 'FEW_SPOTS_LEFT';
                    final isDisabled = isEnded || isFull || isUserBooked;

                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isUserBooked
                            ? (ThemeController.instance.isDark ? const Color(0xFF064E3B) : const Color(0xFFF0FDF4))
                            : (isDisabled ? AppColors.cardSubBg : AppColors.cardBackground),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isUserBooked
                              ? (ThemeController.instance.isDark ? const Color(0xFF10B981) : const Color(0xFF22C55E))
                              : (isDisabled
                                  ? AppColors.cardSubBorder
                                  : (isFew ? const Color(0xFFF59E0B) : AppColors.cardBorder)),
                          width: isUserBooked ? 1.5 : 1.0,
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      '${slot.startTime} – ${slot.endTime}',
                                      style: GoogleFonts.inter(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w800,
                                        color: isUserBooked
                                            ? const Color(0xFF15803D)
                                            : (isDisabled ? Colors.grey : AppColors.textPrimary),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  slot.shiftName,
                                  style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary),
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: isUserBooked
                                        ? const Color(0xFFDCFCE7)
                                        : isEnded
                                            ? const Color(0xFFF3F4F6)
                                            : isFull
                                                ? const Color(0xFFFEE2E2)
                                                : isFew
                                                    ? const Color(0xFFFEF3C7)
                                                    : const Color(0xFFDCFCE7),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    isUserBooked
                                        ? AppLocalizations.of(context).shiftStatusYourBooked
                                        : isEnded
                                            ? AppLocalizations.of(context).shiftStatusEnded
                                            : isFull
                                                ? AppLocalizations.of(context).shiftStatusFull
                                                : isFew
                                                    ? AppLocalizations.of(context).spotsLeftCount(slot.remainingCapacity)
                                                    : AppLocalizations.of(context).spotsAvailableCount(slot.remainingCapacity),
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: isUserBooked
                                          ? const Color(0xFF15803D)
                                          : isEnded
                                              ? Colors.grey.shade600
                                              : isFull
                                                  ? const Color(0xFF991B1B)
                                                  : isFew
                                                      ? const Color(0xFFD97706)
                                                      : const Color(0xFF15803D),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: isUserBooked
                                  ? const Color(0xFF16A34A)
                                  : (isDisabled ? Colors.grey.shade300 : AppColors.primary),
                              elevation: (isDisabled && !isUserBooked) ? 0 : 2,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            onPressed: isDisabled
                                ? null
                                : () => _onConfirmBooking(slot),
                            child: Text(
                              isUserBooked
                                  ? AppLocalizations.of(context).badgeBooked
                                  : isEnded
                                      ? AppLocalizations.of(context).badgeEnded
                                      : isFull
                                          ? AppLocalizations.of(context).badgeFull
                                          : AppLocalizations.of(context).btnBook,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: isUserBooked
                                    ? Colors.white
                                    : (isDisabled ? Colors.grey.shade600 : Colors.white),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              }(),
            ],
          ),
        ),
      );

    if (widget.embedded) return content;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: Text(
          AppLocalizations.of(context).selectYourShift,
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
      ),
      body: content,
    );
  }
}
