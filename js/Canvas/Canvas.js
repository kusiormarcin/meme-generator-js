import notify from "../notify.js";
import { exportFile } from "./CanvasExports.js";

export default class Canvas {

    workspace = null;
    context = null;
    layers = [];
    
    constructor(selectors, width = 500, height = 500) {
        // imports
        this.exportFile = exportFile.bind(this);

        this.wrapper = document.querySelector(selectors.wrapper);
        this.workspace = document.querySelector(selectors.workspace);
        this.exporter = document.querySelector(selectors.exporter);
        this.addText = document.querySelector(selectors.addText);

        this.addText.input = this.addText.querySelector('input');
        this.addText.button = this.addText.querySelector('button');

        this.context = this.workspace.getContext("2d");

        this.defaults = { height, width };

        this.canvasResizeToDefault();
        
        this.workspace.addEventListener("dragover",this.handleDragOver);
        this.workspace.addEventListener("drop", this.handleDrop);

        this.exporter.addEventListener("click", this.exportFile);

        this.addText.button.addEventListener("click", this.addTextToCanvas);
    }
    canvasResizeToDefault = () => {
        this.workspace.height = this.defaults.height;
        this.workspace.width = this.defaults.width;
    }
    setWorkspaceBackground = (file) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            // canvas resizing
            const aspectRatio = img.width / img.height;
            if(img.height < this.workspace.height) {
                this.workspace.height = img.height;
                notify("Image is smol");
            } 
            this.workspace.width = this.workspace.height * aspectRatio;

            this.backgroundImage = img;

            // img drawing
            this.context.drawImage(img, 0,0, this.workspace.width, this.workspace.height);

            URL.revokeObjectURL(file);
        }
    }
    handleDrop = (e) => {
        // init
        e.preventDefault();
        const dt = e.dataTransfer;
        const files = dt.files;
        // validation
        if(files.length != 1) {
            notify("Only one image allowed");
            return;
        }
        const file = files[0];
        if(!file.type.match('image/*')) {
            notify("Only image files are allowed");
            return;
        }
        // reset canvas
        this.canvasResizeToDefault();
        // img manipulation
        this.setWorkspaceBackground(file);
    }
    handleDragOver = (e) => {
        e.preventDefault();
        console.log("Handling dragover event");
    }
    createNewLayer = () => {
        const layerCanvas = document.createElement('canvas');

        layerCanvas.width = this.workspace.width;
        layerCanvas.height = this.workspace.height;
        layerCanvas.classList.add('canvasWorkspace');

        return layerCanvas;
    }
    getTextOffset = (localCanvas, text, fontSize, fontFamily) => {
        const localContext = localCanvas.getContext("2d");
        localContext.font = fontSize+"px "+fontFamily;

        return (localContext.measureText(text).width / 2);
    }
    createTextCentered = (localCanvas, text, fontSize, fontFamily) => {

        let textOffset = this.getTextOffset(localCanvas, text, fontSize, fontFamily);
        let x = (this.workspace.width / 2) - textOffset;
        let y = (this.workspace.height / 2);

        return this.createText(localCanvas, text, fontSize, fontFamily, x, y)
    }
    createText = (localCanvas, text, fontSize, fontFamily, x, y) => {
        this.clearCanvas(localCanvas);

        const localContext = localCanvas.getContext("2d");
        localContext.font = fontSize+"px "+fontFamily;

        let textWrapper = new Path2D();
        textWrapper.rect(x, y  - fontSize, localContext.measureText(text).width, fontSize);
        localContext.globalAlpha = 0;
        localContext.stroke(textWrapper);
        localContext.globalAlpha = 1;
        localContext.fillText(text, x, y);

        return textWrapper;
    }
    clearCanvas = (localCanvas) => {
        const localContext = localCanvas.getContext("2d");
        localContext.clearRect(0, 0, localCanvas.width, localCanvas.height);
    }
    layerMoveFunc = (e) => {
        const layerIndex = e.target.dataset.layer;
        const currentLayer = this.layers[layerIndex];
        const layerText = currentLayer.text;

        if(!currentLayer.isDragging) {
            const layerBelow = this.layers.find((element, index) => {
                return index == (layerIndex - 1);
            });
            if(layerBelow === undefined){
                return;
            }
            const newTarget = layerBelow.canvas;
            let newEvent = new MouseEvent('mousemove', {
                clientX: e.clientX,
                clientY: e.clientY
              });
            newTarget.dispatchEvent(newEvent);

            return;
        }

        let textOffset = this.getTextOffset(currentLayer.canvas, layerText.value, layerText.fontSize, layerText.fontFamily);

        let newX = e.clientX - currentLayer.canvas.offsetLeft - textOffset;
        let newY = e.clientY - currentLayer.canvas.offsetTop;

        let newWrapper = this.createText(currentLayer.canvas, layerText.value, layerText.fontSize, layerText.fontFamily, newX, newY);

        layerText.wrapper = newWrapper;


    };
    layerMousedownFunc = (e) => {
        const layerIndex = e.target.dataset.layer;
        const currentLayer = this.layers[layerIndex];
        const localContext = currentLayer.canvas.getContext("2d");

        const isClicked = localContext.isPointInPath(currentLayer.text.wrapper, e.offsetX, e.offsetY);

        if(isClicked) {
            currentLayer.isDragging = true;
        }
        else {
            const layerBelow = this.layers.find((element, index) => {
                return index == (layerIndex - 1);
            });
            if(layerBelow === undefined){
                return;
            }
            const newTarget = layerBelow.canvas;
            let newEvent = new MouseEvent('mousedown', {
                clientX: e.clientX,
                clientY: e.clientY
              });
            newTarget.dispatchEvent(newEvent);
        }
    }
    layerMouseupFunc = (e) => {
        this.layers.forEach((element) => {
            element.isDragging = false;
        });
    }
    layerMouseleaveFunc = (e) => {
        this.layers.forEach((element) => {
            element.isDragging = false;
        });
    }
    addTextToCanvas = (e) => {
        const text = this.addText.input.value;

        if(text.trim() == '') {
            notify("Cannot add empty text!");
            return;
        }

        const localCanvas = this.createNewLayer();

        const fontSize = 48;
        const fontFamily = "Impact";

        let textWrapper = this.createTextCentered(localCanvas, text, fontSize, fontFamily);

        this.wrapper.appendChild(localCanvas);

        localCanvas.addEventListener("mousedown", this.layerMousedownFunc);
        localCanvas.addEventListener("mouseup", this.layerMouseupFunc);
        localCanvas.addEventListener('mouseleave', this.layerMouseleaveFunc);
        localCanvas.addEventListener('mousemove', this.layerMoveFunc);

        localCanvas.dataset.layer = this.layers.length;

        const layer = {
            canvas: localCanvas,
            text: {
                value: text,
                fontSize: fontSize,
                fontFamily: fontFamily,
                wrapper: textWrapper
            },
            id: localCanvas.dataset.layer,
            isDragging: false
        };

        this.layers.push(layer);
    }

}