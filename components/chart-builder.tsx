"use client";

import { useState } from "react";
import { GoogleChartType, GoogleChartsConfig, AnimationPreset } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface ChartBuilderProps {
  data: string[][];
  onConfigChange: (config: Partial<GoogleChartsConfig>) => void;
  initialConfig?: Partial<GoogleChartsConfig>;
}

const chartTypes: { value: GoogleChartType; label: string; description: string }[] = [
  { value: "ColumnChart", label: "Column Chart", description: "Vertical bars" },
  { value: "BarChart", label: "Bar Chart", description: "Horizontal bars" },
  { value: "LineChart", label: "Line Chart", description: "Connected points" },
  { value: "AreaChart", label: "Area Chart", description: "Filled line chart" },
  { value: "PieChart", label: "Pie Chart", description: "Circular segments" },
  { value: "ScatterChart", label: "Scatter Chart", description: "Point plot" },
  { value: "Table", label: "Table", description: "Data table" },
  { value: "ComboChart", label: "Combo Chart", description: "Mixed chart types" },
];

const colorPalettes = {
  nvidia: ["#76B900", "#000000", "#1a1a1a", "#2a2a2a"],
  material: ["#3366CC", "#DC3912", "#FF9900", "#109618", "#990099"],
  pastel: ["#B4D7A8", "#A4C2F4", "#F4CCCC", "#FCE5CD", "#D9D2E9"],
  vibrant: ["#E91E63", "#9C27B0", "#3F51B5", "#00BCD4", "#4CAF50"],
};

export function ChartBuilder({ data, onConfigChange, initialConfig }: ChartBuilderProps) {
  const [chartType, setChartType] = useState<GoogleChartType>(
    initialConfig?.chartType || "ColumnChart"
  );
  const [title, setTitle] = useState(initialConfig?.options?.title || "");
  const [colorPalette, setColorPalette] = useState<keyof typeof colorPalettes>("nvidia");
  const [legendPosition, setLegendPosition] = useState<"bottom" | "top" | "left" | "right" | "none">(
    (initialConfig?.options?.legend?.position as "bottom" | "top" | "left" | "right" | "none") || "bottom"
  );
  const [animationPreset, setAnimationPreset] = useState<AnimationPreset>(
    initialConfig?.animate?.preset || "fade-up"
  );
  const [borderRadius, setBorderRadius] = useState(
    initialConfig?.frame?.radiusPx || 0
  );
  const [borderWidth, setBorderWidth] = useState(
    initialConfig?.frame?.borderWidth || 0
  );
  const [borderColor, setBorderColor] = useState(
    initialConfig?.frame?.borderColor || "#76B900"
  );

  const updateConfig = (updates: Partial<GoogleChartsConfig>) => {
    const config: Partial<GoogleChartsConfig> = {
      mode: "google-charts",
      chartType,
      dataSource: {
        type: "manual",
        data,
      },
      animate: {
        preset: animationPreset,
        durationMs: 600,
      },
      options: {
        title,
        width: 800,
        height: 500,
        colors: colorPalettes[colorPalette],
        legend: {
          position: legendPosition as any,
        },
        chartArea: {
          width: "80%",
          height: "70%",
        },
      },
      frame: {
        radiusPx: borderRadius,
        borderWidth,
        borderColor,
      },
      ...updates,
    };

    onConfigChange(config);
  };

  const handleChartTypeChange = (value: string) => {
    const newType = value as GoogleChartType;
    setChartType(newType);
    updateConfig({ chartType: newType });
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    updateConfig({ options: { ...initialConfig?.options, title: value } });
  };

  const handleColorPaletteChange = (value: string) => {
    const palette = value as keyof typeof colorPalettes;
    setColorPalette(palette);
    updateConfig({
      options: {
        ...initialConfig?.options,
        colors: colorPalettes[palette],
      },
    });
  };

  const handleLegendPositionChange = (value: string) => {
    const position = value as "bottom" | "top" | "left" | "right" | "none";
    setLegendPosition(position);
    updateConfig({
      options: {
        ...initialConfig?.options,
        legend: { position },
      },
    });
  };

  const handleAnimationChange = (value: string) => {
    const preset = value as AnimationPreset;
    setAnimationPreset(preset);
    updateConfig({
      animate: {
        preset,
        durationMs: 600,
      },
    });
  };

  const handleBorderRadiusChange = (value: number[]) => {
    setBorderRadius(value[0]);
    updateConfig({
      frame: {
        radiusPx: value[0],
        borderWidth,
        borderColor,
      },
    });
  };

  const handleBorderWidthChange = (value: number[]) => {
    setBorderWidth(value[0]);
    updateConfig({
      frame: {
        radiusPx: borderRadius,
        borderWidth: value[0],
        borderColor,
      },
    });
  };

  const handleBorderColorChange = (value: string) => {
    setBorderColor(value);
    updateConfig({
      frame: {
        radiusPx: borderRadius,
        borderWidth,
        borderColor: value,
      },
    });
  };

  // Initial config emission
  useState(() => {
    updateConfig({});
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chart Type</CardTitle>
          <CardDescription>Choose how to visualize your data</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={chartType} onValueChange={handleChartTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chartTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-gray-400">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chart Options</CardTitle>
          <CardDescription>Customize your chart appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="chart-title">Chart Title</Label>
            <Input
              id="chart-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter chart title (optional)"
              className="mt-2"
            />
          </div>

          <div>
            <Label>Color Palette</Label>
            <Select value={colorPalette} onValueChange={handleColorPaletteChange}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nvidia">NVIDIA</SelectItem>
                <SelectItem value="material">Material</SelectItem>
                <SelectItem value="pastel">Pastel</SelectItem>
                <SelectItem value="vibrant">Vibrant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Legend Position</Label>
            <Select value={legendPosition} onValueChange={handleLegendPositionChange}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom">Bottom</SelectItem>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Animation & Styling</CardTitle>
          <CardDescription>Add animations and borders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Animation Preset</Label>
            <Select value={animationPreset} onValueChange={handleAnimationChange}>
              <SelectTrigger className="mt-2">
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

          <div>
            <Label>Border Radius: {borderRadius}px</Label>
            <Slider
              value={[borderRadius]}
              onValueChange={handleBorderRadiusChange}
              max={24}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Border Width: {borderWidth}px</Label>
            <Slider
              value={[borderWidth]}
              onValueChange={handleBorderWidthChange}
              max={8}
              step={1}
              className="mt-2"
            />
          </div>

          {borderWidth > 0 && (
            <div>
              <Label>Border Color</Label>
              <Select value={borderColor} onValueChange={handleBorderColorChange}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="#CCCCCC">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border" style={{ backgroundColor: "#CCCCCC" }} />
                      Light Gray
                    </div>
                  </SelectItem>
                  <SelectItem value="#313131">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border" style={{ backgroundColor: "#313131" }} />
                      Dark Gray
                    </div>
                  </SelectItem>
                  <SelectItem value="#76B900">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border" style={{ backgroundColor: "#76B900" }} />
                      NVIDIA Green
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
