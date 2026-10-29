package com.kaniyan.app;

import android.app.Activity;
import android.content.pm.ApplicationInfo;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import android.content.Intent;
import android.net.Uri;
import android.webkit.ValueCallback;


import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Locale;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private WebView web;
    private ValueCallback<Uri[]> chooser;
    private final List<WebView> printing = new ArrayList<>();   // keep print WebViews alive until done

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) WebView.setWebContentsDebuggingEnabled(true);   // debug builds only
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", this::decryptedAsset).build();
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return loader.shouldInterceptRequest(r.getUrl());
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (chooser != null) chooser.onReceiveValue(null);
                chooser = cb;
                try { startActivityForResult(p.createIntent(), 7); } catch (Exception e) { chooser = null; return false; }
                return true;
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage m) {
                Log.d("JathagamJS", m.message() + " (" + m.sourceId() + ":" + m.lineNumber() + ")");
                return true;
            }
        });
        web.addJavascriptInterface(new Bridge(), "Android");
        web.loadUrl("https://appassets.androidplatform.net/assets/www/index.html");
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == 7 && chooser != null) {
            chooser.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data));
            chooser = null;
        } else super.onActivityResult(req, res, data);
    }

    /** Serves assets/<path>, which tools/protect.mjs stored as IV | ciphertext | tag. */
    private WebResourceResponse decryptedAsset(String path) {
        try (InputStream in = getAssets().open(path)) {
            java.io.ByteArrayOutputStream buf = new java.io.ByteArrayOutputStream(in.available());
            byte[] chunk = new byte[16384];
            for (int n; (n = in.read(chunk)) > 0; ) buf.write(chunk, 0, n);
            byte[] raw = buf.toByteArray();
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, new SecretKeySpec(K.get(), "AES"), new GCMParameterSpec(128, raw, 0, 12));
            byte[] plain = c.doFinal(raw, 12, raw.length - 12);
            return new WebResourceResponse(mime(path), "utf-8", new ByteArrayInputStream(plain));
        } catch (Exception e) {
            return null;
        }
    }

    private static String mime(String p) {
        p = p.toLowerCase(Locale.ROOT);
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".wasm")) return "application/wasm";
        if (p.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }

    @Override
    public void onBackPressed() { moveTaskToBack(true); }

    class Bridge {
        /** Opens Android's print sheet for the report; the user picks "Save as PDF". */
        @JavascriptInterface
        public void printHtml(final String html, final String job, final String paper) {
            runOnUiThread(() -> {
                final WebView w = new WebView(MainActivity.this);
                printing.add(w);
                w.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView v, String url) {
                        PrintManager pm = (PrintManager) getSystemService(PRINT_SERVICE);
                        PrintDocumentAdapter a = v.createPrintDocumentAdapter(job);
                        pm.print(job, a, new PrintAttributes.Builder()
                                .setMediaSize("Letter".equals(paper) ? PrintAttributes.MediaSize.NA_LETTER : PrintAttributes.MediaSize.ISO_A4).build());
                    }
                });
                w.loadDataWithBaseURL("https://appassets.androidplatform.net/", html, "text/html", "utf-8", null);
            });
        }
    }
}
