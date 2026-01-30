package com.ogrenim.app;

import android.Manifest;
import android.app.PendingIntent;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MainActivity extends AppCompatActivity {

    private WebView webView;

    private NfcAdapter nfcAdapter;
    private PendingIntent pendingIntent;
    private IntentFilter[] intentFiltersArray;

    private TextToSpeech tts;
    private boolean ttsReady = false;

    private ValueCallback<Uri[]> mUploadMessage;

    private static final int FILECHOOSER_RESULTCODE = 1;
    private static final int PERMISSION_REQUEST_CODE = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1) İzinler (sadece donanım)
        checkAndRequestPermissions();

        // 2) NFC - Foreground dispatch
        nfcAdapter = NfcAdapter.getDefaultAdapter(this);
        Intent nfcIntent = new Intent(this, getClass()).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            piFlags |= PendingIntent.FLAG_MUTABLE;
        }
        pendingIntent = PendingIntent.getActivity(this, 0, nfcIntent, piFlags);

        // Foreground dispatch'te en stabil: TAG + TECH
        intentFiltersArray = new IntentFilter[] {
                new IntentFilter(NfcAdapter.ACTION_TAG_DISCOVERED),
                new IntentFilter(NfcAdapter.ACTION_TECH_DISCOVERED)
        };

        // 3) Native TTS
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                int lang = tts.setLanguage(new Locale("tr", "TR"));
                if (lang != TextToSpeech.LANG_MISSING_DATA && lang != TextToSpeech.LANG_NOT_SUPPORTED) {
                    tts.setSpeechRate(0.9f);
                    ttsReady = true;
                } else {
                    ttsReady = false;
                }
            } else {
                ttsReady = false;
            }
        });

        // 4) WebView
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);

        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        // Ses için gesture istemesin
        settings.setMediaPlaybackRequiresUserGesture(false);

        // JS -> Native köprü (TTS)
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void speak(String text) {
                if (tts == null || !ttsReady || text == null) return;
                tts.stop();
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "AndroidTTSID");
            }

            @JavascriptInterface
            public void stop() {
                if (tts == null) return;
                tts.stop();
            }
        }, "AndroidTTS");

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                // Sadece kamera/mikrofon taleplerini ver, diğerlerini reddet
                List<String> grants = new ArrayList<>();
                for (String r : request.getResources()) {
                    if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r) ||
                            PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) {
                        grants.add(r);
                    }
                }
                if (!grants.isEmpty()) {
                    request.grant(grants.toArray(new String[0]));
                } else {
                    request.deny();
                }
            }

            @Override
            public boolean onShowFileChooser(WebView view,
                                             ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                if (mUploadMessage != null) {
                    mUploadMessage.onReceiveValue(null);
                }
                mUploadMessage = filePathCallback;

                // Galeri izni istemeyen sistem seçici
                Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
                pick.addCategory(Intent.CATEGORY_OPENABLE);
                pick.setType("image/*");

                try {
                    startActivityForResult(Intent.createChooser(pick, "Resim Seç"), FILECHOOSER_RESULTCODE);
                    return true;
                } catch (Exception e) {
                    mUploadMessage = null;
                    return false;
                }
            }
        });

        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/index.html");
    }

    private void checkAndRequestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // Kamera gerçekten kullanılıyorsa kalsın. Sadece galeriden seçiyorsan CAMERA'yı kaldırabilirsin.
            String[] permissions = new String[] {
                    Manifest.permission.CAMERA,
                    Manifest.permission.RECORD_AUDIO,
                    Manifest.permission.NFC
            };

            List<String> toRequest = new ArrayList<>();
            for (String p : permissions) {
                if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                    toRequest.add(p);
                }
            }

            if (!toRequest.isEmpty()) {
                ActivityCompat.requestPermissions(this, toRequest.toArray(new String[0]), PERMISSION_REQUEST_CODE);
            }
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (mUploadMessage == null) return;

            Uri result = (data == null || resultCode != RESULT_OK) ? null : data.getData();
            mUploadMessage.onReceiveValue(result != null ? new Uri[]{result} : null);
            mUploadMessage = null;
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (nfcAdapter != null) {
            nfcAdapter.enableForegroundDispatch(this, pendingIntent, intentFiltersArray, null);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (nfcAdapter != null) {
            nfcAdapter.disableForegroundDispatch(this);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);

        String action = intent.getAction();
        if (NfcAdapter.ACTION_TAG_DISCOVERED.equals(action) ||
                NfcAdapter.ACTION_NDEF_DISCOVERED.equals(action) ||
                NfcAdapter.ACTION_TECH_DISCOVERED.equals(action)) {

            Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
            if (tag != null) {
                String nfcId = bytesToHex(tag.getId());
                String safeJs = "window.handleNfcScan(" + JSONObject.quote(nfcId) + ")";
                webView.evaluateJavascript(safeJs, null);
            }
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02X", b));
        return sb.toString();
    }

    @Override
    protected void onDestroy() {
        try {
            if (tts != null) {
                tts.stop();
                tts.shutdown();
            }
        } catch (Exception ignored) {}
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
