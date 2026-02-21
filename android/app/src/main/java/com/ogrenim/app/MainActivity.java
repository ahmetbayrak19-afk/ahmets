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
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.activity.OnBackPressedCallback;

import org.json.JSONObject;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

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

        checkAndRequestPermissions();

        // 1. NFC Ayarları
        nfcAdapter = NfcAdapter.getDefaultAdapter(this);
        Intent intent = new Intent(this, getClass()).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_MUTABLE : PendingIntent.FLAG_UPDATE_CURRENT;
        pendingIntent = PendingIntent.getActivity(this, 0, intent, flags);
        intentFiltersArray = new IntentFilter[]{
                new IntentFilter(NfcAdapter.ACTION_NDEF_DISCOVERED),
                new IntentFilter(NfcAdapter.ACTION_TECH_DISCOVERED),
                new IntentFilter(NfcAdapter.ACTION_TAG_DISCOVERED)
        };

        // 2. TTS (Sesli Okuma) Ayarları
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                tts.setLanguage(new Locale("tr", "TR"));
                ttsReady = true;
            }
        });

        // 3. WebView Kurulumu
        webView = new WebView(this);
        setContentView(webView);

        // Geri Tuşu Yönetimi
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        // JS Arayüzü (TTS için)
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void speak(String text) {
                if (ttsReady && text != null) {
                    tts.stop();
                    tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "AndroidTTSID");
                }
            }
        }, "AndroidTTS");

        // 4. WebChromeClient (Kamera/Mikrofon İzinleri ve Dosya Seçici)
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                List<String> grants = new ArrayList<>();
                for (String resource : request.getResources()) {
                    if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource) ||
                            PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                        grants.add(resource);
                    }
                }
                if (!grants.isEmpty()) {
                    request.grant(grants.toArray(new String[0]));
                } else {
                    request.deny();
                }
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (mUploadMessage != null) mUploadMessage.onReceiveValue(null);
                mUploadMessage = filePathCallback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("image/*");
                startActivityForResult(Intent.createChooser(intent, "Resim Seç"), FILECHOOSER_RESULTCODE);
                return true;
            }
        });

        // 5. WebViewClient (3D Model Yakalayıcı)
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();

                // URL'nin sonu /human.glb ise yakala
                if (url.endsWith("/human.glb")) {
                    try {
                        // Eğer human.glb'yi root asset'e koyduysan bu doğru:
                        InputStream is = getAssets().open("human.glb");

                        Map<String, String> headers = new HashMap<>();
                        headers.put("Access-Control-Allow-Origin", "*");
                        headers.put("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
                        headers.put("Access-Control-Allow-Headers", "*");
                        headers.put("Content-Type", "model/gltf-binary");

                        return new WebResourceResponse("model/gltf-binary", "UTF-8", 200, "OK", headers, is);
                    } catch (Exception e) {
                        e.printStackTrace();
                        return null;
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }
        });

        // ✅ KRİTİK: cap sync web'i android_asset/public içine koyar
        webView.loadUrl("file:///android_asset/public/index.html");
    }

    // İzin İsteme Fonksiyonu
    private void checkAndRequestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            String[] permissions = {Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO, Manifest.permission.NFC};
            List<String> list = new ArrayList<>();
            for (String p : permissions) {
                if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) list.add(p);
            }
            if (!list.isEmpty()) ActivityCompat.requestPermissions(this, list.toArray(new String[0]), PERMISSION_REQUEST_CODE);
        }
    }

    // Dosya Seçici Sonucu
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

    // NFC Yaşam Döngüsü
    @Override
    protected void onResume() {
        super.onResume();
        if (nfcAdapter != null) nfcAdapter.enableForegroundDispatch(this, pendingIntent, intentFiltersArray, null);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (nfcAdapter != null) nfcAdapter.disableForegroundDispatch(this);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (NfcAdapter.ACTION_NDEF_DISCOVERED.equals(intent.getAction()) ||
                NfcAdapter.ACTION_TECH_DISCOVERED.equals(intent.getAction()) ||
                NfcAdapter.ACTION_TAG_DISCOVERED.equals(intent.getAction())) {
            Tag tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
            if (tag != null) {
                String nfcId = bytesToHex(tag.getId());
                webView.evaluateJavascript("window.handleNfcScan(" + JSONObject.quote(nfcId) + ")", null);
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
        if (tts != null) { tts.stop(); tts.shutdown(); }
        super.onDestroy();
    }
                     }
