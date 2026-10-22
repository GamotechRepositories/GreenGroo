class StaffProfile {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String role;
  final String roleLabel;
  final String department;
  final bool isCustomRole;

  StaffProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    required this.roleLabel,
    required this.department,
    required this.isCustomRole,
  });

  factory StaffProfile.fromJson(Map<String, dynamic> json) {
    return StaffProfile(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Staff Member',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      role: json['role']?.toString() ?? 'staff',
      roleLabel: json['roleLabel']?.toString() ?? json['role']?.toString() ?? 'Staff',
      department: json['department']?.toString() ?? 'Operations',
      isCustomRole: json['isCustomRole'] == true,
    );
  }
}

class OverviewData {
  final StaffProfile profile;
  final bool isClockedIn;
  final String todayDate;
  final String? clockInTime;
  final String? clockOutTime;
  final String shiftName;
  final String shiftTimings;
  final Map<String, dynamic>? latestFeed;
  final Map<String, dynamic>? upcomingMeeting;
  final int unreadNotificationsCount;

  OverviewData({
    required this.profile,
    required this.isClockedIn,
    required this.todayDate,
    this.clockInTime,
    this.clockOutTime,
    required this.shiftName,
    required this.shiftTimings,
    this.latestFeed,
    this.upcomingMeeting,
    required this.unreadNotificationsCount,
  });

  factory OverviewData.fromJson(Map<String, dynamic> json) {
    final prof = StaffProfile.fromJson(json['profile'] ?? {});
    final today = json['today'] ?? {};
    final shift = json['shift'] ?? {};

    return OverviewData(
      profile: prof,
      isClockedIn: today['isClockedIn'] == true,
      todayDate: today['date']?.toString() ?? '',
      clockInTime: today['clockInTime']?.toString(),
      clockOutTime: today['clockOutTime']?.toString(),
      shiftName: shift['name']?.toString() ?? 'General Shift',
      shiftTimings: '${shift['startTime'] ?? '09:00'} - ${shift['endTime'] ?? '18:00'}',
      latestFeed: json['latestFeed'] as Map<String, dynamic>?,
      upcomingMeeting: json['upcomingMeeting'] as Map<String, dynamic>?,
      unreadNotificationsCount: json['unreadNotificationsCount'] is int
          ? json['unreadNotificationsCount']
          : int.tryParse(json['unreadNotificationsCount']?.toString() ?? '0') ?? 0,
    );
  }
}

class FeedItem {
  final String id;
  final String title;
  final String body;
  final String category; // 'announcement' | 'holiday' | 'note'
  final String date;
  final String createdBy;

  FeedItem({
    required this.id,
    required this.title,
    required this.body,
    required this.category,
    required this.date,
    required this.createdBy,
  });

  factory FeedItem.fromJson(Map<String, dynamic> json) {
    return FeedItem(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      body: json['body']?.toString() ?? '',
      category: json['category']?.toString() ?? 'announcement',
      date: json['scheduledAt']?.toString().isNotEmpty == true
          ? json['scheduledAt'].toString()
          : (json['publishedAt']?.toString() ?? json['createdAt']?.toString() ?? ''),
      createdBy: json['createdBy']?.toString() ?? 'HR Management',
    );
  }
}

class ShiftItem {
  final String id;
  final String date;
  final String startTime;
  final String endTime;
  final String shiftName;
  final String notes;

  ShiftItem({
    required this.id,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.shiftName,
    required this.notes,
  });

  factory ShiftItem.fromJson(Map<String, dynamic> json) {
    return ShiftItem(
      id: json['_id']?.toString() ?? '',
      date: json['date']?.toString() ?? '',
      startTime: json['startTime']?.toString() ?? '09:00',
      endTime: json['endTime']?.toString() ?? '18:00',
      shiftName: json['shiftName']?.toString() ?? 'General',
      notes: json['notes']?.toString() ?? '',
    );
  }
}

class AttendanceRecord {
  final String id;
  final String date;
  final String? clockIn;
  final String? clockOut;
  final String notes;

  AttendanceRecord({
    required this.id,
    required this.date,
    this.clockIn,
    this.clockOut,
    required this.notes,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      id: json['_id']?.toString() ?? '',
      date: json['date']?.toString() ?? '',
      clockIn: json['clockIn']?.toString(),
      clockOut: json['clockOut']?.toString(),
      notes: json['notes']?.toString() ?? '',
    );
  }
}

