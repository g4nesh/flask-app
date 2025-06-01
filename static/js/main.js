// Global variables
let stream = null;
let isCaptured = false;
let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let snap = document.getElementById('snap');
let submitPhoto = document.getElementById('submitPhoto');
let fileInput = document.getElementById('fileInput');
let ctx = canvas.getContext('2d');

// Initialize camera when the page loads
async function initializeCamera() {
    try {
        // Check if we're running on a server environment
        if (window.location.hostname.includes('ec2') || window.location.hostname.includes('amazonaws')) {
            throw new Error('Camera access is not available on server environments');
        }

        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'environment'
            } 
        });
        video.srcObject = stream;
        video.play();
        isCaptured = false;
        updateCameraUI();
    } catch (err) {
        console.error('Error accessing camera:', err);
        // Show a more specific error message
        const errorMessage = err.message.includes('server environments') 
            ? 'Camera access is not available when accessing the application through a server. Please use the file upload option instead.'
            : 'Error accessing camera. Please make sure you have granted camera permissions.';
        
        // Update the camera preview to show the error
        const cameraPreview = document.querySelector('.camera-preview');
        cameraPreview.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 1rem; text-align: center; color: var(--text-secondary);">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 1rem;">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="M12 8v4"/>
                    <path d="M12 16h.01"/>
                </svg>
                <p>${errorMessage}</p>
            </div>
        `;
        
        // Disable camera controls
        snap.disabled = true;
        submitPhoto.disabled = true;
    }
}

// Update camera UI based on capture state
function updateCameraUI() {
    if (isCaptured) {
        snap.textContent = 'Retake';
        submitPhoto.disabled = false;
    } else {
        snap.textContent = 'Take Photo';
        submitPhoto.disabled = true;
    }
}

// Handle file input change
fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                isCaptured = true;
                updateCameraUI();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Handle snap button click
snap.addEventListener('click', function() {
    if (isCaptured) {
        // Retake photo
        if (stream) {
            video.srcObject = stream;
            video.play();
        }
        isCaptured = false;
    } else {
        // Take photo
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        isCaptured = true;
    }
    updateCameraUI();
});

// Handle submit button click
submitPhoto.addEventListener('click', async function() {
    if (!isCaptured) return;

    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading';
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
    document.querySelector('.camera-preview').appendChild(loadingOverlay);

    try {
        const imageData = canvas.toDataURL('image/jpeg');
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData })
        });

        if (!response.ok) {
            throw new Error('Analysis failed');
        }

        const result = await response.json();
        updateMetrics(result);
        showSuccessMessage('Analysis completed successfully!');
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Failed to analyze image. Please try again.');
    } finally {
        loadingOverlay.remove();
    }
});

// Update metrics display
function updateMetrics(metrics) {
    // Update metric cards
    Object.entries(metrics).forEach(([key, value]) => {
        const element = document.getElementById(`${key}-value`);
        if (element) {
            element.textContent = value;
        }
    });

    // Update graph
    updateGraph(metrics);
}

// Update graph with new data
function updateGraph(metrics) {
    const ctx = document.getElementById('metricsGraph').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.metricsChart) {
        window.metricsChart.destroy();
    }

    // Create new chart
    window.metricsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Redness', 'Scaling', 'Texture', 'Color Variation', 'Severity'],
            datasets: [{
                label: 'Current Metrics',
                data: [
                    metrics.redness_level,
                    metrics.scaling_level,
                    metrics.texture_score,
                    metrics.color_variation,
                    metrics.severity_score
                ],
                borderColor: '#4a90e2',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Show success message
function showSuccessMessage(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.textContent = message;
    document.querySelector('.container').insertBefore(alert, document.querySelector('.card'));
    setTimeout(() => alert.remove(), 5000);
}

// Show error message
function showErrorMessage(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.textContent = message;
    document.querySelector('.container').insertBefore(alert, document.querySelector('.card'));
    setTimeout(() => alert.remove(), 5000);
}

// Calculate percentage change
function calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
}

// Get CSS class for change value
function getChangeClass(value) {
    if (value > 0) return 'negative';  // Increase is bad (red)
    if (value < 0) return 'positive';  // Decrease is good (green)
    return 'neutral';
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeCamera();
    
    // Add event listeners for file upload
    const fileUpload = document.querySelector('.file-upload');
    if (fileUpload) {
        fileUpload.addEventListener('click', () => fileInput.click());
        fileUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUpload.classList.add('dragover');
        });
        fileUpload.addEventListener('dragleave', () => {
            fileUpload.classList.remove('dragover');
        });
        fileUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUpload.classList.remove('dragover');
            fileInput.files = e.dataTransfer.files;
            fileInput.dispatchEvent(new Event('change'));
        });
    }
}); 