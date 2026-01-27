"use client";

import { useState, useEffect } from "react";
import { Copy, Check, AlertCircle, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  const [backgroundColor, setBackgroundColor] = useState("");

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
          backgroundColor: backgroundColor || undefined,
        },
      } as GoogleEmbedConfig;

      setConfig(fullConfig);
    } else {
      setConfig(null);
      setGeneratedSnippet("");
      setEmbedUrl("");
    }
  }, [iframeInput, animationPreset, borderRadius, backgroundColor]);

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
    setBackgroundColor("");
  };

  const exampleIframe = `<iframe width="600" height="371" seamless frameborder="0" scrolling="no" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQexample/pubchart?oid=123456789&format=interactive"></iframe>`;

  return (
    <div className="min-h-screen bg-nvidia-black">
      {/* Header */}
      <header className="border-b border-nvidia-gray-light bg-nvidia-gray-dark/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-nvidia-green" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Advanced Google Charts
              </h1>
              <p className="text-sm text-gray-400">
                Create responsive & animated embeds for your Google Sheets charts
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Panel: Input & Options */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paste Your Chart Embed Code</CardTitle>
                <CardDescription>
                  Copy the iframe code from your published Google Sheets chart, or just paste the URL
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
                    className="mt-2 font-mono text-sm min-h-[120px]"
                  />
                </div>

                {/* Errors & Warnings */}
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
              </CardContent>
            </Card>

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
                  <Label htmlFor="bg-color">Background Color (optional)</Label>
                  <Input
                    id="bg-color"
                    type="text"
                    placeholder="#ffffff or transparent"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                  />
                </div>

                <Button variant="outline" onClick={handleReset} className="w-full">
                  Reset Options
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Preview & Output */}
          <div className="space-y-6">
            {/* Preview */}
            {config && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    See how your chart will look (scroll to see animation)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-nvidia-gray-medium p-6 rounded-lg border border-nvidia-gray-light">
                    <ChartPreview config={config} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generated Snippet */}
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
          </div>
        </div>

        {/* Footer Info */}
        <Card className="mt-8 nvidia-gradient border-nvidia-gray-light nvidia-glow-hover transition-all">
          <CardHeader>
            <CardTitle className="text-nvidia-green">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-300">
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
