/// <reference types="vite/client" />
declare module 'plotly.js-dist-min';
declare module 'react-plotly.js/factory' {
  export default function createPlotlyComponent(plotly: any): any;
}

declare module 'react-plotly.js' {
  import { Component } from 'react';
  import { Layout, Data, Config, PlotlyHTMLElement } from 'plotly.js';

  interface PlotParams {
    data: Data[];
    layout: Partial<Layout>;
    config?: Partial<Config>;
    frames?: any[];
    onInitialized?: (figure: any, graphDiv: HTMLElement) => void;
    onUpdate?: (figure: any, graphDiv: HTMLElement) => void;
    onPurge?: (figure: any, graphDiv: HTMLElement) => void;
    onError?: (err: any) => void;
    style?: React.CSSProperties;
    className?: string;
    useResizeHandler?: boolean;
    debug?: boolean;
  }

  export default class Plot extends Component<PlotParams> {}
}
