import 'package:flutter/material.dart';

enum LivenessChallenge {
  centerFace,
  blink,
  lookLeft,
  lookRight,
  lookUp,
}

extension LivenessChallengeX on LivenessChallenge {
  String get instruction => switch (this) {
        LivenessChallenge.centerFace => 'Center your face in the circle',
        LivenessChallenge.blink => 'Blink your eyes',
        LivenessChallenge.lookLeft => 'Turn your head left',
        LivenessChallenge.lookRight => 'Turn your head right',
        LivenessChallenge.lookUp => 'Look up',
      };

  IconData get hintIcon => switch (this) {
        LivenessChallenge.centerFace => Icons.face_retouching_natural_rounded,
        LivenessChallenge.blink => Icons.visibility_rounded,
        LivenessChallenge.lookLeft => Icons.arrow_back_rounded,
        LivenessChallenge.lookRight => Icons.arrow_forward_rounded,
        LivenessChallenge.lookUp => Icons.arrow_upward_rounded,
      };
}
