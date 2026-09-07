package com.nearu.app.permissions;

import android.Manifest;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.ContactsContract;
import android.provider.Settings;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.LinkedHashMap;
import java.util.Map;

@CapacitorPlugin(
    name = "LaloaPermissions",
    permissions = {
        @Permission(
            alias = "location",
            strings = { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION }
        ),
        @Permission(
            alias = "camera",
            strings = { Manifest.permission.CAMERA }
        ),
        @Permission(
            alias = "microphone",
            strings = { Manifest.permission.RECORD_AUDIO }
        ),
        @Permission(
            alias = "notifications",
            strings = { "android.permission.POST_NOTIFICATIONS" }
        ),
        @Permission(
            alias = "contacts",
            strings = { Manifest.permission.READ_CONTACTS }
        )
    }
)
public class LaloaPermissionsPlugin extends Plugin {

    private static final String PREFS_NAME = "laloa_permissions_prefs";
    private static final String KEY_PREFIX_REQUESTED = "has_requested_";

    @PluginMethod
    public void getApiLevel(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("apiLevel", Build.VERSION.SDK_INT);
        ret.put("release", Build.VERSION.RELEASE);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkAppPermission(PluginCall call) {
        String name = call.getString("name");
        if (name == null) {
            call.reject("Missing 'name' parameter. Expected: location, camera, microphone, notifications");
            return;
        }

        JSObject ret = getPermissionStatusObject(name);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkAllPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("apiLevel", Build.VERSION.SDK_INT);
        ret.put("location", getPermissionStatusObject("location"));
        ret.put("camera", getPermissionStatusObject("camera"));
        ret.put("microphone", getPermissionStatusObject("microphone"));
        ret.put("notifications", getPermissionStatusObject("notifications"));
        ret.put("contacts", getPermissionStatusObject("contacts"));
        call.resolve(ret);
    }

    @PluginMethod
    public void getDeviceContacts(PluginCall call) {
        Context context = getContext();
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
            call.reject("Contacts permission not granted");
            return;
        }

        try {
            ContentResolver cr = context.getContentResolver();
            Map<String, JSObject> contactsMap = new LinkedHashMap<>();

            // 1. Query phone numbers
            Cursor phoneCursor = cr.query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                new String[] {
                    ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                    ContactsContract.CommonDataKinds.Phone.NUMBER
                },
                null,
                null,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
            );

            if (phoneCursor != null) {
                int idIdx = phoneCursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID);
                int nameIdx = phoneCursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                int numberIdx = phoneCursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);

