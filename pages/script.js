

let model;
let classIndices;
let diseaseDB;

const imgUpload = document.getElementById('imgUpload');
const preview = document.getElementById('preview');
const predictBtn = document.getElementById('predictBtn');
const resultDiv = document.getElementById('result');

// Load class indices and disease database
async function loadJSON(path) {
  const response = await fetch(path);
  return await response.json();
}

async function loadModel() {
  // model saved under model/model.json
  model = await tf.loadLayersModel('model/model.json');
}

imgUpload.addEventListener('change', (evt) => {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    preview.style.display = 'block';
    predictBtn.disabled = false;
    resultDiv.innerHTML = ''; 
  };
  reader.readAsDataURL(file);
});

predictBtn.addEventListener('click', async () => {
  if (!model) {
    resultDiv.innerHTML = 'Model not loaded. Please wait.';
    return;
  }
  // Preprocess image
  const imgTensor = tf.browser.fromPixels(preview)
                      .resizeNearestNeighbor([224, 224])
                      .toFloat()
                      .div(tf.scalar(255.0))
                      .expandDims(0);  // shape [1,224,224,3]
  const predictions = model.predict(imgTensor);
  const data = predictions.dataSync();  // floats
  const maxIndex = data.indexOf(Math.max(...data));
  const confidence = data[maxIndex];
  const diseaseName = classIndices[maxIndex.toString()] || "Unknown";

  const diseaseInfo = diseaseDB[diseaseName] || { treatment: "Not found", supplements: "Not found" };

  resultDiv.innerHTML = `
    <p><strong>Disease Detected:</strong> ${diseaseName}</p>
    <p><strong>Confidence:</strong> ${(confidence * 100).toFixed(2)}%</p>
    <p><strong>Treatment:</strong> ${diseaseInfo.treatment}</p>
    <p><strong>Recommended Supplements/Fertilizer:</strong> ${diseaseInfo.supplements}</p>
  `;
});

// On load
(async function init() {
  classIndices = await loadJSON('indicas.json');
  diseaseDB = await loadJSON('diease_db.json');
  await loadModel();
  console.log("Model, class indices & disease DB loaded.");
})();
