const imageInput =
    document.getElementById("imageInput");

const kernelSelect =
    document.getElementById("kernelSelect");

const originalCanvas =
    document.getElementById("originalCanvas");

const outputCanvas =
    document.getElementById("outputCanvas");

const gridCanvas =
    document.getElementById("gridCanvas");

const kernelDisplay =
    document.getElementById("kernelDisplay");

const pixelRegion =
    document.getElementById("pixelRegion");

const calculation =
    document.getElementById("calculation");

const result =
    document.getElementById("result");

const fullPixelValues =
    document.getElementById("fullPixelValues");


const originalCtx =
    originalCanvas.getContext("2d");

const outputCtx =
    outputCanvas.getContext("2d");

const gridCtx =
    gridCanvas.getContext("2d");


// ===============================
// KERNELS
// ===============================

const kernels = {

    blur: [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
    ],

    sharpen: [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ],

    sobelX: [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]
    ],

    sobelY: [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1]
    ],

    prewittX: [
        [-1, 0, 1],
        [-1, 0, 1],
        [-1, 0, 1]
    ],

    prewittY: [
        [-1, -1, -1],
        [0, 0, 0],
        [1, 1, 1]
    ]

};
// VARIABLES
let originalImageData = null;
// SHOW KERNEL
function displayKernel() {

    const kernel =
        kernels[kernelSelect.value];

    let html =
        '<table class="kernel-table">';

    for (let row of kernel) {

        html += "<tr>";

        for (let value of row) {

            html += `<td>${value}</td>`;

        }

        html += "</tr>";
    }

    html += "</table>";

    kernelDisplay.innerHTML = html;
}
// IMAGE UPLOAD
imageInput.addEventListener(
    "change",
    function () {

        const file =
            imageInput.files[0];

        if (!file) {
            return;
        }

        const image =
            new Image();

        image.onload = function () {

            // Limit very large images
            const maxWidth = 600;

            let width =
                image.width;

            let height =
                image.height;

            if (width > maxWidth) {

                const scale =
                    maxWidth / width;

                width =
                    Math.round(width * scale);

                height =
                    Math.round(height * scale);
            }


            // Canvas size

            originalCanvas.width =
                width;

            originalCanvas.height =
                height;

            outputCanvas.width =
                width;

            outputCanvas.height =
                height;

            gridCanvas.width =
                width;

            gridCanvas.height =
                height;


            // Draw original image

            originalCtx.drawImage(
                image,
                0,
                0,
                width,
                height
            );


            // Get image pixels

            originalImageData =
                originalCtx.getImageData(
                    0,
                    0,
                    width,
                    height
                );


            // Clear grid

            gridCtx.clearRect(
                0,
                0,
                width,
                height
            );


            // Apply selected kernel

            applyKernel();


            // Show complete pixel values

            displayFullPixelValues();


            // Reset calculation

            pixelRegion.innerHTML =
                "Click on the original image.";

            calculation.innerHTML =
                "";

            result.innerHTML =
                "";

        };


        image.src =
            URL.createObjectURL(file);

    }
);
// APPLY KERNEL
function applyKernel() {

    if (!originalImageData) {
        return;
    }

    const kernel =
        kernels[kernelSelect.value];

    const width =
        originalCanvas.width;

    const height =
        originalCanvas.height;

    const input =
        originalImageData.data;

    const output =
        outputCtx.createImageData(
            width,
            height
        );

    for (
        let y = 1;
        y < height - 1;
        y++
    ) {

        for (
            let x = 1;
            x < width - 1;
            x++
        ) {

            let sum = 0;

            for (
                let ky = -1;
                ky <= 1;
                ky++
            ) {

                for (
                    let kx = -1;
                    kx <= 1;
                    kx++
                ) {

                    const pixelX =
                        x + kx;

                    const pixelY =
                        y + ky;

                    const index =
                        (pixelY * width + pixelX) * 4;

                    const r =
                        input[index];

                    const g =
                        input[index + 1];

                    const b =
                        input[index + 2];

                    const gray =
                        Math.round(
                            0.299 * r +
                            0.587 * g +
                            0.114 * b
                        );

                    sum +=
                        gray *
                        kernel[ky + 1][kx + 1];
                }
            }


            // Normalize blur

            if (
                kernelSelect.value === "blur"
            ) {

                sum =
                    Math.round(sum / 9);

            }


            // Keep value between 0 and 255

            sum =
                Math.max(
                    0,
                    Math.min(255, sum)
                );


            const outputIndex =
                (y * width + x) * 4;

            output.data[outputIndex] =
                sum;

            output.data[outputIndex + 1] =
                sum;

            output.data[outputIndex + 2] =
                sum;

            output.data[outputIndex + 3] =
                255;

        }
    }


    outputCtx.putImageData(
        output,
        0,
        0
    );
}
// METHOD CHANGE
kernelSelect.addEventListener(
    "change",
    function () {

        displayKernel();

        applyKernel();

        calculation.innerHTML =
            "";

        result.innerHTML =
            "";

    }
);
// CLICK ORIGINAL IMAGE
originalCanvas.addEventListener(
    "click",
    function (event) {

        if (!originalImageData) {
            return;
        }


        const rect =
            originalCanvas.getBoundingClientRect();


        const scaleX =
            originalCanvas.width /
            rect.width;


        const scaleY =
            originalCanvas.height /
            rect.height;


        const x =
            Math.floor(
                (event.clientX - rect.left)
                * scaleX
            );


        const y =
            Math.floor(
                (event.clientY - rect.top)
                * scaleY
            );


        if (
            x <= 0 ||
            y <= 0 ||
            x >= originalCanvas.width - 1 ||
            y >= originalCanvas.height - 1
        ) {
            return;
        }


        getPixelRegion(
            x,
            y
        );


        drawSelectionGrid(
            x,
            y
        );

    }
);
// GET 3 × 3 PIXELS
function getPixelRegion(
    centerX,
    centerY
) {

    const pixels =
        originalImageData.data;

    const width =
        originalCanvas.width;

    let region = [];


    for (
        let row = -1;
        row <= 1;
        row++
    ) {

        let currentRow = [];


        for (
            let col = -1;
            col <= 1;
            col++
        ) {

            const x =
                centerX + col;

            const y =
                centerY + row;


            const index =
                (y * width + x) * 4;


            const r =
                pixels[index];

            const g =
                pixels[index + 1];

            const b =
                pixels[index + 2];


            const gray =
                Math.round(
                    0.299 * r +
                    0.587 * g +
                    0.114 * b
                );


            currentRow.push(gray);

        }


        region.push(
            currentRow
        );

    }


    displayPixelRegion(
        region
    );


    calculatePixel(
        region
    );
}
// DISPLAY 3 × 3 PIXELS
function displayPixelRegion(
    region
) {

    let html =
        "<h3>Selected 3×3 Pixel Values</h3>";

    html +=
        '<table class="pixel-table">';


    for (let row of region) {

        html += "<tr>";

        for (let value of row) {

            html +=
                `<td>${value}</td>`;

        }

        html += "</tr>";
    }


    html +=
        "</table>";


    pixelRegion.innerHTML =
        html;
}
// CALCULATE PIXEL
function calculatePixel(
    region
) {

    const kernel =
        kernels[kernelSelect.value];


    let total = 0;

    let html =
        '<div class="calculation-box">';


    for (let i = 0; i < 3; i++) {

        for (let j = 0; j < 3; j++) {

            const pixel =
                region[i][j];

            const kernelValue =
                kernel[i][j];

            const multiplication =
                pixel *
                kernelValue;

            total +=
                multiplication;


            html +=
                `${pixel} × ${kernelValue} = ${multiplication}<br>`;

        }
    }


    // Blur normalization

    let finalValue =
        total;

    if (
        kernelSelect.value === "blur"
    ) {

        finalValue =
            Math.round(
                total / 9
            );

    }


    // Gradient operators

    if (
        kernelSelect.value === "sobelX" ||
        kernelSelect.value === "sobelY" ||
        kernelSelect.value === "prewittX" ||
        kernelSelect.value === "prewittY"
    ) {

        finalValue =
            Math.abs(total);

    }


    finalValue =
        Math.max(
            0,
            Math.min(
                255,
                finalValue
            )
        );


    html +=
        "<hr>";

    html +=
        `<strong>Total = ${total}</strong>`;

    if (
        kernelSelect.value === "blur"
    ) {

        html +=
            `<br>Blur Average = ${total} ÷ 9 = ${finalValue}`;

    }


    html +=
        "</div>";


    calculation.innerHTML =
        html;


    result.innerHTML =
        `<div class="output-result">
            Output Pixel = ${finalValue}
        </div>`;
}
// DRAW 3 × 3 GRID
function drawSelectionGrid(
    centerX,
    centerY
) {

    gridCtx.clearRect(
        0,
        0,
        gridCanvas.width,
        gridCanvas.height
    );

    gridCtx.strokeStyle =
        "red";

    gridCtx.lineWidth =
        2;


    const startX =
        centerX - 1;

    const startY =
        centerY - 1;


    gridCtx.strokeRect(
        startX,
        startY,
        3,
        3
    );

}
// FULL IMAGE PIXEL VALUES
function displayFullPixelValues() {

    if (!originalImageData) {
        return;
    }


    const pixels =
        originalImageData.data;

    const width =
        originalCanvas.width;

    const height =
        originalCanvas.height;


    let html = "";


    for (
        let y = 0;
        y < height;
        y++
    ) {

        html +=
            '<div class="pixel-row">';


        for (
            let x = 0;
            x < width;
            x++
        ) {

            const index =
                (y * width + x) * 4;


            const r =
                pixels[index];

            const g =
                pixels[index + 1];

            const b =
                pixels[index + 2];


            const gray =
                Math.round(
                    0.299 * r +
                    0.587 * g +
                    0.114 * b
                );


            html +=
                `<span class="pixel-value">${gray}</span>`;

        }


        html +=
            "</div>";

    }


    fullPixelValues.innerHTML =
        html;
}
// INITIAL KERNEL
displayKernel();