                while (phoneCursor.moveToNext()) {
                    String contactId = idIdx >= 0 ? phoneCursor.getString(idIdx) : "";
                    String name = nameIdx >= 0 ? phoneCursor.getString(nameIdx) : "";
                    String number = numberIdx >= 0 ? phoneCursor.getString(numberIdx) : "";

                    if (contactId != null && !contactId.isEmpty()) {
                        if (!contactsMap.containsKey(contactId)) {
                            JSObject obj = new JSObject();
                            obj.put("name", name != null ? name : "");
                            obj.put("phone", number != null ? number : "");
                            contactsMap.put(contactId, obj);
                        } else {
                            JSObject existing = contactsMap.get(contactId);
                            if (existing != null && (existing.getString("phone") == null || existing.getString("phone").isEmpty())) {
                                existing.put("phone", number != null ? number : "");
                            }
                        }
                    } else {
                        String fallbackKey = (name != null ? name : "") + "_" + (number != null ? number : "");
                        if (!fallbackKey.equals("_") && !contactsMap.containsKey(fallbackKey)) {
                            JSObject obj = new JSObject();
                            obj.put("name", name != null ? name : "");
                            obj.put("phone", number != null ? number : "");
                            contactsMap.put(fallbackKey, obj);
                        }
                    }
                }
                phoneCursor.close();
            }

            // 2. Query email addresses
            Cursor emailCursor = cr.query(
                ContactsContract.CommonDataKinds.Email.CONTENT_URI,
                new String[] {
                    ContactsContract.CommonDataKinds.Email.CONTACT_ID,
                    ContactsContract.CommonDataKinds.Email.DATA
                },
                null,
                null,
                null
            );

            if (emailCursor != null) {
                int idIdx = emailCursor.getColumnIndex(ContactsContract.CommonDataKinds.Email.CONTACT_ID);
                int emailIdx = emailCursor.getColumnIndex(ContactsContract.CommonDataKinds.Email.DATA);

                while (emailCursor.moveToNext()) {
                    String contactId = idIdx >= 0 ? emailCursor.getString(idIdx) : "";
                    String email = emailIdx >= 0 ? emailCursor.getString(emailIdx) : "";

                    if (contactId != null && !contactId.isEmpty()) {
                        if (contactsMap.containsKey(contactId)) {
                            JSObject existing = contactsMap.get(contactId);
                            if (existing != null && (existing.getString("email") == null || existing.getString("email").isEmpty())) {
                                existing.put("email", email != null ? email : "");
                            }
                        } else {
                            JSObject obj = new JSObject();
                            obj.put("name", "");
                            obj.put("email", email != null ? email : "");
                            contactsMap.put(contactId, obj);
                        }
                    }
                }
                emailCursor.close();
            }

            JSArray contactsArray = new JSArray();
            for (JSObject contact : contactsMap.values()) {
                String phone = contact.getString("phone");
                String email = contact.getString("email");
                if ((phone != null && !phone.trim().isEmpty()) || (email != null && !email.trim().isEmpty())) {
                    contactsArray.put(contact);
                }
            }

            JSObject result = new JSObject();
            result.put("contacts", contactsArray);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to read device contacts: " + e.getMessage());
        }
    }

    @PluginMethod
    public void requestAppPermission(PluginCall call) {
        String name = call.getString("name");
        if (name == null) {
            call.reject("Missing 'name' parameter");
            return;
        }

        // Check if already granted
        JSObject currentStatus = getPermissionStatusObject(name);
        String state = currentStatus.getString("status");
        if ("granted".equals(state)) {
            call.resolve(currentStatus);
            return;
        }

        // Mark that user has been prompted once
        markPermissionRequested(name);

        // For notifications on Android < 33, runtime permission does not exist (handled via settings or notification manager)
        if ("notifications".equals(name) && Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            boolean enabled = NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
            JSObject res = new JSObject();
            res.put("name", "notifications");
            res.put("status", enabled ? "granted" : "denied");
            res.put("apiLevel", Build.VERSION.SDK_INT);
            call.resolve(res);
            return;
        }

        // Standard Capacitor permission request flow
        requestPermissionForAlias(name, call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        String name = call.getString("name");
        if (name == null) {
            call.reject("Permission callback error: missing name");
            return;
        }

        JSObject ret = getPermissionStatusObject(name);
        call.resolve(ret);
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Context context = getContext();
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            Uri uri = Uri.fromParts("package", context.getPackageName(), null);
            intent.setData(uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to open application settings: " + e.getMessage());
        }
    }

    private JSObject getPermissionStatusObject(String name) {
        Context context = getContext();
        JSObject obj = new JSObject();
        obj.put("name", name);
        obj.put("apiLevel", Build.VERSION.SDK_INT);

        switch (name) {
            case "location": {
                boolean fine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
                boolean coarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;

                if (fine || coarse) {
                    obj.put("status", "granted");
                    obj.put("isPrecise", fine);
                } else {
                    boolean previouslyRequested = hasBeenRequested(name);
                    boolean shouldShowRationale = (getActivity() != null) && (
                        ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), Manifest.permission.ACCESS_FINE_LOCATION) ||
                        ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), Manifest.permission.ACCESS_COARSE_LOCATION)
                    );

                    if (!previouslyRequested) {
                        obj.put("status", "prompt");
                    } else if (shouldShowRationale) {
                        obj.put("status", "denied");
                    } else {
                        // User checked "Don't ask again" or denied twice
                        obj.put("status", "permanently_denied");
                    }
                    obj.put("isPrecise", false);
                }
                break;
            }

            case "camera": {
                boolean granted = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
                if (granted) {
                    obj.put("status", "granted");
                } else {
                    boolean previouslyRequested = hasBeenRequested(name);
                    boolean shouldShowRationale = (getActivity() != null) &&
                        ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), Manifest.permission.CAMERA);

                    if (!previouslyRequested) {
                        obj.put("status", "prompt");
                    } else if (shouldShowRationale) {
                        obj.put("status", "denied");
                    } else {
                        obj.put("status", "permanently_denied");
                    }
                }
                break;
            }

            case "microphone": {
                boolean granted = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
                if (granted) {
                    obj.put("status", "granted");
                } else {
                    boolean previouslyRequested = hasBeenRequested(name);
                    boolean shouldShowRationale = (getActivity() != null) &&
                        ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), Manifest.permission.RECORD_AUDIO);

                    if (!previouslyRequested) {
                        obj.put("status", "prompt");
                    } else if (shouldShowRationale) {
                        obj.put("status", "denied");
                    } else {
                        obj.put("status", "permanently_denied");
                    }
                }
                break;
            }

            case "notifications": {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    boolean granted = ContextCompat.checkSelfPermission(context, "android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED;
                    if (granted) {
                        obj.put("status", "granted");
                    } else {
                        boolean previouslyRequested = hasBeenRequested(name);
                        boolean shouldShowRationale = (getActivity() != null) &&
                            ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), "android.permission.POST_NOTIFICATIONS");

                        if (!previouslyRequested) {
                            obj.put("status", "prompt");
                        } else if (shouldShowRationale) {
                            obj.put("status", "denied");
                        } else {
                            obj.put("status", "permanently_denied");
                        }
                    }
                } else {
                    // Android 12 and below: notifications are granted by default unless disabled in system settings
                    boolean enabled = NotificationManagerCompat.from(context).areNotificationsEnabled();
                    obj.put("status", enabled ? "granted" : "permanently_denied");
                }
                break;
            }

            case "contacts": {
                boolean granted = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED;
                if (granted) {
                    obj.put("status", "granted");
                } else {
                    boolean previouslyRequested = hasBeenRequested(name);
                    boolean shouldShowRationale = (getActivity() != null) &&
                        ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), Manifest.permission.READ_CONTACTS);

                    if (!previouslyRequested) {
                        obj.put("status", "prompt");
                    } else if (shouldShowRationale) {
                        obj.put("status", "denied");
                    } else {
                        obj.put("status", "permanently_denied");
                    }
                }
                break;
            }

            default:
                obj.put("status", "unknown");
                break;
        }

        return obj;
    }

    private boolean hasBeenRequested(String name) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getBoolean(KEY_PREFIX_REQUESTED + name, false);
    }

    private void markPermissionRequested(String name) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(KEY_PREFIX_REQUESTED + name, true).apply();
    }
}
