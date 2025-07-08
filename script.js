// File processing state
let processedFiles = [];
let isProcessingFolder = false;
let currentFolderName = '';

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const folderInput = document.getElementById('folderInput');
const fileList = document.getElementById('fileList');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const actions = document.getElementById('actions');
const selectFolderBtn = document.getElementById('selectFolder');
const downloadAllBtn = document.getElementById('downloadAll');
const clearAllBtn = document.getElementById('clearAll');

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // File upload events
    uploadArea.addEventListener('click', (e) => {
        // Only trigger file input if clicking on the upload area itself and not disabled
        if ((e.target === uploadArea || (uploadArea.contains(e.target) && !e.target.closest('.actions'))) && !fileInput.disabled) {
            fileInput.click();
        }
    });
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    folderInput.addEventListener('change', handleFolderSelect);
    
    // Button events
    selectFolderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Temporarily disable file input to prevent conflicts
        fileInput.disabled = true;
        
        // Click folder input
        folderInput.click();
        
        // Re-enable file input after a delay
        setTimeout(() => {
            fileInput.disabled = false;
        }, 100);
    });
    downloadAllBtn.addEventListener('click', downloadAll);
    clearAllBtn.addEventListener('click', clearAll);
    
    // Tab events
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
});

// File handling functions
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    processFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        isProcessingFolder = false;
        const filesArray = Array.from(files);
        processFiles(filesArray);
    }
    // Reset the input to avoid conflicts
    setTimeout(() => {
        e.target.value = '';
    }, 100);
}

function handleFolderSelect(e) {
    const files = e.target.files;
    console.log('handleFolderSelect called, files:', files);
    console.log('Total files count:', files.length);
    
    // Debug: Log all files
    for (let i = 0; i < files.length; i++) {
        console.log(`File ${i + 1}:`, {
            name: files[i].name,
            path: files[i].webkitRelativePath,
            size: files[i].size,
            type: files[i].type
        });
    }
    
    // Show folder structure info
    if (files.length > 0) {
        console.log(`Selected folder with ${files.length} files`);
        // Extract folder path from first file
        const folderPath = files[0].webkitRelativePath.split('/')[0];
        currentFolderName = folderPath;
        progressText.textContent = `Processing folder: ${folderPath}`;
        isProcessingFolder = true;
        
        // Convert FileList to Array before processing
        const filesArray = Array.from(files);
        console.log('Converted to array:', filesArray.length, 'files');
        
        processFiles(filesArray);
    }
    // Reset the input to avoid conflicts - moved after processFiles
    setTimeout(() => {
        e.target.value = '';
    }, 100);
}

// Main file processing function
async function processFiles(files) {
    console.log('processFiles called with', files.length, 'files');
    if (files.length === 0) return;
    
    // Show progress
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = `Processing 0 / ${files.length} files...`;
    
    processedFiles = [];
    fileList.innerHTML = '';
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const normalizedName = normalizeFileName(file.name);
        
        // Handle folder path if present
        let normalizedPath = file.name;
        if (file.webkitRelativePath) {
            const pathParts = file.webkitRelativePath.split('/');
            const normalizedParts = pathParts.map(part => normalizeFileName(part));
            normalizedPath = normalizedParts.join('/');
        }
        
        // Create processed file object
        const processedFile = {
            originalFile: file,
            originalName: file.name,
            normalizedName: normalizedName,
            originalPath: file.webkitRelativePath || file.name,
            normalizedPath: normalizedPath,
            needsNormalization: file.name !== normalizedName || (file.webkitRelativePath && file.webkitRelativePath !== normalizedPath),
            size: file.size
        };
        
        processedFiles.push(processedFile);
        displayFile(processedFile, processedFiles.length - 1);
        
        // Update progress
        const progress = ((i + 1) / files.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `Processing ${i + 1} / ${files.length} files...`;
        
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Hide progress and show action buttons
    progressContainer.style.display = 'none';
    if (processedFiles.length > 0) {
        downloadAllBtn.style.display = 'inline-flex';
        clearAllBtn.style.display = 'inline-flex';
    }
}

// NFD to NFC normalization
function normalizeFileName(fileName) {
    // Normalize the entire filename from NFD to NFC
    return fileName.normalize('NFC');
}

// Display a processed file
function displayFile(fileData, index) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const statusIcon = fileData.needsNormalization ? '✅' : '➖';
    const statusText = fileData.needsNormalization ? 'Normalized' : 'No change needed';
    
    // Show full path if it's from a folder
    const originalDisplay = fileData.originalPath || fileData.originalName;
    const normalizedDisplay = fileData.normalizedPath || fileData.normalizedName;
    
    fileItem.innerHTML = `
        <div class="file-item-header">
            <div class="file-info">
                <div class="file-name original">
                    <strong>Original:</strong> ${escapeHtml(originalDisplay)}
                </div>
                <div class="file-name normalized">
                    <strong>Normalized:</strong> ${escapeHtml(normalizedDisplay)}
                </div>
                <div class="file-size">
                    ${formatFileSize(fileData.size)} · ${statusIcon} ${statusText}
                </div>
            </div>
            <div class="file-actions">
                <button class="btn btn-primary btn-small" onclick="downloadFile(${index})">
                    Download
                </button>
            </div>
        </div>
    `;
    
    fileList.appendChild(fileItem);
}

