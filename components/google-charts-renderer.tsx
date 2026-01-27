"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleChartsConfig } from "@/lib/types";

declare global {
  interface Window {
    google: any;
    googleChartsLoaded?: boolean;
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
    let mounted = true;

    const loadAndRenderChart = async () => {
      try {
        setError(null);
        setLoading(true);

        // Load Google Charts library
        if (!window.google || !window.googleChartsLoaded) {
          await loadGoogleCharts();
        }

        if (!mounted) return;

        // Prepare data
        const data = config.dataSource.data;
        if (!data || data.length === 0) {
          throw new Error("No data provided");
        }

        // Create DataTable
        const dataTable = window.google.visualization.arrayToDataTable(data);

        // Prepare options
        const options = {
          ...config.options,
          animation: {
            startup: true,
            duration: config.animate.durationMs,
            easing: 'out',
          },
        };

        // Render chart
        if (chartRef.current) {
          const ChartClass = window.google.visualization[config.chartType];
          if (!ChartClass) {
            throw new Error(`Unknown chart type: ${config.chartType}`);
          }

          const chart = new ChartClass(chartRef.current);
          chart.draw(dataTable, options);
        }

        setLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to render chart");
          setLoading(false);
        }
      }
    };

    loadAndRenderChart();

    return () => {
      mounted = false;
    };
  }, [config]);

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
 * Load Google Charts library
 */
function loadGoogleCharts(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.googleChartsLoaded) {
      resolve();
      return;
    }

    // Check if script is already in the document
    if (document.getElementById('google-charts-script')) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google && window.googleChartsLoaded) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Google Charts loading timeout'));
      }, 10000);
      
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.id = 'google-charts-script';
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.async = true;

    script.onload = () => {
      window.google.charts.load('current', { packages: ['corechart', 'table'] });
      window.google.charts.setOnLoadCallback(() => {
        window.googleChartsLoaded = true;
        resolve();
      });
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Charts library'));
    };

    document.head.appendChild(script);
  });
}
