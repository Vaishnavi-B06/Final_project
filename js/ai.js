// =============================================
//  SmartGlam — AI Helper (ai.js)
//  Note: result.html handles AI calls directly.
//  This file is a utility module for external use.
// =============================================

async function analyzeFaceWithAI(base64Image, occasion) {
  const response = await fetch('http://127.0.0.1:5000/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image, occasion })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI Server error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}

function displayAIResults(data) {
  // Element IDs expected in result.html
  const skinEl = document.getElementById('ai-skin');
  const skincareEl = document.getElementById('ai-skincare');
  const makeupEl = document.getElementById('ai-makeup');
  const productsEl = document.getElementById('ai-products');
  const loadingEl = document.getElementById('ai-loading');
  const resultsEl = document.getElementById('ai-results');

  if (!skinEl || !resultsEl) {
    console.error('displayAIResults: required DOM elements not found');
    return;
  }

  // Hide loading, show results
  if (loadingEl) loadingEl.classList.add('hidden');
  resultsEl.classList.remove('hidden');

  // Populate fields
  if (skinEl) skinEl.textContent = data.skin_type || 'Analysis complete.';
  if (skincareEl) skincareEl.textContent = data.skincare || 'Skincare steps ready.';
  if (makeupEl) makeupEl.textContent = data.makeup || 'Makeup guide ready.';

  // Products as tags
  if (productsEl) {
    productsEl.innerHTML = '';
    const products = Array.isArray(data.products)
      ? data.products
      : (typeof data.products === 'string' ? data.products.split(',') : []);

    products.forEach(p => {
      const tag = document.createElement('span');
      tag.className = 'product-tag';
      tag.textContent = p.trim();
      productsEl.appendChild(tag);
    });
  }
}
