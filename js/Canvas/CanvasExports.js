export function exportFile(e) {
    e.preventDefault();
    const fileUrl = this.workspace.toDataURL();

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.workspace.width;
    exportCanvas.height = this.workspace.height;
    const exportContext = exportCanvas.getContext("2d");

    const bgImg = new Image();
    bgImg.src = fileUrl;

    bgImg.onload = () => {
        exportContext.drawImage(bgImg, 0, 0, exportCanvas.width, exportCanvas.height);
    }

    let exportUrl;

    this.layers.forEach((element, index) => {
        new Promise((resolve, reject) => {
            element.loaded = false;
            const layerUrl = element.canvas.toDataURL();
            const layerImg = new Image();
            layerImg.src = layerUrl;
            layerImg.onload = () => {
                exportContext.drawImage(layerImg, 0, 0, exportCanvas.width, exportCanvas.height);
                element.loaded = true; 
                resolve({
                    canvas: exportCanvas,
                    i: index,
                    len: this.layers.length
                });
            }
        }).then((data) => {
            exportUrl = data.canvas.toDataURL();  
            if((data.len - 1) == data.i) {
                let newAnchor = document.createElement("a");
                newAnchor.setAttribute("href", exportUrl);
                newAnchor.setAttribute("download", "meme");
                newAnchor.innerHTML = "Download link";
                newAnchor.click();
            }
        });
    });
    
}