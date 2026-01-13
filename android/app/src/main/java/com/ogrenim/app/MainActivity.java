package com.ogrencitakip;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        
        // 🚀 APK İÇİN HAYATİ AYARLAR
        settings.setJavaScriptEnabled(true);        
        settings.setDomStorageEnabled(true);       
        settings.setAllowFileAccess(true);          
        settings.setAllowContentAccess(true);       
        
        // 🔥 BEYAZ EKRANI BİTİREN ASIL AYARLAR BURASI 🔥
        // Yerel dosyaların (JS/CSS) birbirini okumasına izin verir
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        // Sayfa içi yönlendirmeleri webview içinde tut
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false; 
            }
        });
        
        // GitHub Actions'ın oluşturduğu web klasörünü yükle
        webView.loadUrl("file:///android_asset/index.html");
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
