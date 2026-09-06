package com.nearu.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.nearu.app.permissions.LaloaPermissionsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LaloaPermissionsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

