"use client";

import { useState, useEffect } from "react";
import { Copy, Check, AlertCircle, ExternalLink, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChartPreview } from "@/components/chart-preview";
import { parseIframeInput } from "@/lib/parser";
import { GoogleEmbedConfig, AnimationPreset } from "@/lib/types";
import { generateEmbedSnippet } from "@/lib/snippet-generator";
import { encodeConfigClient } from "@/lib/encoding";

export default function Home() {
  const [iframeInput, setIframeInput] = useState("");
  const [config, setConfig] = useState<GoogleEmbedConfig | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [generatedSnippet, setGeneratedSnippet] = useState("");
  const [copied, setCopied] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");

  // Advanced options state
  const [animationPreset, setAnimationPreset] = useState<AnimationPreset>("fade-up");
  const [borderRadius, setBorderRadius] = useState(0);
  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState("#76B900");
  const [previewKey, setPreviewKey] = useState(0);
  const [googleSheetLink, setGoogleSheetLink] = useState("");
  const [showDataInput, setShowDataInput] = useState(false);

  // Parse iframe input whenever it changes
  useEffect(() => {
    if (!iframeInput.trim()) {
      setConfig(null);
      setWarnings([]);
      setErrors([]);
      setGeneratedSnippet("");
      setEmbedUrl("");
      return;
    }

    const result = parseIframeInput(iframeInput);
    setWarnings(result.warnings);
    setErrors(result.errors);

    if (result.success && result.config) {
      const fullConfig: GoogleEmbedConfig = {
        ...result.config,
        mode: "google-embed",
        animate: {
          preset: animationPreset,
          durationMs: 600,
        },
        frame: {
          radiusPx: borderRadius,
          borderWidth: borderWidth,
          borderColor: borderColor,
        },
      } as GoogleEmbedConfig;

      setConfig(fullConfig);
    } else {
      setConfig(null);
      setGeneratedSnippet("");
      setEmbedUrl("");
    }
  }, [iframeInput, animationPreset, borderRadius, borderWidth, borderColor]);

  // Generate snippet when config changes
  useEffect(() => {
    if (config) {
      const snippet = generateEmbedSnippet(config);
      setGeneratedSnippet(snippet);

      // Generate embed URL
      try {
        const encoded = encodeConfigClient(config);
        const url = `${window.location.origin}/embed?c=${encoded}`;
        setEmbedUrl(url);
      } catch (e) {
        console.error("Failed to encode config:", e);
      }
      
      // Trigger animation replay
      setPreviewKey(prev => prev + 1);
    }
  }, [config]);

  const handleCopy = async () => {
    if (generatedSnippet) {
      await navigator.clipboard.writeText(generatedSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setIframeInput("");
    setAnimationPreset("fade-up");
    setBorderRadius(0);
    setBorderWidth(0);
    setBorderColor("#76B900");
  };

  const exampleIframe = `<iframe width="600" height="371" seamless frameborder="0" scrolling="no" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQexample/pubchart?oid=123456789&format=interactive"></iframe>`;

  return (
    <div className="min-h-screen bg-nvidia-black">
      {/* Header */}
      <header className="border-b border-nvidia-gray-light bg-nvidia-gray-dark/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1"></div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-nvidia-green flex-shrink-0" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Advanced Google Charts
                </h1>
              </div>
              <div>
                <p className="text-sm text-gray-400">
                  Create responsive & animated embeds for your Google Sheets charts
                </p>
              </div>
            </div>
            <div className="flex-1 flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <HelpCircle className="h-4 w-4" />
                    How It Works
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>How It Works</DialogTitle>
                    <DialogDescription>
                      Learn how Advanced Google Charts makes your charts responsive and animated
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm text-gray-300 mt-4">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-nvidia-green mt-2 flex-shrink-0"></div>
                      <p>
                        <strong className="text-white">Responsive:</strong> The chart scales to fit any container width while maintaining aspect ratio.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-nvidia-green mt-2 flex-shrink-0"></div>
                      <p>
                        <strong className="text-white">Animated:</strong> Charts fade/slide into view when they enter the viewport (respects prefers-reduced-motion).
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-nvidia-green mt-2 flex-shrink-0"></div>
                      <p>
                        <strong className="text-white">Universal:</strong> Works on Webflow, WordPress, or any HTML site. No dependencies required.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-nvidia-green mt-2 flex-shrink-0"></div>
                      <p>
                        <strong className="text-white">Limitation:</strong> The chart is scaled via CSS transform. The internal chart styling cannot be changed (cross-origin iframe).
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!iframeInput && !googleSheetLink && !showDataInput ? (
          // Initial State: Both options side by side
          <div className="flex justify-center pt-8">
            <div className="w-full max-w-6xl">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold text-white">Making Charts Responsive</h2>
                <p className="text-gray-400">Choose your starting point</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Option 1: Paste Embed Code */}
                <Card>
                  <CardHeader>
                    <CardTitle>Paste Your Chart Embed Code</CardTitle>
                    <CardDescription>
                      Make existing Google Sheets charts responsive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="iframe-input">Iframe Code or URL</Label>
                      <Textarea
                        id="iframe-input"
                        placeholder={exampleIframe}
                        value={iframeInput}
                        onChange={(e) => setIframeInput(e.target.value)}
                        className="mt-2 font-mono text-sm min-h-[200px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Option 2: Create with Google Charts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Create with Google Charts</CardTitle>
                    <CardDescription>
                      Build interactive charts from your data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="sheet-link">Google Sheet Link</Label>
                      <Input
                        id="sheet-link"
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        value={googleSheetLink}
                        onChange={(e) => setGoogleSheetLink(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-nvidia-gray-light" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-nvidia-gray-dark px-2 text-gray-400">Or</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowDataInput(true)}
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Paste Data
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.csv,.xlsx,.xls';
                          input.click();
                        }}
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload File
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          // Full Interface: After paste
          <div className="space-y-6">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => {
                setIframeInput("");
                setGoogleSheetLink("");
                setShowDataInput(false);
              }}
              className="gap-2"
            >
              ← Back to Start
            </Button>

            {/* Full Width Preview */}
            {config && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Preview</CardTitle>
                    <CardDescription>
                      See how your chart will look with animation
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewKey(prev => prev + 1)}
                  >
                    Replay Animation
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="bg-nvidia-gray-medium p-6 rounded-lg border border-nvidia-gray-light flex justify-center">
                    <ChartPreview config={config} key={previewKey} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Grid for Advanced Options and Embed Code */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Advanced Options */}
              <div className="space-y-6">
            {/* Advanced Options */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Options</CardTitle>
                <CardDescription>
                  Customize the appearance and animation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="animation-preset">Animation Preset</Label>
                  <Select
                    value={animationPreset}
                    onValueChange={(value) => setAnimationPreset(value as AnimationPreset)}
                  >
                    <SelectTrigger id="animation-preset">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fade-up">Fade Up</SelectItem>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="pop">Pop</SelectItem>
                      <SelectItem value="reveal">Reveal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="border-radius">
                    Border Radius: {borderRadius}px
                  </Label>
                  <Slider
                    id="border-radius"
                    min={0}
                    max={24}
                    step={1}
                    value={[borderRadius]}
                    onValueChange={(value) => setBorderRadius(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="border-width">
                    Border Width: {borderWidth}px
                  </Label>
                  <Slider
                    id="border-width"
                    min={0}
                    max={8}
                    step={1}
                    value={[borderWidth]}
                    onValueChange={(value) => setBorderWidth(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="border-color">Border Color</Label>
                  <Select
                    value={borderColor}
                    onValueChange={(value) => setBorderColor(value)}
                  >
                    <SelectTrigger id="border-color">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="#76B900">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: "#76B900" }}></div>
                          NVIDIA Green
                        </div>
                      </SelectItem>
                      <SelectItem value="#CCCCCC">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: "#CCCCCC" }}></div>
                          Light Gray
                        </div>
                      </SelectItem>
                      <SelectItem value="#313131">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border border-gray-600" style={{ backgroundColor: "#313131" }}></div>
                          Dark Gray
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" onClick={handleReset} className="w-full">
                  Reset Options
                </Button>
              </CardContent>
            </Card>
              </div>

              {/* Right: Generated Snippet */}
              <div className="space-y-6">
            {generatedSnippet && (
              <Card>
                <CardHeader>
                  <CardTitle>Embed Code</CardTitle>
                  <CardDescription>
                    Copy this code and paste it into your website
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Textarea
                      readOnly
                      value={generatedSnippet}
                      className="font-mono text-xs min-h-[200px]"
                    />
                    <Button
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>

                  {embedUrl && (
                    <div className="space-y-2">
                      <Label>Standalone Embed URL</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={embedUrl}
                          className="font-mono text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(embedUrl, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Open this URL to see the embed standalone, or use it as an iframe src
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Errors & Warnings at bottom */}
            {(errors.length > 0 || warnings.length > 0) && (
              <div className="space-y-4">
                {errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Errors</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {warnings.length > 0 && (
                  <Alert variant="warning">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Warnings</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {warnings.map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
