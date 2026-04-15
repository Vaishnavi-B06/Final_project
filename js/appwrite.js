// --- APPWRITE CONFIGURATION ---
const API_ENDPOINT = "https://fra.cloud.appwrite.io/v1";
const PROJECT_ID = "69b670aa00012bb2c641";
const BUCKET_ID = "69b670e4000c5a0d6e68";

let client;
window.storage = null;

function initAppwrite() {
    try {
        if (typeof Appwrite !== 'undefined') {
            client = new Appwrite.Client();
            client.setEndpoint(API_ENDPOINT).setProject(PROJECT_ID);
            window.storage = new Appwrite.Storage(client);
            console.log('Appwrite initialized.');
        } else {
            console.warn('Appwrite SDK not ready, retrying...');
            setTimeout(initAppwrite, 500);
        }
    } catch (err) {
        console.error('Appwrite init failed:', err);
    }
}
initAppwrite();

async function uploadToAppwrite(file) {
    try {
        if (typeof toggleLoader === 'function') toggleLoader(true, 'Uploading image...');
        if (!client || !window.storage) throw new Error('Appwrite not initialised');

        const fileId = (typeof Appwrite.ID !== 'undefined') ? Appwrite.ID.unique() : 'unique()';
        const response = await window.storage.createFile(BUCKET_ID, fileId, file);

        if (!response.$id) throw new Error('No file ID returned');

        const fileUrl = window.storage.getFileView(BUCKET_ID, response.$id).href;
        if (typeof showToast === 'function') showToast('Image uploaded!', 'success');
        localStorage.setItem('uploadedImageUrl', fileUrl);

        if (typeof toggleLoader === 'function') toggleLoader(true, 'Saving to database...');
        if (typeof saveToFirebase === 'function') {
            try {
                await saveToFirebase(fileUrl);
            } catch (fbErr) {
                console.warn('Firebase save skipped:', fbErr);
            }
        }

        setTimeout(() => window.location.href = 'occasion.html', 800);

    } catch (err) {
        console.error('Appwrite Upload Error:', err);
        if (typeof toggleLoader === 'function') toggleLoader(false);
        // Fallback: if Appwrite fails, base64 is already saved — just redirect
        if (localStorage.getItem('uploadedImageBase64')) {
            if (typeof showToast === 'function') showToast('Using local image (Appwrite unavailable)', 'error');
            setTimeout(() => window.location.href = 'occasion.html', 1500);
        } else {
            if (typeof showToast === 'function') showToast('Upload failed: ' + err.message, 'error');
        }
    }
}