// Download individual file
function downloadFile(index) {
    const fileData = processedFiles[index];
    const file = fileData.originalFile;
    
    // Create a new File object with the normalized name
    const normalizedFile = new File([file], fileData.normalizedName, {
        type: file.type,
        lastModified: file.lastModified
    });
    
    // Create download link
    const url = URL.createObjectURL(normalizedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileData.normalizedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Download all files as ZIP
async function downloadAll() {
    if (isProcessingFolder && typeof JSZip !== 'undefined') {
        // Create ZIP for folder downloads
        const zip = new JSZip();
        
        for (const fileData of processedFiles) {
            // Preserve folder structure in ZIP
            const pathToUse = fileData.normalizedPath || fileData.normalizedName;
            
            // Read file content
            const content = await fileData.originalFile.arrayBuffer();
            zip.file(pathToUse, content);
        }
        
        // Generate ZIP file
        const zipBlob = await zip.generateAsync({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: {
                level: 6
            }
        });
        
        // Download ZIP with folder name
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        // Normalize the folder name for the ZIP file
        const normalizedFolderName = normalizeFileName(currentFolderName);
        a.download = `${normalizedFolderName}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else {
        // Download files individually for non-folder selections
        for (let i = 0; i < processedFiles.length; i++) {
            downloadFile(i);
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}

// Clear all files
function clearAll() {
    processedFiles = [];
    isProcessingFolder = false;
    currentFolderName = '';
    fileList.innerHTML = '';
    downloadAllBtn.style.display = 'none';
    clearAllBtn.style.display = 'none';
    fileInput.value = '';
    folderInput.value = '';
}

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });
    
    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.id === tabName);
    });
}


// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check for browser support
if (!String.prototype.normalize) {
    alert('Your browser does not support Unicode normalization. Please use a modern browser.');
}

// Bookmark functionality
function initBookmarkButton() {
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', showBookmarkGuide);
    }
}

function showBookmarkGuide() {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const shortcut = isMac ? 'Cmd+D' : 'Ctrl+D';
    
    // Browser-specific instructions
    const instructions = detectBrowserAndGuide();
    
    // Create custom modal for better UX
    const modal = document.createElement('div');
    modal.className = 'bookmark-modal';
    modal.innerHTML = `
        <div class="bookmark-modal-content">
            <h3>
                <span class="ko">즐겨찾기에 추가하기</span>
                <span class="en">Add to Bookmarks</span>
            </h3>
            <p class="bookmark-shortcut">
                <span class="ko">단축키: <strong>${shortcut}</strong></span>
                <span class="en">Shortcut: <strong>${shortcut}</strong></span>
            </p>
            <p class="browser-instructions">${instructions}</p>
            <button class="btn btn-primary" onclick="this.closest('.bookmark-modal').remove()">
                <span class="ko">확인</span>
                <span class="en">OK</span>
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Remove modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function detectBrowserAndGuide() {
    const userAgent = navigator.userAgent;
    let instructions = '';
    
    if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
        instructions = `
            <span class="ko">Chrome: 주소창 오른쪽 ⭐ 아이콘을 클릭하세요</span>
            <span class="en">Chrome: Click the ⭐ icon on the right side of the address bar</span>
        `;
    } else if (userAgent.indexOf('Firefox') > -1) {
        instructions = `
            <span class="ko">Firefox: Ctrl+Shift+D를 누르거나 주소창의 ⭐ 아이콘을 클릭하세요</span>
            <span class="en">Firefox: Press Ctrl+Shift+D or click the ⭐ icon in the address bar</span>
        `;
    } else if (userAgent.indexOf('Safari') > -1) {
        instructions = `
            <span class="ko">Safari: 공유 버튼을 눌러 "북마크 추가"를 선택하세요</span>
            <span class="en">Safari: Click the Share button and select "Add Bookmark"</span>
        `;
    } else if (userAgent.indexOf('Edg') > -1) {
        instructions = `
            <span class="ko">Edge: 주소창 오른쪽 ⭐ 아이콘을 클릭하세요</span>
            <span class="en">Edge: Click the ⭐ icon on the right side of the address bar</span>
        `;
    } else {
        instructions = `
            <span class="ko">주소창 근처의 즐겨찾기 아이콘을 찾아 클릭하세요</span>
            <span class="en">Look for the bookmark icon near the address bar and click it</span>
        `;
    }
    
    return instructions;
}

// PWA Install functionality
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Update UI notify the user they can install the PWA
    showInstallButton();
});

function showInstallButton() {
    // Create install button if it doesn't exist
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('installBtn')) {
        const installBtn = document.createElement('button');
        installBtn.id = 'installBtn';
        installBtn.className = 'btn btn-install';
        installBtn.innerHTML = `
            <span class="install-icon">📱</span>
            <span class="install-text">
                <span class="ko">앱 설치</span>
                <span class="en">Install App</span>
            </span>
        `;
        installBtn.addEventListener('click', installApp);
        headerActions.insertBefore(installBtn, headerActions.firstChild);
    }
}

function installApp() {
    if (deferredPrompt) {
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
                // Hide the install button
                const installBtn = document.getElementById('installBtn');
                if (installBtn) {
                    installBtn.style.display = 'none';
                }
            }
            deferredPrompt = null;
        });
    }
}

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker registration failed, app will still work
        });
    });
}

// Initialize bookmark button when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initBookmarkButton();
});