class LeaveBalanceItem {
  final int total;
  final int used;
  final int remaining;

  LeaveBalanceItem({required this.total, required this.used, required this.remaining});

  factory LeaveBalanceItem.fromJson(Map<String, dynamic>? json) {
    if (json == null) return LeaveBalanceItem(total: 0, used: 0, remaining: 0);
    return LeaveBalanceItem(
      total: (json['total'] as num?)?.toInt() ?? 0,
      used: (json['used'] as num?)?.toInt() ?? 0,
      remaining: (json['remaining'] as num?)?.toInt() ?? 0,
    );
  }
}

class LeaveRequestItem {
  final String id;
  final String leaveType;
  final String fromDate;
  final String toDate;
  final int days;
  final String reason;
  final String status; // 'pending' | 'approved' | 'rejected'
  final String adminNotes;
  final String createdAt;

  LeaveRequestItem({
    required this.id,
    required this.leaveType,
    required this.fromDate,
    required this.toDate,
    required this.days,
    required this.reason,
    required this.status,
    required this.adminNotes,
    required this.createdAt,
  });

  factory LeaveRequestItem.fromJson(Map<String, dynamic> json) {
    return LeaveRequestItem(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      leaveType: json['leaveType']?.toString() ?? 'casual',
      fromDate: json['fromDate']?.toString() ?? '',
      toDate: json['toDate']?.toString() ?? '',
      days: (json['days'] as num?)?.toInt() ?? 1,
      reason: json['reason']?.toString() ?? '',
      status: json['status']?.toString() ?? 'pending',
      adminNotes: json['adminNotes']?.toString() ?? '',
      createdAt: json['createdAt']?.toString() ?? '',
    );
  }
}

class PayrollItem {
  final String id;
  final String month;
  final double gross;
  final double deductions;
  final double net;
  final double tax;
  final double incentives;
  final String status;
  final String? paidAt;
  final String notes;

  PayrollItem({
    required this.id,
    required this.month,
    required this.gross,
    required this.deductions,
    required this.net,
    required this.tax,
    required this.incentives,
    required this.status,
    this.paidAt,
    required this.notes,
  });

  factory PayrollItem.fromJson(Map<String, dynamic> json) {
    return PayrollItem(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      month: json['month']?.toString() ?? '',
      gross: (json['gross'] as num?)?.toDouble() ?? 0.0,
      deductions: (json['deductions'] as num?)?.toDouble() ?? 0.0,
      net: (json['net'] as num?)?.toDouble() ?? 0.0,
      tax: (json['tax'] as num?)?.toDouble() ?? 0.0,
      incentives: (json['incentives'] as num?)?.toDouble() ?? 0.0,
      status: json['status']?.toString() ?? 'pending',
      paidAt: json['paidAt']?.toString(),
      notes: json['notes']?.toString() ?? '',
    );
  }
}

class MeetingItem {
  final String id;
  final String title;
  final String date;
  final String time;
  final String link;
  final String meetingId;
  final String password;
  final String note;

  MeetingItem({
    required this.id,
    required this.title,
    required this.date,
    required this.time,
    required this.link,
    required this.meetingId,
    required this.password,
    required this.note,
  });

  factory MeetingItem.fromJson(Map<String, dynamic> json) {
    return MeetingItem(
      id: json['_id']?.toString() ?? '',
      title: json['title']?.toString() ?? json['note']?.toString() ?? 'Team Meeting',
      date: json['date']?.toString() ?? '',
      time: json['time']?.toString() ?? '',
      link: json['link']?.toString() ?? '',
      meetingId: json['meetingId']?.toString() ?? '',
      password: json['password']?.toString() ?? '',
      note: json['note']?.toString() ?? '',
    );
  }
}

class CustomNotificationItem {
  final String id;
  final String title;
  final String message;
  final String priority; // 'normal' | 'important' | 'urgent'
  final String category;
  final String sentBy;
  final String createdAt;
  final bool isRead;

  CustomNotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.priority,
    required this.category,
    required this.sentBy,
    required this.createdAt,
    required this.isRead,
  });

  factory CustomNotificationItem.fromJson(Map<String, dynamic> json) {
    return CustomNotificationItem(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      priority: json['priority']?.toString() ?? 'normal',
      category: json['category']?.toString() ?? 'general',
      sentBy: json['sentBy']?.toString() ?? 'Admin Operations',
      createdAt: json['createdAt']?.toString() ?? '',
      isRead: json['isRead'] == true,
    );
  }
}
