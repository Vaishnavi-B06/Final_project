// =============================================
//  SmartGlam 2026 — Global Script
// =============================================

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentElement) toast.remove(); }, 3200);
}

// --- LOADER ---
function toggleLoader(show, text = 'Loading...') {
  const loader = document.getElementById('loader');
  if (!loader) return;
  if (show) {
    loader.classList.remove('hidden');
    const pt = loader.querySelector('p');
    if (pt) pt.textContent = text;
  } else {
    loader.classList.add('hidden');
  }
}

// --- UPLOAD HANDLING ---
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewImg = document.getElementById('image-preview');
const uploadBtn = document.getElementById('upload-btn');
let selectedFile = null;

if (dropZone && fileInput) {
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault(); dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', (e) => { if (e.target.files.length > 0) handleFileSelect(e.target.files[0]); });
}

function handleFileSelect(file) {
  if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return; }
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    if (previewImg) { previewImg.src = e.target.result; previewImg.classList.remove('hidden'); }
    const ph = document.getElementById('upload-placeholder');
    if (ph) ph.classList.add('hidden');
    if (uploadBtn) uploadBtn.disabled = false;
    localStorage.setItem('uploadedImageBase64', e.target.result);
    showToast('Photo ready! ✨', 'success');
  };
  reader.readAsDataURL(file);
}

// --- PAGE FLOW GUARD ---
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.includes('occasion.html')) {
    const hasSkinProfile = localStorage.getItem('skinProfile');
    if (!localStorage.getItem('uploadedImageUrl') && !localStorage.getItem('uploadedImageBase64') && !hasSkinProfile) {
      showToast('Please upload your photo or select your skin tone first', 'error');
      setTimeout(() => window.location.href = 'dashboard.html', 1600);
      return;
    }
  }

  if (path.includes('result.html')) {
    if (!localStorage.getItem('selectedOccasion')) {
      showToast('Please select an occasion first', 'error');
      setTimeout(() => window.location.href = 'occasion.html', 1600);
      return;
    }
  }

  if (uploadBtn) {
    uploadBtn.addEventListener('click', async () => {
      if (!selectedFile) {
        if (localStorage.getItem('uploadedImageBase64')) { window.location.href = 'occasion.html'; return; }
        showToast('Please select a photo first', 'error'); return;
      }
      if (typeof uploadToAppwrite === 'function') await uploadToAppwrite(selectedFile);
      else window.location.href = 'occasion.html';
    });
  }
});
