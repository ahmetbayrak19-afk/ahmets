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
    
    // 🔥 NATIVE SES DEĞİŞKENLERİ
    private TextToSpeech tts;
    private boolean ttsReady = false;

    // Dosya Seçici Değişkenleri
    private ValueCallback<Uri[]> mUploadMessage;
    public static final int FILECHOOSER_RESULTCODE = 1;
    private static final int PERMISSION_REQUEST_CODE = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. İZİNLERİ EN BAŞTA İSTİYORUZ (Garanti Yöntem)
        checkAndRequestPermissions();

        // 2. NFC AYARLARI
        nfcAdapter = NfcAdapter.getDefaultAdapter(this);
        Intent intent = new Intent(this, getClass()).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_MUTABLE;
        }
        pendingIntent = PendingIntent.getActivity(this, 0, intent, flags);
        IntentFilter ndef = new IntentFilter(NfcAdapter.ACTION_TAG_DISCOVERED);
        intentFiltersArray = new IntentFilter[] {ndef};

        // 3. NATIVE TTS BAŞLAT
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                int result = tts.setLanguage(new Locale("tr", "TR"));
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    ttsReady = false;
                } else {
                    tts.setSpeechRate(0.9f); 
                    ttsReady = true; 
                }
            } else {
                ttsReady = false;
            }
        });

        // 4. WEBVIEW AYARLARI
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);        
        settings.setDomStorageEnabled(true);        
        settings.setAllowFileAccess(true);           
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false); 

        // Javascript Köprüsü
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void speak(String text) {
                if (tts == null || !ttsReady || text == null) return;
                tts.stop();
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "AndroidTTSID");
            }

            @JavascriptInterface
            public void stop() {
                if (tts != null) tts.stop();
            }
        }, "AndroidTTS"); 

        // 5. WEBCHROMECLIENT (GALERİ VE KAMERA)
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                for (String r : request.getResources()) {
                    if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r) ||
                        PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) {
                        request.grant(request.getResources());
                        return;
                    }
                }
                request.deny();
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (mUploadMessage != null) {
                    mUploadMessage.onReceiveValue(null);
                }
                mUploadMessage = filePathCallback;

                // ESKİ VE SAĞLAM YÖNTEM
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("image/*"); 
                
                try {
                    startActivityForResult(Intent.createChooser(intent, "Resim Seçiniz"), FILECHOOSER_RESULTCODE);
                } catch (Exception e) {
                    mUploadMessage = null;
                    return false;
                }
                return true;
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false; 
            }
        });
        
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        super.onDestroy();
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (mUploadMessage == null) return;
            Uri result = data == null || resultCode != RESULT_OK ? null : data.getData();
            if (result != null) {
                mUploadMessage.onReceiveValue(new Uri[]{result});
            } else {
                mUploadMessage.onReceiveValue(null);
            }
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
        if (NfcAdapter.ACTION_TAG_DISCOVERED.equals(intent.getAction()) || 
            NfcAdapter.ACTION_NDEF_DISCOVERED.equals(intent.getAction()) ||
            NfcAdapter.ACTION_TECH_DISCOVERED.equals(intent.getAction())) {
            
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
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
        }
        return sb.toString();
    }

    // 🔥 BURADA HEPSİNİ İSTİYORUZ Kİ "GARANTİ" OLSUN 🔥
    private void checkAndRequestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            List<String> permissions = new ArrayList<>();
            permissions.add(Manifest.permission.CAMERA);
            permissions.add(Manifest.permission.RECORD_AUDIO);
            permissions.add(Manifest.permission.MODIFY_AUDIO_SETTINGS);
            permissions.add(Manifest.permission.VIBRATE);
            permissions.add(Manifest.permission.NFC);

            // Android 13+ (Yeni)
            if (Build.VERSION.SDK_INT >= 33) { 
                permissions.add(Manifest.permission.READ_MEDIA_IMAGES);
            } else {
                // Eski Androidler
                permissions.add(Manifest.permission.READ_EXTERNAL_STORAGE);
            }

            List<String> permissionsToRequest = new ArrayList<>();
            for (String permission : permissions) {
                if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                    permissionsToRequest.add(permission);
                }
            }

            if (!permissionsToRequest.isEmpty()) {
                ActivityCompat.requestPermissions(this, permissionsToRequest.toArray(new String[0]), PERMISSION_REQUEST_CODE);
            }
        }
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
