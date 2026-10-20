import 'dart:async';

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
  String _clockText = '--:--';
  Timer? _clockTimer;

  @override
  void initState() {
    super.initState();
    _tickClock();
    _clockTimer = Timer.periodic(const Duration(seconds: 30), (_) => _tickClock());
    _loadSlots();
  }

  @override
  void dispose() {
    _clockTimer?.cancel();
    super.dispose();
  }

  /// Live IST clock (UTC+5:30) so header always shows current India time.
  void _tickClock() {
    final ist = DateTime.now().toUtc().add(const Duration(hours: 5, minutes: 30));
    final hh = ist.hour.toString().padLeft(2, '0');
    final mm = ist.minute.toString().padLeft(2, '0');
    if (!mounted) return;
    setState(() => _clockText = '$hh:$mm');
  }

  String _formatDateString(DateTime dt) {
    final y = dt.year.toString().padLeft(4, '0');
    final m = dt.month.toString().padLeft(2, '0');
    final d = dt.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  String get _headerTime {
    // Prefer live IST clock; fall back to API IST if timer not ready yet
    if (_clockText != '--:--') return _clockText;
    final fromApi = _slotsResponse?.serverTimeIST.trim() ?? '';
    return fromApi.isNotEmpty ? fromApi : '--:--';
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
              style: TextStyle(fontSize: 13, color: AppColors.textPrimary),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
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
        Text('$label: ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textSecondary)),
        Expanded(
          child: Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
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

          final isDark = Theme.of(context).brightness == Brightness.dark;

          return Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.cardBackground,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF064E3B) : const Color(0xFFE8F5E9),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.check_circle_rounded, color: isDark ? const Color(0xFF22C55E) : const Color(0xFF0F5A32), size: 28),
                ),
                const SizedBox(height: 10),
                Text(
                  AppLocalizations.of(context).shiftBookedSuccessfully,
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  AppLocalizations.of(context).shiftConfirmedSubtitle,
                  style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.cardSubBg,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Date', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600, fontSize: 13)),
                          Text(booking.dateString, style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontSize: 13)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Working Hours', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600, fontSize: 13)),
                          Text('${booking.startTime} – ${booking.endTime}', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontSize: 13)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Store', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600, fontSize: 13)),
                          Text(booking.storeName, style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 13)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF292211) : const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: isDark ? const Color(0xFF78350F) : const Color(0xFFFDE68A)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.notifications_active_rounded, color: Color(0xFFF59E0B), size: 22),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '🔔 Shift Reminder',
                              style: GoogleFonts.inter(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                                color: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
                              ),
                            ),
                            Text(
                              'Get push alert before shift starts',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFFB45309),
                              ),
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

                const SizedBox(height: 16),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
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
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDark
                        ? const [Color(0xFF064E3B), Color(0xFF0F291E)]
                        : const [Color(0xFF0F5A32), Color(0xFF084826)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Text(
                      AppLocalizations.of(context).todayUpper,
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        dateStr,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const Icon(Icons.access_time_rounded, color: Colors.white, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      _headerTime,
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 14),

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
                final selectedDateStr = dateStr;
                final activeForSelectedDay =
                    _slotsResponse?.activeBooking?.dateString == selectedDateStr
                        ? _slotsResponse?.activeBooking
                        : null;
                final activeSlotId = activeForSelectedDay?.slotId;
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
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final slot = availableSlotsList[index];
                    final isUserBooked = slot.isBookedByMe ||
                        (activeSlotId != null && activeSlotId == slot.id);

                    final isEnded = slot.status == 'ENDED';
                    final isFull = slot.status == 'FULL' || slot.remainingCapacity == 0;
                    final isFew = slot.status == 'FEW_SPOTS_LEFT';
                    final isDisabled = isEnded || isFull || isUserBooked;
                    final isDark = Theme.of(context).brightness == Brightness.dark;

                    final timeLower = slot.startTime.toLowerCase();
                    final timeEmoji = timeLower.contains('am') || (slot.startTime.startsWith('0') || slot.startTime.startsWith('10') || slot.startTime.startsWith('11'))
                        ? '🌅'
                        : timeLower.contains('pm') && (slot.startTime.startsWith('12') || slot.startTime.startsWith('01') || slot.startTime.startsWith('02') || slot.startTime.startsWith('03') || slot.startTime.startsWith('04'))
                            ? '☀️'
                            : '🌙';

                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: isUserBooked
                            ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFE8F5E9))
                            : (isDisabled ? (isDark ? const Color(0xFF1E293B).withValues(alpha: 0.4) : AppColors.cardSubBg) : AppColors.cardBackground),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isUserBooked
                              ? (isDark ? const Color(0xFF22C55E) : const Color(0xFF0F5A32))
                              : (isDisabled
                                  ? AppColors.cardSubBorder
                                  : (isFew ? const Color(0xFFF59E0B) : AppColors.cardBorder)),
                          width: isUserBooked ? 1.5 : 1.0,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 34,
                            height: 34,
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Center(
                              child: Text(timeEmoji, style: const TextStyle(fontSize: 16)),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      '${slot.startTime} – ${slot.endTime}',
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w800,
                                        color: isUserBooked
                                            ? (isDark ? const Color(0xFF34D399) : const Color(0xFF0F5A32))
                                            : (isDisabled ? (isDark ? const Color(0xFF64748B) : Colors.grey) : AppColors.textPrimary),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    Text(
                                      slot.shiftName,
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w500,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: isUserBooked
                                            ? (isDark ? const Color(0xFF064E3B) : const Color(0xFF0F5A32).withValues(alpha: 0.12))
                                            : isEnded
                                                ? (isDark ? const Color(0xFF334155) : const Color(0xFFF3F4F6))
                                                : isFull
                                                    ? (isDark ? const Color(0xFF451A1A) : const Color(0xFFFEE2E2))
                                                    : isFew
                                                        ? (isDark ? const Color(0xFF451A03) : const Color(0xFFFEF3C7))
                                                        : (isDark ? const Color(0xFF064E3B) : const Color(0xFF0F5A32).withValues(alpha: 0.12)),
                                        borderRadius: BorderRadius.circular(6),
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
                                          fontSize: 10,
                                          fontWeight: FontWeight.w800,
                                          color: isUserBooked
                                              ? (isDark ? const Color(0xFF6EE7B7) : const Color(0xFF0F5A32))
                                              : isEnded
                                                  ? (isDark ? const Color(0xFF94A3B8) : Colors.grey.shade600)
                                                  : isFull
                                                      ? (isDark ? const Color(0xFFFCA5A5) : const Color(0xFF991B1B))
                                                      : isFew
                                                          ? (isDark ? const Color(0xFFFDE68A) : const Color(0xFFD97706))
                                                          : (isDark ? const Color(0xFF6EE7B7) : const Color(0xFF0F5A32)),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          SizedBox(
                            height: 32,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: isUserBooked
                                    ? (isDark ? const Color(0xFF064E3B) : const Color(0xFF0F5A32))
                                    : (isDisabled
                                        ? (isDark ? const Color(0xFF334155) : Colors.grey.shade300)
                                        : AppColors.primary),
                                elevation: (isDisabled && !isUserBooked) ? 0 : 1,
                                padding: const EdgeInsets.symmetric(horizontal: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: isDisabled ? null : () => _onConfirmBooking(slot),
                              child: Text(
                                isUserBooked
                                    ? AppLocalizations.of(context).badgeBooked
                                    : isEnded
                                        ? AppLocalizations.of(context).badgeEnded
                                        : isFull
                                            ? AppLocalizations.of(context).badgeFull
                                            : AppLocalizations.of(context).btnBook,
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                  color: isUserBooked
                                      ? Colors.white
                                      : (isDisabled
                                          ? (isDark ? const Color(0xFF64748B) : Colors.grey.shade600)
                                          : Colors.white),
                                ),
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
