import Canvas from "./Canvas/Canvas.js";

const canvas = new Canvas({
    wrapper: '[data-workspace-wrapper]',
    workspace: '[data-workspace]',
    exporter: '[data-exporter]',
    addText: '[data-add-text]',
});

window.canvas = canvas;