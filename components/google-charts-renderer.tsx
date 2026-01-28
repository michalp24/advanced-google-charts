"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleChartsConfig } from "@/lib/types";

declare global {
  interface Window {
    google: any;
    googleChartsLoaded?: boolean;
    googleChartsLoading?: Promise<void>;
  }
}

interface GoogleChartsRendererProps {
  config: GoogleChartsConfig;
  className?: string;
}

/**
 * Renders a chart using Google Charts library
 */
export function GoogleChartsRenderer({ config, className = "" }: GoogleChartsRendererProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("GoogleChartsRenderer useEffect triggered", config);
    let mounted = true;
    let chart: any = null;

    const loadAndRenderChart = async () => {
      try {
        console.log("Starting chart render...");
        setError(null);
        setLoading(true);

        // Load Google Charts library
        console.log("Loading Google Charts library...");
        await loadGoogleCharts();
        console.log("Google Charts loaded successfully");

        if (!mounted) {
          console.log("Component unmounted, aborting");
          return;
        }

        // Prepare data
        const data = config.dataSource.data;
        console.log("Chart data:", data);
        
        if (!data || data.length === 0) {
          throw new Error("No data provided");
        }

        // Wait a bit to ensure Google Charts is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!mounted) {
          console.log("Component unmounted after delay, aborting");
          return;
        }

        // Clear the container
        if (chartRef.current) {
          console.log("Clearing chart container");
          chartRef.current.innerHTML = '';
        }

        // Create DataTable
        console.log("Creating DataTable...");
        const dataTable = window.google.visualization.arrayToDataTable(data);
        console.log("DataTable created:", dataTable);

        // Prepare options
        const options = {
          ...config.options,
          animation: {
            startup: true,
            duration: config.animate.durationMs,
            easing: 'out',
          },
        };
        console.log("Chart options:", options);

        // Render chart
        if (chartRef.current && mounted) {
          console.log("Getting chart class for:", config.chartType);
          const ChartClass = window.google.visualization[config.chartType];
          if (!ChartClass) {
            throw new Error(`Unknown chart type: ${config.chartType}`);
          }

          console.log("Creating chart instance...");
          chart = new ChartClass(chartRef.current);
          console.log("Drawing chart...");
          chart.draw(dataTable, options);
          console.log("Chart drawn successfully!");
        }

        if (mounted) {
          console.log("Setting loading to false");
          setLoading(false);
        }
      } catch (err) {
        console.error("Chart rendering error:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to render chart");
          setLoading(false);
        }
      }
    };

    loadAndRenderChart();

    return () => {
      console.log("GoogleChartsRenderer cleanup");
      mounted = false;
      // Clear chart on unmount
      if (chart && chart.clearChart) {
        try {
          chart.clearChart();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [config]);

  console.log("Rendering GoogleChartsRenderer - loading:", loading, "error:", error);

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 border border-red-500/50 rounded-lg bg-red-500/10 ${className}`}>
        <div className="text-center">
          <p className="text-red-400 font-medium">Chart Error</p>
          <p className="text-sm text-gray-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-nvidia-green border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-400 mt-2">Loading chart...</p>
          <p className="text-xs text-gray-500 mt-1">(Check console for details)</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={className}
      style={{
        borderRadius: `${config.frame.radiusPx}px`,
        border: config.frame.borderWidth > 0 
          ? `${config.frame.borderWidth}px solid ${config.frame.borderColor}` 
          : 'none',
      }}
    >
      <div ref={chartRef} />
    </div>
  );
}

/**
 * Load Google Charts library (singleton pattern to prevent duplicate loads)
 */
function loadGoogleCharts(): Promise<void> {
  console.log("loadGoogleCharts called");
  
  // If already loaded, return immediately
  if (window.google && window.googleChartsLoaded) {
    console.log("Google Charts already loaded");
    return Promise.resolve();
  }

  // If currently loading, return the existing promise
  if (window.googleChartsLoading) {
    console.log("Google Charts currently loading, returning existing promise");
    return window.googleChartsLoading;
  }

  console.log("Starting new Google Charts load");
  
  // Start new load
  const loadPromise = new Promise<void>((resolve, reject) => {
    // Double check in case it loaded while we were setting up
    if (window.google && window.googleChartsLoaded) {
      console.log("Google Charts loaded during setup");
      resolve();
      return;
    }

    // Check if script is already in the document
    const existingScript = document.getElementById('google-charts-script');
    if (existingScript) {
      console.log("Script tag exists, waiting for load...");
      // Wait for existing script to load
      const checkInterval = setInterval(() => {
        if (window.google && window.googleChartsLoaded) {
          console.log("Existing script finished loading");
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        console.error("Google Charts loading timeout");
        reject(new Error('Google Charts loading timeout'));
      }, 10000);
      
      return;
    }

    console.log("Creating new script tag");
    
    // Load the script
    const script = document.createElement('script');
    script.id = 'google-charts-script';
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.async = true;

    script.onload = () => {
      console.log("Google Charts loader script loaded");
      // Only call load() once
      if (!window.googleChartsLoaded) {
        console.log("Calling google.charts.load()...");
        window.google.charts.load('current', { 
          packages: ['corechart', 'table'],
          callback: () => {
            console.log("Google Charts packages loaded!");
            window.googleChartsLoaded = true;
            window.googleChartsLoading = undefined;
            resolve();
          }
        });
      } else {
        console.log("Already marked as loaded");
        resolve();
      }
    };

    script.onerror = () => {
      console.error("Failed to load Google Charts script");
      window.googleChartsLoading = undefined;
      reject(new Error('Failed to load Google Charts library'));
    };

    document.head.appendChild(script);
    console.log("Script tag appended to head");
  });

  // Store the promise so other instances can reuse it
  window.googleChartsLoading = loadPromise;
  
  return loadPromise;
}
