// // Canvas
// const canvas = document.getElementById("canvas");

// const ctx = canvas.getContext("2d");

// // Boutons
// const clearBtn = document.getElementById("clearBtn");

// const predictBtn = document.getElementById("predictBtn");

// // Résultat
// const prediction = document.getElementById("prediction");

// const confidence = document.getElementById("confidence");

// // Etat du dessin
// let drawing = false;

// // Style
// ctx.strokeStyle = "black";

// ctx.lineWidth = 15;

// ctx.lineCap = "round";



// // -------------------
// // Commencer à dessiner
// // -------------------

// canvas.addEventListener("mousedown", function(){

//     drawing = true;

// });



// // -------------------
// // Arrêter
// // -------------------

// canvas.addEventListener("mouseup", function(){

//     drawing = false;

//     ctx.beginPath();

// });



// // -------------------
// // Sortir du canvas
// // -------------------

// canvas.addEventListener("mouseleave", function(){

//     drawing = false;

//     ctx.beginPath();

// });



// // -------------------
// // Dessiner
// // -------------------

// canvas.addEventListener("mousemove", function(event){

//     if(!drawing){

//         return;

//     }

//     const rect = canvas.getBoundingClientRect();

//     const x = event.clientX - rect.left;

//     const y = event.clientY - rect.top;

//     ctx.lineTo(x,y);

//     ctx.stroke();

//     ctx.beginPath();

//     ctx.moveTo(x,y);

// });



// // -------------------
// // Clear
// // -------------------

// clearBtn.addEventListener("click", function(){

//     ctx.clearRect(0,0,canvas.width,canvas.height);

//     prediction.textContent="-";

//     confidence.textContent="-";

// });



// // -------------------
// // Predict (Temporaire)
// // -------------------

// predictBtn.addEventListener("click", function(){

//     const image = canvas.toDataURL("image/png");

//     fetch("http://127.0.0.1:5000/predict",{

//         method:"POST",

//         headers:{

//             "Content-Type":"application/json"

//         },

//         body:JSON.stringify({

//             image:image

//         })

//     })

//     .then(response=>response.json())

//     .then(data=>{

//         prediction.textContent=data.prediction;

//         confidence.textContent=data.confidence+" %";

//     });

// });

// Canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Boutons
const clearBtn = document.getElementById("clearBtn");
const predictBtn = document.getElementById("predictBtn");
const canvasHint = document.getElementById("canvasHint");

// Résultat
const prediction = document.getElementById("prediction");
const confidence = document.getElementById("confidence");
const confidenceFill = document.getElementById("confidenceFill");

// Etat du dessin
let drawing = false;
let hasDrawn = false;

// Style
ctx.strokeStyle = "black";
ctx.lineWidth = 15;
ctx.lineCap = "round";

// -------------------
// Fond blanc opaque (évite le bug du background transparent)
// -------------------
function fillWhiteBackground(){
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
fillWhiteBackground();

// -------------------
// Commencer à dessiner
// -------------------
function startDrawing(x, y){
    drawing = true;
    hasDrawn = true;
    canvasHint.classList.add("hidden");
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function stopDrawing(){
    drawing = false;
    ctx.beginPath();
}

function drawTo(x, y){
    if(!drawing){
        return;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function getCanvasCoords(clientX, clientY){
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// Souris
canvas.addEventListener("mousedown", function(event){
    const { x, y } = getCanvasCoords(event.clientX, event.clientY);
    startDrawing(x, y);
});

canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

canvas.addEventListener("mousemove", function(event){
    const { x, y } = getCanvasCoords(event.clientX, event.clientY);
    drawTo(x, y);
});

// Tactile (mobile / tablette)
canvas.addEventListener("touchstart", function(event){
    event.preventDefault();
    const touch = event.touches[0];
    const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
    startDrawing(x, y);
}, { passive: false });

canvas.addEventListener("touchmove", function(event){
    event.preventDefault();
    const touch = event.touches[0];
    const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
    drawTo(x, y);
}, { passive: false });

canvas.addEventListener("touchend", stopDrawing);

// -------------------
// Clear
// -------------------
clearBtn.addEventListener("click", function(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fillWhiteBackground();
    hasDrawn = false;
    canvasHint.classList.remove("hidden");
    prediction.textContent = "-";
    confidence.textContent = "-";
    confidenceFill.style.width = "0%";
});

// -------------------
// Predict
// -------------------
predictBtn.addEventListener("click", function(){

    if(!hasDrawn){
        canvasHint.classList.remove("hidden");
        return;
    }

    const image = canvas.toDataURL("image/png");

    // Loading state
    predictBtn.disabled = true;
    const originalContent = predictBtn.innerHTML;
    predictBtn.innerHTML = "<span>Analyse...</span>";

    fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            image: image
        })
    })
    .then(response => response.json())
    .then(data => {
        prediction.textContent = data.prediction;
        confidence.textContent = data.confidence + " %";
        confidenceFill.style.width = data.confidence + "%";
    })
    .catch(error => {
        prediction.textContent = "Erreur";
        confidence.textContent = "-";
        console.error("Erreur de prédiction:", error);
    })
    .finally(() => {
        predictBtn.disabled = false;
        predictBtn.innerHTML = originalContent;
    });
});