package com.greengrocc.app

import com.greengrocc.userapp.MainActivity as UserAppMainActivity

/**
 * Backward compatibility alias so both `com.greengrocc.app.MainActivity` and
 * `com.greengrocc.userapp.MainActivity` exist in the compiled DEX.
 */
class MainActivity : UserAppMainActivity()
