/**
 * Etapgorithm - Main Application Controller
 * MEB Pardus ETAP Akıllı Tahta Uyumlu Akış Şeması Editörü
 * (Özel Sağ Tık Menüsü, Çoklu Seçim & Toplu Silme, Özel Dialog Pencereleri,
 * Boş Input Standartları, Otomatik Fonksiyon Değişkeni ve Pano Sistemi)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Core DOM Element References
    const svgEl = document.getElementById('flowchart-svg');
    const canvasContainer = document.getElementById('canvas-container');
    const sidebar = document.getElementById('sidebar');
    const sidebarResizer = document.getElementById('sidebar-resizer');
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const btnFullscreen = document.getElementById('btn-fullscreen');

    const btnFileMenu = document.getElementById('btn-file-menu');
    const modalFileOperations = document.getElementById('modal-file-operations');
    const btnNew = document.getElementById('btn-new');
    const btnAddNodeToolbar = document.getElementById('btn-add-node-toolbar');
    const btnOpen = document.getElementById('btn-open');
    const fileInput = document.getElementById('file-input');
    const btnSaveFprg = document.getElementById('btn-save-fprg');
    const btnHelp = document.getElementById('btn-help');
    const modalHelpGuide = document.getElementById('modal-help-guide');

    // Functions
    const selectFunction = document.getElementById('select-function');
    const btnAddFunction = document.getElementById('btn-add-function');
    const btnManageFunction = document.getElementById('btn-manage-function');

    // Clipboard & Selection Controls
    const btnCopy = document.getElementById('btn-copy');
    const btnCut = document.getElementById('btn-cut');
    const btnDelete = document.getElementById('btn-delete');
    const btnSelectAll = document.getElementById('btn-select-all');
    const selectionBadge = document.getElementById('selection-badge');
    const selectionMarquee = document.getElementById('selection-marquee');

    const palettePasteBanner = document.getElementById('palette-paste-banner');
    const btnPalettePaste = document.getElementById('btn-palette-paste');
    const pasteItemDescription = document.getElementById('paste-item-description');

    // Custom Context Menu Elements
    const customContextMenu = document.getElementById('custom-context-menu');
    const ctxEdit = document.getElementById('ctx-edit');
    const ctxAddNode = document.getElementById('ctx-add-node');
    const ctxCut = document.getElementById('ctx-cut');
    const ctxCopy = document.getElementById('ctx-copy');
    const ctxPaste = document.getElementById('ctx-paste');
    const ctxSelectAll = document.getElementById('ctx-select-all');
    const ctxDelete = document.getElementById('ctx-delete');
    const ctxDeleteLabel = document.getElementById('ctx-delete-label');

    // Custom Alert / Confirm Dialog Elements
    const modalCustomDialog = document.getElementById('modal-custom-dialog');
    const dialogIconWrapper = document.getElementById('dialog-icon-wrapper');
    const dialogIconSvg = document.getElementById('dialog-icon-svg');
    const dialogTitle = document.getElementById('dialog-title');
    const dialogMessage = document.getElementById('dialog-message');
    const btnDialogCancel = document.getElementById('btn-dialog-cancel');
    const btnDialogConfirm = document.getElementById('btn-dialog-confirm');

    // Simulator
    const btnRun = document.getElementById('btn-run');
    const btnStep = document.getElementById('btn-step');
    const btnStop = document.getElementById('btn-stop');
    const selectSpeed = document.getElementById('select-speed');
    const selectExample = document.getElementById('select-examples');

    // Zoom
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');

    // Panels
    const consoleBox = document.getElementById('console-box');
    const variablesTbody = document.getElementById('variables-tbody');
    const codeLangSelect = document.getElementById('select-code-lang');
    const codeBox = document.getElementById('code-box');

    // Edit Node Modal
    const editTitle = document.getElementById('edit-node-title');
    const editBody = document.getElementById('edit-node-fields');
    const btnSaveEdit = document.getElementById('btn-save-edit');

    // Touch Input Modal
    const inputVarName = document.getElementById('prompt-var-name');
    const inputField = document.getElementById('prompt-input-value');
    const btnSubmitInput = document.getElementById('btn-submit-input');

    // Function Manager Modal
    const modalFunctionManager = document.getElementById('modal-function-manager');
    const functionModalTitle = document.getElementById('function-modal-title');
    const fnOldNameInput = document.getElementById('fn-old-name');
    const fnNameInput = document.getElementById('fn-name-input');
    const fnReturnVarGroup = document.getElementById('fn-return-var-group');
    const fnReturnVarInput = document.getElementById('fn-return-var-input');
    const fnParamsList = document.getElementById('fn-params-list');
    const btnAddParam = document.getElementById('btn-add-param');
    const btnDeleteFunction = document.getElementById('btn-delete-function');
    const btnSaveFunction = document.getElementById('btn-save-function');

    // 2. State & Tracking Variables
    let currentInsertTarget = { list: null, index: 0 };
    let currentEditingNode = null;
    let touchInputResolve = null;
    let contextMenuTarget = null;
    let dialogResolve = null;
    let currentProjectFileName = 'algoritma.fprg';

    // 3. Initialize Core Models & Renderer
    const model = new FlowchartModel();
    const renderer = new FlowchartRenderer(svgEl, model);

    // 4. Custom Dialog System (Özel Alert & Confirm Pencereleri)
    function showCustomAlert(message, title = 'Bilgi', type = 'info') {
        return new Promise((resolve) => {
            dialogResolve = resolve;
            if (dialogTitle) dialogTitle.textContent = title;
            if (dialogMessage) dialogMessage.textContent = message;

            if (dialogIconWrapper) {
                dialogIconWrapper.className = `dialog-icon-wrapper dialog-icon-${type}`;
            }

            const iconPaths = {
                info: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>',
                warning: '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
                error: '<path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>',
                success: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>'
            };
            if (dialogIconSvg) {
                dialogIconSvg.innerHTML = iconPaths[type] || iconPaths.info;
            }

            if (btnDialogCancel) btnDialogCancel.style.display = 'none';
            if (btnDialogConfirm) {
                btnDialogConfirm.textContent = 'Tamam';
                btnDialogConfirm.className = 'btn-primary';
                btnDialogConfirm.focus();
            }

            openModal('modal-custom-dialog');
        });
    }

    function showCustomConfirm(message, title = 'Onay Gerekli', options = {}) {
        return new Promise((resolve) => {
            dialogResolve = resolve;
            if (dialogTitle) dialogTitle.textContent = title;
            if (dialogMessage) dialogMessage.textContent = message;

            const type = options.danger ? 'danger' : (options.type || 'warning');
            if (dialogIconWrapper) {
                dialogIconWrapper.className = `dialog-icon-wrapper dialog-icon-${type}`;
            }

            const iconPaths = {
                warning: '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
                danger: '<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>',
                question: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm1.07-7.75l-.9.92C12.45 11.9 12 12.5 12 14h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>'
            };
            if (dialogIconSvg) {
                dialogIconSvg.innerHTML = iconPaths[type] || iconPaths.warning;
            }

            if (btnDialogCancel) {
                btnDialogCancel.style.display = 'block';
                btnDialogCancel.textContent = options.cancelText || 'Vazgeç';
            }
            if (btnDialogConfirm) {
                btnDialogConfirm.textContent = options.confirmText || 'Onayla';
                btnDialogConfirm.className = options.danger ? 'btn-primary btn-danger-confirm' : 'btn-primary';
                btnDialogConfirm.focus();
            }

            openModal('modal-custom-dialog');
        });
    }

    if (btnDialogConfirm) {
        btnDialogConfirm.addEventListener('click', () => {
            closeModal();
            if (dialogResolve) {
                const res = dialogResolve;
                dialogResolve = null;
                res(true);
            }
        });
    }

    if (btnDialogCancel) {
        btnDialogCancel.addEventListener('click', () => {
            closeModal();
            if (dialogResolve) {
                const res = dialogResolve;
                dialogResolve = null;
                res(false);
            }
        });
    }

    // Fallback: Standart window.alert ve window.confirm çağrılarını özel penceremize yönlendir
    window.alert = (msg) => showCustomAlert(msg, "Bilgi", "info");

    // 5. Helper Functions & UI Updaters
    function addConsoleLog(msg, type = "output", newline = true) {
        if (!consoleBox) return;
        const item = document.createElement('div');
        item.className = `log-item log-${type}`;
        item.textContent = msg;
        consoleBox.appendChild(item);
        consoleBox.scrollTop = consoleBox.scrollHeight;
    }

    function clearConsole() {
        if (consoleBox) consoleBox.innerHTML = '';
    }

    function updateVariablesTable(vars) {
        if (!variablesTbody) return;
        variablesTbody.innerHTML = '';
        const entries = Object.entries(vars);
        if (entries.length === 0) {
            variablesTbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #64748b;">Henüz tanımlı değişken yok</td></tr>`;
            return;
        }

        for (const [name, info] of entries) {
            const tr = document.createElement('tr');
            const valDisplay = (info.value === null || info.value === undefined || !info.initialized)
                ? '<em style="color: #94a3b8; font-size: 0.82rem;">(tanımsız / null)</em>'
                : `<code style="color: #38bdf8;">${JSON.stringify(info.value)}</code>`;
            tr.innerHTML = `
                <td><strong>${name}</strong></td>
                <td><span class="var-type-badge type-${info.type}">${info.type}</span></td>
                <td>${valDisplay}</td>
            `;
            variablesTbody.appendChild(tr);
        }
    }

    function updateRunButtonStates(state) {
        if (!btnRun) return;
        if (state === 'running') {
            btnRun.innerHTML = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M14 19h4V5h-4v14zm-8 0h4V5H6v14z"/></svg> Duraklat`;
            btnRun.classList.add('btn-pause');
            btnRun.classList.remove('btn-run');
        } else if (state === 'paused') {
            btnRun.innerHTML = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg> Devam Et`;
            btnRun.classList.remove('btn-pause');
            btnRun.classList.add('btn-run');
        } else {
            btnRun.innerHTML = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg> Başlat`;
            btnRun.classList.remove('btn-pause');
            btnRun.classList.add('btn-run');
        }
    }

    function updateCodeView() {
        if (!codeBox || typeof CodeGenerator === 'undefined') return;
        const lang = codeLangSelect ? codeLangSelect.value : 'python';
        try {
            codeBox.textContent = CodeGenerator.generate(model, lang);
        } catch (err) {
            codeBox.textContent = "// Kod üretilirken hata oluştu: " + err.message;
        }
    }

    function updateSelectionBadge() {
        if (!selectionBadge) return;
        const count = model.selectedNodeIds.size;
        if (count > 0) {
            selectionBadge.textContent = `${count} Blok Seçili`;
            selectionBadge.style.display = 'inline-block';
        } else {
            selectionBadge.style.display = 'none';
        }
    }

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('active');
        }
    }

    function closeModal() {
        document.querySelectorAll('.modal-overlay').forEach(m => {
            m.classList.remove('active');
            m.style.display = 'none';
        });
    }

    function switchSidebarTab(targetPaneId) {
        document.querySelectorAll('.sidebar-tab').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-tab') === targetPaneId);
        });
        document.querySelectorAll('.tab-pane').forEach(p => {
            p.classList.toggle('active', p.id === targetPaneId);
        });
        if (targetPaneId === 'tab-code') updateCodeView();
    }

    function promptTouchInput(varName) {
        return new Promise((resolve) => {
            touchInputResolve = resolve;
            if (inputVarName) inputVarName.textContent = varName;
            if (inputField) {
                inputField.value = '';
                inputField.placeholder = `${varName} için değer giriniz...`;
            }
            openModal('modal-prompt-input');
            setTimeout(() => {
                if (inputField) inputField.focus();
            }, 100);
        });
    }

    function updateFunctionDropdown() {
        if (!selectFunction) return;
        selectFunction.innerHTML = '';
        for (const [key, fn] of Object.entries(model.functions)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = fn.displayName || fn.name;
            if (key === model.currentFunctionName) {
                opt.selected = true;
            }
            selectFunction.appendChild(opt);
        }
    }

    // 6. Toplu Silme ve Onay Fonksiyonu (Delete with Custom Confirm)
    async function confirmDeleteSelected() {
        const count = model.selectedNodeIds.size;
        if (count === 0) return;

        const msg = count > 1
            ? `Seçili ${count} adet bloğu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
            : `Seçili bloğu silmek istediğinizden emin misiniz?`;

        const ok = await showCustomConfirm(msg, 'Blokları Sil', { danger: true, confirmText: 'Evet, Sil' });
        if (ok) {
            const deletedCount = model.deleteSelectedNodes();
            renderer.render();
            updateCodeView();
            updateSelectionBadge();
            addConsoleLog(`[Düzenleme] ${deletedCount} adet blok silindi.`, "system-warning");
            if (window.onFlowchartChanged) window.onFlowchartChanged();
        }
    }

    async function handleCopy() {
        if (model.selectedNodeIds.size === 0) {
            await showCustomAlert("Lütfen önce kopyalamak istediğiniz bloğu/blokları tıklayarak seçin.", "Blok Seçilmedi", "warning");
            return;
        }
        if (model.copySelected()) {
            const count = model.selectedNodeIds.size;
            addConsoleLog(`[Pano] ${count > 1 ? count + ' blok' : 'Blok'} kopyalandı (Ctrl+C). Araya eklemek için + butonuna dokunun veya sağ tıklayın.`, "system");
        }
    }

    async function handleCut() {
        if (model.selectedNodeIds.size === 0) {
            await showCustomAlert("Lütfen önce kesmek istediğiniz bloğu/blokları tıklayarak seçin.", "Blok Seçilmedi", "warning");
            return;
        }
        if (model.cutSelected()) {
            const count = model.selectedNodeIds.size;
            addConsoleLog(`[Pano] ${count > 1 ? count + ' blok' : 'Blok'} kesildi (Ctrl+X). Araya yapıştırmak için + butonuna dokunun veya sağ tıklayın.`, "system-warning");
            markProjectDirty();
        }
    }

    function handleSelectAll() {
        model.selectAll();
        renderer.render();
        updateSelectionBadge();
        addConsoleLog(`[Seçim] Tüm bloklar seçildi (${model.selectedNodeIds.size} adet).`, "system");
    }

    // 7. Initialize Interpreter
    const interpreter = new FlowInterpreter(model, {
        delayMs: selectSpeed ? parseInt(selectSpeed.value, 10) : 600,
        onLog: (msg, type, newline = true) => addConsoleLog(msg, type, newline),
        onClearConsole: () => clearConsole(),
        onVariablesChange: (vars) => updateVariablesTable(vars),
        onNodeActive: (nodeId) => renderer.setActiveNode(nodeId),
        onStateChange: (state) => updateRunButtonStates(state),
        onPromptInput: (varName) => promptTouchInput(varName)
    });

    // Unsaved Changes Tracking
    let isProjectDirty = false;

    function markProjectDirty() {
        isProjectDirty = true;
        updateCodeView();
        try {
            if (typeof localStorage !== 'undefined' && typeof FprgParser !== 'undefined') {
                const xml = FprgParser.export(model);
                localStorage.setItem('etapgorithm_autosave_fprg', xml);
                localStorage.setItem('etapgorithm_has_unsaved', '1');
            }
        } catch(e) {}
    }

    function markProjectClean() {
        isProjectDirty = false;
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('etapgorithm_has_unsaved');
                localStorage.removeItem('etapgorithm_autosave_fprg');
            }
        } catch(e) {}
    }

    window.onFlowchartChanged = () => {
        markProjectDirty();
    };

    // Disable browser zoom via Ctrl + Wheel and zoom flowchart blocks instead (1/3 scale step: 0.025)
    window.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const step = 0.025; // 1/3 of previous 0.075 step
            if (typeof renderer !== 'undefined' && renderer) {
                renderer.zoom(e.deltaY < 0 ? step : -step);
            }
        }
    }, { passive: false });

    // Warning before closing or reloading browser tab
    window.addEventListener('beforeunload', (e) => {
        if (isProjectDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // 8. Custom Context Menu (Sağ Tık & Dokunmatik Uzun Basma Menüsü)
    function openContextMenu(e, targetInfo) {
        contextMenuTarget = targetInfo;
        if (!customContextMenu) return;

        const menuWidth = 200;
        const menuHeight = 220;
        const x = Math.min(e.clientX, window.innerWidth - menuWidth - 12);
        const y = Math.min(e.clientY, window.innerHeight - menuHeight - 12);

        customContextMenu.style.left = `${Math.max(10, x)}px`;
        customContextMenu.style.top = `${Math.max(10, y)}px`;

        const isNode = targetInfo && targetInfo.type === 'node';
        const isPlus = targetInfo && targetInfo.type === 'plus';
        const hasClipboard = !!model.clipboard;
        const selCount = model.selectedNodeIds.size;

        if (ctxEdit) ctxEdit.style.display = (isNode && selCount <= 1) ? 'flex' : 'none';
        if (ctxAddNode) ctxAddNode.style.display = 'flex';
        if (ctxCut) ctxCut.style.display = (isNode || selCount > 0) ? 'flex' : 'none';
        if (ctxCopy) ctxCopy.style.display = (isNode || selCount > 0) ? 'flex' : 'none';

        if (ctxPaste) {
            ctxPaste.style.display = 'flex';
            ctxPaste.style.opacity = hasClipboard ? '1' : '0.4';
            ctxPaste.style.pointerEvents = hasClipboard ? 'auto' : 'none';
            const textSpan = ctxPaste.querySelector('span:first-of-type');
            if (textSpan) {
                if (isPlus) textSpan.textContent = 'Buraya Yapıştır';
                else if (isNode) textSpan.textContent = 'Altına Yapıştır';
                else textSpan.textContent = 'Yapıştır';
            }
        }

        if (ctxDelete) {
            ctxDelete.style.display = (isNode || selCount > 0) ? 'flex' : 'none';
            if (ctxDeleteLabel) {
                ctxDeleteLabel.textContent = selCount > 1 ? `Seçilenleri Sil (${selCount})` : 'Sil';
            }
        }

        customContextMenu.style.display = 'block';
    }

    function closeContextMenu() {
        if (customContextMenu) customContextMenu.style.display = 'none';
        contextMenuTarget = null;
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#custom-context-menu')) {
            closeContextMenu();
        }
    });

    window.addEventListener('resize', closeContextMenu);
    if (canvasContainer) canvasContainer.addEventListener('scroll', closeContextMenu);

    // Context Menu Items Handlers
    if (ctxEdit) {
        ctxEdit.addEventListener('click', () => {
            closeContextMenu();
            let targetNode = null;
            if (contextMenuTarget && contextMenuTarget.node) {
                targetNode = contextMenuTarget.node;
            } else if (model.selectedNodeId) {
                const found = model.findNode(model.selectedNodeId);
                if (found) targetNode = found.node;
            }
            if (targetNode) {
                currentEditingNode = targetNode;
                openEditModal(targetNode);
            }
        });
    }

    if (ctxAddNode) {
        ctxAddNode.addEventListener('click', () => {
            const target = contextMenuTarget;
            closeContextMenu();
            if (target && target.type === 'plus') {
                currentInsertTarget = { 
                    list: target.targetList || model.currentBody, 
                    index: target.index !== undefined ? target.index : model.currentBody.length 
                };
            } else if (target && target.type === 'node') {
                const found = model.findNode(target.node.id);
                if (found) {
                    currentInsertTarget = {
                        list: found.parentList,
                        index: found.parentList.findIndex(n => n.id === target.node.id) + 1
                    };
                } else {
                    currentInsertTarget = { list: model.currentBody, index: model.currentBody.length };
                }
            } else {
                currentInsertTarget = { list: model.currentBody, index: model.currentBody.length };
            }
            openModal('modal-add-node');
        });
    }

    if (btnAddNodeToolbar) {
        btnAddNodeToolbar.addEventListener('click', () => {
            currentInsertTarget = { list: model.currentBody, index: model.currentBody.length };
            if (model.clipboard && palettePasteBanner) {
                palettePasteBanner.style.display = 'block';
                if (pasteItemDescription) {
                    const label = Array.isArray(model.clipboard)
                        ? `${model.clipboard.length} adet blok`
                        : renderer.getNodeLabel(model.clipboard);
                    pasteItemDescription.textContent = `"${label}" buraya ekle`;
                }
            } else if (palettePasteBanner) {
                palettePasteBanner.style.display = 'none';
            }
            openModal('modal-add-node');
        });
    }

    if (ctxCopy) {
        ctxCopy.addEventListener('click', async () => {
            closeContextMenu();
            await handleCopy();
        });
    }

    if (ctxCut) {
        ctxCut.addEventListener('click', async () => {
            closeContextMenu();
            await handleCut();
        });
    }

    if (ctxPaste) {
        ctxPaste.addEventListener('click', () => {
            const target = contextMenuTarget;
            closeContextMenu();
            if (!model.clipboard) return;

            let list = model.currentBody;
            let idx = list.length;

            if (target && target.type === 'plus') {
                list = target.targetList || model.currentBody;
                idx = target.index !== undefined ? target.index : list.length;
            } else if (target && target.type === 'node') {
                const found = model.findNode(target.node.id);
                if (found) {
                    list = found.parentList;
                    idx = found.parentList.findIndex(n => n.id === target.node.id) + 1;
                }
            } else if (model.selectedNodeId) {
                const found = model.findNode(model.selectedNodeId);
                if (found) {
                    list = found.parentList;
                    idx = found.parentList.findIndex(n => n.id === model.selectedNodeId) + 1;
                }
            }

            const pasted = model.pasteNode(list, idx);
            renderer.render();
            updateCodeView();
            updateSelectionBadge();
            markProjectDirty();
            const label = Array.isArray(pasted) ? `${pasted.length} blok` : renderer.getNodeLabel(pasted);
            addConsoleLog(`[Pano] Yapıştırıldı: ${label}`, "system");
        });
    }

    if (ctxSelectAll) {
        ctxSelectAll.addEventListener('click', () => {
            closeContextMenu();
            handleSelectAll();
        });
    }

    if (ctxDelete) {
        ctxDelete.addEventListener('click', async () => {
            closeContextMenu();
            await confirmDeleteSelected();
        });
    }

    // 9. Hook Renderer Callbacks
    renderer.onContextMenu = (e, info) => {
        openContextMenu(e, info);
    };

    renderer.onNodeClick = (node) => {
        // Tek tıklama bloğu seçer, edit modalını AÇMAZ (böylece kopyalama, kesme ve çoklu seçim pürüzsüz çalışır)
        updateSelectionBadge();
    };

    renderer.onNodeDblClick = (node) => {
        // Çift tıklama bloğu düzenleme penceresini açar
        currentEditingNode = node;
        openEditModal(node);
    };

    renderer.onNodeDelete = async (node) => {
        const ok = await showCustomConfirm(`"${renderer.getNodeLabel(node)}" bloğunu silmek istediğinize emin misiniz?`, 'Bloğu Sil', { danger: true, confirmText: 'Evet, Sil' });
        if (ok) {
            model.deleteNode(node.id);
            renderer.render();
            updateCodeView();
            updateSelectionBadge();
            addConsoleLog(`[Düzenleme] Blok silindi: ${renderer.getNodeLabel(node)}`, "system-warning");
            if (window.onFlowchartChanged) window.onFlowchartChanged();
        }
    };

    renderer.onPlusClick = (list, index, pos) => {
        currentInsertTarget = { list, index };

        // Check if clipboard has content to paste
        if (model.clipboard && palettePasteBanner) {
            palettePasteBanner.style.display = 'block';
            if (pasteItemDescription) {
                const label = Array.isArray(model.clipboard)
                    ? `${model.clipboard.length} adet blok`
                    : renderer.getNodeLabel(model.clipboard);
                pasteItemDescription.textContent = `"${label}" buraya ekle`;
            }
        } else if (palettePasteBanner) {
            palettePasteBanner.style.display = 'none';
        }

        openModal('modal-add-node');
    };

    // Canvas container boş alanına sağ tık
    if (canvasContainer) {
        canvasContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const isBg = (e.target.id === 'canvas-container' || e.target.id === 'flowchart-svg' || e.target.tagName === 'svg');
            if (isBg) {
                openContextMenu(e, { type: 'canvas' });
            }
        });
    }

    // Dokunmatik Akıllı Tahtalar İçin Uzun Basma (Long-Press) Desteği
    let touchTimer = null;
    let touchStartPos = { x: 0, y: 0 };

    if (canvasContainer) {
        canvasContainer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                const t = e.touches[0];
                touchStartPos = { x: t.clientX, y: t.clientY };
                clearTimeout(touchTimer);
                touchTimer = setTimeout(() => {
                    const elem = document.elementFromPoint(touchStartPos.x, touchStartPos.y);
                    const nodeGroup = elem ? elem.closest('.node-group') : null;
                    const plusBtn = elem ? elem.closest('.plus-btn') : null;

                    if (nodeGroup) {
                        const nodeId = nodeGroup.getAttribute('data-id');
                        const found = model.findNode(nodeId);
                        if (found) {
                            if (!model.isSelected(nodeId)) {
                                model.selectNode(nodeId, false);
                                renderer.render();
                                updateSelectionBadge();
                            }
                            openContextMenu({ clientX: touchStartPos.x, clientY: touchStartPos.y }, { type: 'node', node: found.node });
                        }
                    } else if (plusBtn) {
                        openContextMenu({ clientX: touchStartPos.x, clientY: touchStartPos.y }, { type: 'plus' });
                    } else {
                        openContextMenu({ clientX: touchStartPos.x, clientY: touchStartPos.y }, { type: 'canvas' });
                    }
                }, 500);
            }
        }, { passive: true });

        canvasContainer.addEventListener('touchmove', (e) => {
            if (touchTimer && e.touches.length === 1) {
                const t = e.touches[0];
                const dx = Math.abs(t.clientX - touchStartPos.x);
                const dy = Math.abs(t.clientY - touchStartPos.y);
                if (dx > 10 || dy > 10) {
                    clearTimeout(touchTimer);
                    touchTimer = null;
                }
            }
        }, { passive: true });

        canvasContainer.addEventListener('touchend', () => {
            clearTimeout(touchTimer);
            touchTimer = null;
        });
    }

    // 10. Rubberband / Marquee Sürükleyerek Çoklu Seçim
    if (canvasContainer && selectionMarquee) {
        let isMarquee = false;
        let marqueeStart = { x: 0, y: 0 };

        canvasContainer.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            const isBg = (e.target.id === 'canvas-container' || e.target.id === 'flowchart-svg' || e.target.tagName === 'svg');
            if (!isBg) return;

            const rect = canvasContainer.getBoundingClientRect();
            marqueeStart = {
                x: e.clientX - rect.left + canvasContainer.scrollLeft,
                y: e.clientY - rect.top + canvasContainer.scrollTop,
                clientX: e.clientX,
                clientY: e.clientY
            };
            isMarquee = true;
            selectionMarquee.style.display = 'none';

            if (!e.ctrlKey && !e.shiftKey) {
                model.clearSelection();
                document.querySelectorAll('.node-group.selected').forEach(el => el.classList.remove('selected'));
                updateSelectionBadge();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isMarquee) return;
            const rect = canvasContainer.getBoundingClientRect();
            const currentX = e.clientX - rect.left + canvasContainer.scrollLeft;
            const currentY = e.clientY - rect.top + canvasContainer.scrollTop;

            const dx = Math.abs(e.clientX - marqueeStart.clientX);
            const dy = Math.abs(e.clientY - marqueeStart.clientY);
            if (dx < 5 && dy < 5) return;

            const x = Math.min(marqueeStart.x, currentX);
            const y = Math.min(marqueeStart.y, currentY);
            const w = Math.abs(currentX - marqueeStart.x);
            const h = Math.abs(currentY - marqueeStart.y);

            selectionMarquee.style.left = `${x}px`;
            selectionMarquee.style.top = `${y}px`;
            selectionMarquee.style.width = `${w}px`;
            selectionMarquee.style.height = `${h}px`;
            selectionMarquee.style.display = 'block';

            const marqueeRect = {
                left: Math.min(marqueeStart.clientX, e.clientX),
                top: Math.min(marqueeStart.clientY, e.clientY),
                right: Math.max(marqueeStart.clientX, e.clientX),
                bottom: Math.max(marqueeStart.clientY, e.clientY)
            };

            const nodeEls = svgEl.querySelectorAll('.node-group');
            nodeEls.forEach(nel => {
                const nRect = nel.getBoundingClientRect();
                const overlaps = !(nRect.right < marqueeRect.left ||
                    nRect.left > marqueeRect.right ||
                    nRect.bottom < marqueeRect.top ||
                    nRect.top > marqueeRect.bottom);
                const id = nel.getAttribute('data-id');
                if (overlaps) {
                    model.selectedNodeIds.add(id);
                    nel.classList.add('selected');
                } else if (!e.ctrlKey && !e.shiftKey) {
                    model.selectedNodeIds.delete(id);
                    nel.classList.remove('selected');
                }
            });
            updateSelectionBadge();
        });

        document.addEventListener('mouseup', () => {
            if (isMarquee) {
                isMarquee = false;
                selectionMarquee.style.display = 'none';
                updateSelectionBadge();
            }
        });
    }

    // 11. Modals Close Handlers
    document.querySelectorAll('.modal-close, .btn-modal-cancel').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // 12. Add Node Palette Click
    document.querySelectorAll('.palette-item[data-type]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const type = item.getAttribute('data-type');
            if (!type) return;

            const newNode = model.createNode(type);
            const list = (currentInsertTarget && Array.isArray(currentInsertTarget.list))
                ? currentInsertTarget.list
                : model.currentBody;
            const index = (currentInsertTarget && typeof currentInsertTarget.index === 'number')
                ? currentInsertTarget.index
                : list.length;

            model.insertNode(newNode, list, index);
            model.selectedNodeId = newNode.id;

            closeModal();
            renderer.render();
            updateCodeView();
            updateSelectionBadge();
            markProjectDirty();
            addConsoleLog(`[Eklendi] ${renderer.getNodeLabel(newNode)} bloğu eklendi.`, "system");

            // Yeni eklenen blok için özellikleri hemen aç (boş input alanlarıyla)
            currentEditingNode = newNode;
            openEditModal(newNode);
        });
    });

    // Paste from Palette Button
    if (btnPalettePaste) {
        btnPalettePaste.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (model.clipboard) {
                const list = (currentInsertTarget && Array.isArray(currentInsertTarget.list))
                    ? currentInsertTarget.list
                    : model.currentBody;
                const index = (currentInsertTarget && typeof currentInsertTarget.index === 'number')
                    ? currentInsertTarget.index
                    : list.length;

                const pasted = model.pasteNode(list, index);
                closeModal();
                renderer.render();
                updateCodeView();
                updateSelectionBadge();
                const label = Array.isArray(pasted) ? `${pasted.length} blok` : renderer.getNodeLabel(pasted);
                addConsoleLog(`[Pano] Blok yapıştırıldı: ${label}`, "system");
            }
        });
    }

    // 13. Node Edit Properties Modal (Varsayılan değerler TAMAMEN BOŞ)
    function openEditModal(node) {
        if (!editBody || !editTitle) return;
        editBody.innerHTML = '';
        const titleMap = {
            'declare': 'Declare (Tanımla)',
            'assign': 'Assign (Atama)',
            'input': 'Input (Girdi)',
            'output': 'Output (Çıktı)',
            'if': 'If (Eğer)',
            'while': 'While (İken)',
            'for': 'For (İçin)',
            'call': 'Call (Çağır)',
            'comment': 'Comment (Açıklama)'
        };
        editTitle.textContent = titleMap[node.type] || 'Bloğu Düzenle';

        switch (node.type) {
            case 'declare':
                editBody.innerHTML = `
                    <div class="form-group">
                        <label>Değişken Adı (Birden fazla ise virgülle ayırın):</label>
                        <input type="text" id="edit-declare-name" class="form-input" value="${node.name || ''}" placeholder="Değişken adını yazınız...">
                    </div>
                    <div class="form-group">
                        <label>Veri Türü:</label>
                        <div class="type-buttons">
                            <button type="button" class="type-btn ${node.dataType === 'Integer' ? 'active' : ''}" data-type="Integer">Tamsayı (Integer)</button>
                            <button type="button" class="type-btn ${node.dataType === 'Real' ? 'active' : ''}" data-type="Real">Reel (Ondalıklı)</button>
                            <button type="button" class="type-btn ${node.dataType === 'String' ? 'active' : ''}" data-type="String">Metin (String)</button>
                            <button type="button" class="type-btn ${node.dataType === 'Boolean' ? 'active' : ''}" data-type="Boolean">Mantıksal (Bool)</button>
                        </div>
                    </div>
                `;
                editBody.querySelectorAll('.type-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        editBody.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    });
                });
                break;

            case 'assign':
                editBody.innerHTML = `
                    <div class="form-group">
                        <label>Değişken Adı:</label>
                        <input type="text" id="edit-assign-var" class="form-input" value="${node.variable || ''}" placeholder="Değişken adını yazınız...">
                    </div>
                    <div class="form-group">
                        <label>Değer veya İfade (Formül):</label>
                        <input type="text" id="edit-assign-expr" class="form-input" value="${node.expression || ''}" placeholder="Atanacak değer veya formülü yazınız...">
                    </div>
                `;
                break;

            case 'input':
                editBody.innerHTML = `
                    <div class="form-group">
                        <label>Girdi Alınacak Değişken:</label>
                        <input type="text" id="edit-input-var" class="form-input" value="${node.variable || ''}" placeholder="Girdinin aktarılacağı değişken...">
                    </div>
                `;
                break;

            case 'output':
                editBody.innerHTML = `
                    <div class="form-group">
                        <label>Yazdırılacak İfade veya Metin:</label>
                        <input type="text" id="edit-output-expr" class="form-input" value="${(node.expression || '').replace(/"/g, '&quot;')}" placeholder='Ekrana yazılacak metin veya formül...'>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="edit-output-nl" ${node.newline ? 'checked' : ''}>
                            Yeni Satıra Geç (Newline)
                        </label>
                    </div>
                `;
                break;

            case 'if':
                editBody.innerHTML = `
                    <div class="form-group">
                        <label>Koşul İfadesi (Doğru veya Yanlış olmalıdır):</label>
                        <input type="text" id="edit-if-expr" class="form-input" value="${node.expression || ''}" placeholder="Koşul ifadesini yazınız (Örn: sayi > 0)...">
                        <p style="font-size: 0.85rem; color: #94a3b8; margin-top: 6px;">İpuçları: <code>==</code>, <code>!=</code>, <code>&gt;</code>, <code>&lt;</code>, <code>AND</code>, <code>OR</code></p>
                    </div>
                `;
                break;

            case 'while':
                editBody.innerHTML = `
                    <div class="form-group">
                        <label>Döngü Koşulu (Doğru olduğu sürece devam eder):</label>
                        <input type="text" id="edit-while-expr" class="form-input" value="${node.expression || ''}" placeholder="Döngü koşulunu yazınız (Örn: sayac <= 10)...">
                    </div>
                `;
                break;

            case 'for':
                editBody.innerHTML = `
                    <div class="form-group">
                        <label>Sayaç Değişkeni:</label>
                        <input type="text" id="edit-for-var" class="form-input" value="${node.variable || ''}" placeholder="Örn: i">
                    </div>
                    <div class="form-group">
                        <label>Döngü Yönü:</label>
                        <div class="type-buttons" id="for-direction-buttons">
                            <button type="button" class="type-btn ${node.direction !== 'dec' ? 'active' : ''}" data-dir="inc">Artan (Artış: +)</button>
                            <button type="button" class="type-btn ${node.direction === 'dec' ? 'active' : ''}" data-dir="dec">Azalan (Eksilen: −)</button>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <div class="form-group" style="flex:1;">
                            <label>Başlangıç Değeri:</label>
                            <input type="text" id="edit-for-start" class="form-input" value="${node.start || ''}" placeholder="Örn: 1">
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Bitiş Değeri:</label>
                            <input type="text" id="edit-for-end" class="form-input" value="${node.end || ''}" placeholder="Örn: 10">
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Adım (Step):</label>
                            <input type="text" id="edit-for-step" class="form-input" value="${node.step || '1'}" placeholder="Adım...">
                        </div>
                    </div>
                `;
                editBody.querySelectorAll('#for-direction-buttons .type-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        editBody.querySelectorAll('#for-direction-buttons .type-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    });
                });
                break;

            case 'call':
                editBody.innerHTML = `
                    <div class="form-group">
                        <label>Çağrılacak Fonksiyon İfadesi:</label>
                        <input type="text" id="edit-call-expr" class="form-input" value="${node.expression || ''}" placeholder="Örn: KareAl(sayi) veya MesajVer()">
                        <p style="font-size: 0.85rem; color: #94a3b8; margin-top: 6px;">Tanımlı Fonksiyonlar: <code>${Object.keys(model.functions).join(', ')}</code></p>
                    </div>
                `;
                break;

            case 'comment':
                editBody.innerHTML = `
                    <div class="form-group">
                        <label>Açıklama / Not Metni:</label>
                        <textarea id="edit-comment-text" class="form-input" rows="3" placeholder="Açıklama notunuzu buraya yazın...">${node.text || ''}</textarea>
                    </div>
                `;
                break;
        }

        openModal('modal-edit-node');
        setTimeout(() => {
            const firstInput = editBody.querySelector('input, textarea');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    if (btnSaveEdit) {
        btnSaveEdit.addEventListener('click', () => {
            if (!currentEditingNode) return;
            model.pushHistory();
            const node = currentEditingNode;

            switch (node.type) {
                case 'declare':
                    const nameInput = document.getElementById('edit-declare-name');
                    const activeBtn = editBody ? editBody.querySelector('.type-btn.active') : null;
                    if (nameInput) node.name = nameInput.value.trim();
                    if (activeBtn) node.dataType = activeBtn.getAttribute('data-type');
                    break;
                case 'assign':
                    const assignVar = document.getElementById('edit-assign-var');
                    const assignExpr = document.getElementById('edit-assign-expr');
                    if (assignVar) node.variable = assignVar.value.trim();
                    if (assignExpr) node.expression = assignExpr.value.trim();
                    break;
                case 'input':
                    const inputV = document.getElementById('edit-input-var');
                    if (inputV) node.variable = inputV.value.trim();
                    break;
                case 'output':
                    const outExpr = document.getElementById('edit-output-expr');
                    const outNl = document.getElementById('edit-output-nl');
                    if (outExpr) node.expression = outExpr.value.trim();
                    if (outNl) node.newline = outNl.checked;
                    break;
                case 'if':
                    const ifExpr = document.getElementById('edit-if-expr');
                    if (ifExpr) node.expression = ifExpr.value.trim();
                    break;
                case 'while':
                    const whileExpr = document.getElementById('edit-while-expr');
                    if (whileExpr) node.expression = whileExpr.value.trim();
                    break;
                case 'for':
                    const forVar = document.getElementById('edit-for-var');
                    const forStart = document.getElementById('edit-for-start');
                    const forEnd = document.getElementById('edit-for-end');
                    const forStep = document.getElementById('edit-for-step');
                    const activeDirBtn = editBody.querySelector('#for-direction-buttons .type-btn.active');
                    if (forVar) node.variable = forVar.value.trim();
                    if (forStart) node.start = forStart.value.trim();
                    if (forEnd) node.end = forEnd.value.trim();
                    if (forStep) node.step = forStep.value.trim();
                    if (activeDirBtn) node.direction = activeDirBtn.getAttribute('data-dir');
                    break;
                case 'call':
                    const callExpr = document.getElementById('edit-call-expr');
                    if (callExpr) node.expression = callExpr.value.trim();
                    break;
                case 'comment':
                    const commentText = document.getElementById('edit-comment-text');
                    if (commentText) node.text = commentText.value.trim();
                    break;
            }

            closeModal();
            renderer.render();
            updateCodeView();
            updateSelectionBadge();
            markProjectDirty();
        });
    }

    // 14. Clipboard & Selection Toolbar Actions
    if (btnCopy) {
        btnCopy.addEventListener('click', handleCopy);
    }

    if (btnCut) {
        btnCut.addEventListener('click', handleCut);
    }

    if (btnDelete) {
        btnDelete.addEventListener('click', async () => {
            if (model.selectedNodeIds.size === 0) {
                await showCustomAlert("Lütfen önce silmek istediğiniz bloğu/blokları seçin.", "Seçim Yapılmadı", "warning");
                return;
            }
            await confirmDeleteSelected();
        });
    }

    if (btnSelectAll) {
        btnSelectAll.addEventListener('click', handleSelectAll);
    }

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', async (e) => {
        // Prevent browser zoom shortcuts (Ctrl + Plus, Minus, Zero)
        if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '_' || e.key === '0')) {
            e.preventDefault();
        }

        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }

        if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
            if (model.selectedNodeIds.size > 0) {
                e.preventDefault();
                await handleCopy();
            }
        } else if (e.ctrlKey && (e.key === 'x' || e.key === 'X')) {
            if (model.selectedNodeIds.size > 0) {
                e.preventDefault();
                await handleCut();
            }
        } else if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
            if (model.clipboard) {
                e.preventDefault();
                let list = model.currentBody;
                let idx = list.length;
                if (model.selectedNodeId) {
                    const found = model.findNode(model.selectedNodeId);
                    if (found) {
                        list = found.parentList;
                        idx = found.parentList.findIndex(n => n.id === model.selectedNodeId) + 1;
                    }
                }
                const pasted = model.pasteNode(list, idx);
                renderer.render();
                updateCodeView();
                updateSelectionBadge();
                markProjectDirty();
                const label = Array.isArray(pasted) ? `${pasted.length} blok` : renderer.getNodeLabel(pasted);
                addConsoleLog(`[Pano] Yapıştırıldı (Ctrl+V): ${label}`, "system");
            }
        } else if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
            e.preventDefault();
            handleSelectAll();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            if (model.selectedNodeIds.size > 0) {
                e.preventDefault();
                await confirmDeleteSelected();
            }
        } else if (e.key === 'Escape') {
            closeContextMenu();
            model.clearSelection();
            renderer.render();
            updateSelectionBadge();
        } else if (e.key === 'F5') {
            e.preventDefault();
            btnRun.click();
        } else if (e.key === 'F10') {
            e.preventDefault();
            btnStep.click();
        }
    });

    // 15. Draggable Resizer Splitter
    if (sidebarResizer && sidebar) {
        let isResizing = false;

        const startResize = () => {
            isResizing = true;
            sidebarResizer.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        };

        const doResize = (clientX) => {
            if (!isResizing) return;
            const newWidth = document.body.clientWidth - clientX;
            if (newWidth >= 280 && newWidth <= document.body.clientWidth * 0.75) {
                sidebar.style.width = `${newWidth}px`;
            }
        };

        const stopResize = () => {
            if (isResizing) {
                isResizing = false;
                sidebarResizer.classList.remove('resizing');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };

        sidebarResizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startResize();
        });

        document.addEventListener('mousemove', (e) => doResize(e.clientX));
        document.addEventListener('mouseup', stopResize);

        sidebarResizer.addEventListener('touchstart', (e) => {
            if (e.touches[0]) startResize();
        });

        document.addEventListener('touchmove', (e) => {
            if (e.touches[0]) doResize(e.touches[0].clientX);
        });

        document.addEventListener('touchend', stopResize);
    }

    // 16. Function Management (Add, Edit, Delete, Switch)
    if (selectFunction) {
        selectFunction.addEventListener('change', () => {
            const chosen = selectFunction.value;
            model.selectFunction(chosen);
            renderer.render();
            updateCodeView();
            updateSelectionBadge();
        });
    }

    if (btnAddFunction) {
        btnAddFunction.addEventListener('click', () => {
            functionModalTitle.textContent = "Yeni Fonksiyon Ekle";
            fnOldNameInput.value = "";
            fnNameInput.value = "";
            fnReturnVarInput.value = "";
            fnReturnVarGroup.style.display = "none";
            btnDeleteFunction.style.display = "none";

            document.querySelectorAll('#fn-return-type-buttons .type-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('#fn-return-type-buttons .type-btn[data-type="None"]').classList.add('active');

            fnParamsList.innerHTML = '';
            openModal('modal-function-manager');
            setTimeout(() => {
                if (fnNameInput) fnNameInput.focus();
            }, 100);
        });
    }

    if (btnManageFunction) {
        btnManageFunction.addEventListener('click', () => {
            const cur = model.currentFunction;
            functionModalTitle.textContent = `Fonksiyonu Düzenle: ${cur.name}`;
            fnOldNameInput.value = cur.name;
            fnNameInput.value = cur.name;
            fnReturnVarInput.value = cur.variable || "";

            const isNone = (cur.type === 'None' || !cur.type);
            fnReturnVarGroup.style.display = isNone ? "none" : "block";

            btnDeleteFunction.style.display = (cur.name === 'Main') ? "none" : "block";

            document.querySelectorAll('#fn-return-type-buttons .type-btn').forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-type') === (cur.type || 'None'));
            });

            fnParamsList.innerHTML = '';
            (cur.parameters || []).forEach(p => addParamRow(p.name, p.type));

            openModal('modal-function-manager');
        });
    }

    document.querySelectorAll('#fn-return-type-buttons .type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#fn-return-type-buttons .type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.getAttribute('data-type');
            fnReturnVarGroup.style.display = (type === 'None') ? 'none' : 'block';
            if (type !== 'None' && !fnReturnVarInput.value) {
                fnReturnVarInput.focus();
            }
        });
    });

    function addParamRow(name = '', type = 'Integer') {
        const row = document.createElement('div');
        row.className = 'fn-param-row';
        row.innerHTML = `
            <input type="text" class="param-name" value="${name}" placeholder="Parametre adı...">
            <select class="param-type">
                <option value="Integer" ${type === 'Integer' ? 'selected' : ''}>Tamsayı</option>
                <option value="Real" ${type === 'Real' ? 'selected' : ''}>Reel</option>
                <option value="String" ${type === 'String' ? 'selected' : ''}>Metin</option>
                <option value="Boolean" ${type === 'Boolean' ? 'selected' : ''}>Mantıksal</option>
            </select>
            <button type="button" class="btn-remove-param" title="Sil">&times;</button>
        `;
        row.querySelector('.btn-remove-param').addEventListener('click', () => row.remove());
        fnParamsList.appendChild(row);
    }

    if (btnAddParam) {
        btnAddParam.addEventListener('click', () => addParamRow());
    }

    if (btnSaveFunction) {
        btnSaveFunction.addEventListener('click', async () => {
            const oldName = fnOldNameInput.value.trim();
            const name = fnNameInput.value.trim();
            if (!name) {
                await showCustomAlert("Lütfen fonksiyon adı giriniz.", "Eksik Bilgi", "warning");
                return;
            }

            const activeTypeBtn = document.querySelector('#fn-return-type-buttons .type-btn.active');
            const retType = activeTypeBtn ? activeTypeBtn.getAttribute('data-type') : 'None';
            const retVar = fnReturnVarInput.value.trim();

            // Kullanıcı İsteği: Geri dönüş tipi seçilmişse geri dönüş değişken adı zorunlu
            if (retType !== 'None' && !retVar) {
                await showCustomAlert("Lütfen geri dönüş değerinin aktarılacağı değişken adını giriniz (Örn: sonuc).", "Geri Dönüş Değişkeni", "warning");
                return;
            }

            const params = [];
            fnParamsList.querySelectorAll('.fn-param-row').forEach(row => {
                const pName = row.querySelector('.param-name').value.trim();
                const pType = row.querySelector('.param-type').value;
                if (pName) params.push({ name: pName, type: pType });
            });

            try {
                if (oldName) {
                    model.updateFunction(oldName, name, retType, retVar, params);
                } else {
                    model.addFunction(name, retType, retVar, params);
                }
                closeModal();
                updateFunctionDropdown();
                renderer.render();
                updateCodeView();
                updateSelectionBadge();
                markProjectDirty();
                addConsoleLog(`[Fonksiyon] "${name}" kaydedildi.`, "system");
            } catch (err) {
                await showCustomAlert("Hata: " + err.message, "Hata", "error");
            }
        });
    }

    if (btnDeleteFunction) {
        btnDeleteFunction.addEventListener('click', async () => {
            const name = fnOldNameInput.value.trim();
            if (!name || name === 'Main') return;
            const ok = await showCustomConfirm(`"${name}" fonksiyonunu silmek istediğinize emin misiniz?`, 'Fonksiyonu Sil', { danger: true, confirmText: 'Evet, Sil' });
            if (ok) {
                model.deleteFunction(name);
                closeModal();
                updateFunctionDropdown();
                renderer.render();
                updateCodeView();
                updateSelectionBadge();
                markProjectDirty();
                addConsoleLog(`[Fonksiyon] "${name}" silindi.`, "system-warning");
            }
        });
    }

    // 17. Touch Prompt Dialog
    if (btnSubmitInput) {
        btnSubmitInput.addEventListener('click', () => {
            const val = inputField ? inputField.value : '';
            closeModal();
            if (touchInputResolve) {
                touchInputResolve(val);
                touchInputResolve = null;
            }
        });
    }

    document.querySelectorAll('.numpad-key').forEach(key => {
        key.addEventListener('click', () => {
            if (!inputField) return;
            const action = key.getAttribute('data-key');
            if (action === 'back') {
                inputField.value = inputField.value.slice(0, -1);
            } else if (action === 'clear') {
                inputField.value = '';
            } else {
                inputField.value += action;
            }
            inputField.focus();
        });
    });

    if (inputField) {
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && btnSubmitInput) {
                btnSubmitInput.click();
            }
        });
    }

    // 18. Toolbar Execution Buttons
    if (btnRun) {
        btnRun.addEventListener('click', () => {
            if (interpreter.state === 'running') {
                interpreter.pause();
            } else if (interpreter.state === 'paused') {
                interpreter.resume();
            } else {
                switchSidebarTab('tab-console');
                interpreter.run();
            }
        });
    }

    if (btnStep) {
        btnStep.addEventListener('click', () => {
            switchSidebarTab('tab-console');
            interpreter.step();
        });
    }

    if (btnStop) {
        btnStop.addEventListener('click', () => {
            interpreter.stop();
        });
    }

    if (selectSpeed) {
        selectSpeed.addEventListener('change', () => {
            interpreter.setDelay(parseInt(selectSpeed.value, 10));
        });
    }

    // 19. Sidebar Tabs
    document.querySelectorAll('.sidebar-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetPaneId = tab.getAttribute('data-tab');
            switchSidebarTab(targetPaneId);
        });
    });

    if (codeLangSelect) {
        codeLangSelect.addEventListener('change', updateCodeView);
    }

    // 20. Examples Dropdown
    if (selectExample && typeof Examples !== 'undefined') {
        selectExample.innerHTML = '<option value="" selected>Bir örnek seçin...</option>';
        Examples.forEach((ex, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = ex.title;
            selectExample.appendChild(opt);
        });

        selectExample.addEventListener('change', async () => {
            const idx = parseInt(selectExample.value, 10);
            if (!isNaN(idx) && Examples[idx]) {
                const warningMsg = isProjectDirty
                    ? `Kaydedilmemiş değişiklikleriniz var! "${Examples[idx].title}" örneğini yüklerseniz mevcut çalışmanız kaybolacaktır.\n\nKaydetmeden devam etmek istediğinize emin misiniz?`
                    : `"${Examples[idx].title}" örneği yüklensin mi? (Mevcut şemanız temizlenecektir)`;
                const ok = await showCustomConfirm(warningMsg, 'Örnek Yükle', { confirmText: 'Yükle', danger: isProjectDirty });
                if (ok) {
                    Examples[idx].setup(model);
                    updateFunctionDropdown();
                    renderer.render();
                    updateCodeView();
                    clearConsole();
                    updateVariablesTable({});
                    updateSelectionBadge();
                    markProjectClean();
                } else {
                    selectExample.value = "";
                }
            }
        });
    }

    // 21. File Operations & Help Guide Dialogs
    if (btnFileMenu) {
        btnFileMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            openModal('modal-file-operations');
        });
    }

    if (btnHelp) {
        btnHelp.addEventListener('click', (e) => {
            e.stopPropagation();
            closeModal();
            openModal('modal-help-guide');
        });
    }

    if (btnNew) {
        btnNew.addEventListener('click', async () => {
            closeModal();
            const msg = isProjectDirty
                ? 'Kaydedilmemiş değişiklikleriniz var! Yeni bir akış şeması açarsanız mevcut çalışmanız silinecektir.\n\nKaydetmeden devam etmek istediğinize emin misiniz?'
                : 'Yeni bir boş akış şeması oluşturmak istediğinize emin misiniz? Mevcut şemanız sıfırlanacaktır.';
            const ok = await showCustomConfirm(msg, 'Yeni Şema', { confirmText: 'Yeni Oluştur', danger: isProjectDirty });
            if (ok) {
                model.reset();
                updateFunctionDropdown();
                renderer.render();
                updateCodeView();
                clearConsole();
                updateVariablesTable({});
                updateSelectionBadge();
                markProjectClean();
                currentProjectFileName = 'algoritma.fprg';
                addConsoleLog("Yeni boş akış şeması oluşturuldu.", "system");
            }
        });
    }

    if (btnOpen && fileInput) {
        btnOpen.addEventListener('click', async () => {
            closeModal();
            if (isProjectDirty) {
                const ok = await showCustomConfirm(
                    'Kaydedilmemiş değişiklikleriniz var! Başka bir dosya açarsanız mevcut çalışmanız silinecektir.\n\nKaydetmeden devam etmek istediğinize emin misiniz?',
                    'Kaydedilmemiş Değişiklikler',
                    { confirmText: 'Kaydetmeden Dosya Aç', danger: true }
                );
                if (!ok) return;
            }
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (evt) => {
                const content = evt.target.result;
                try {
                    FprgParser.parse(content, model);
                    updateFunctionDropdown();
                    renderer.render();
                    updateCodeView();
                    clearConsole();
                    updateVariablesTable({});
                    updateSelectionBadge();
                    markProjectClean();
                    currentProjectFileName = file.name || 'algoritma.fprg';
                    await showCustomAlert(`"${file.name}" başarıyla yüklendi!`, "Dosya Yüklendi", "success");
                } catch (err) {
                    await showCustomAlert("Dosya yüklenirken hata oluştu: " + err.message, "Dosya Hatası", "error");
                }
            };
            reader.readAsText(file);
            fileInput.value = '';
        });
    }

    // 21. File Save Operation (Native File Picker + Graceful Fallback)
    async function handleSaveFprg() {
        closeModal();
        try {
            const xml = FprgParser.export(model);
            let suggested = currentProjectFileName || 'algoritma.fprg';
            if (!suggested.toLowerCase().endsWith('.fprg')) suggested += '.fprg';

            // 1. Try modern File System Access API (Native Windows / OS Save As dialog)
            if (typeof window.showSaveFilePicker === 'function') {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: suggested,
                        types: [{
                            description: 'Flowgorithm Projesi (*.fprg)',
                            accept: {
                                'application/xml': ['.fprg', '.xml']
                            }
                        }]
                    });
                    const writable = await handle.createWritable();
                    await writable.write(xml);
                    await writable.close();
                    currentProjectFileName = handle.name || suggested;
                    markProjectClean();
                    addConsoleLog(`[Dosya] Akış şeması '${currentProjectFileName}' olarak kaydedildi.`, "system-success");
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') {
                        // User explicitly clicked "Cancel" in the native save window
                        return;
                    }
                    console.warn("showSaveFilePicker kullanılamadı veya engellendi, klasik indirmeye geçiliyor:", err);
                }
            }

            // 2. Standard fallback:
            const blob = new Blob([xml], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = suggested;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            markProjectClean();
            addConsoleLog(`[Dosya] Akış şeması '${suggested}' olarak kaydedildi.`, "system-success");
        } catch (err) {
            showCustomAlert("Dosya kaydedilirken hata oluştu: " + err.message, "Kaydetme Hatası", "error");
        }
    }

    if (btnSaveFprg) {
        btnSaveFprg.addEventListener('click', handleSaveFprg);
    }

    // Hakkında (About) Modal
    const btnAbout = document.getElementById('btn-about');
    if (btnAbout) {
        btnAbout.addEventListener('click', (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            closeModal();
            openModal('modal-about');
        });
    }

    // Global Keyboard Shortcuts (Ctrl+S: Save, Ctrl+Z: Undo, Ctrl+Y: Redo)
    window.addEventListener('keydown', (e) => {
        const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        const isEditingText = tag === 'input' || tag === 'textarea';

        // Ctrl + S (Save)
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            handleSaveFprg();
            return;
        }

        // Ctrl + Z (Undo)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
            if (isEditingText) return; // Allow native input undo when typing
            e.preventDefault();
            if (model.undo()) {
                updateFunctionDropdown();
                renderer.render();
                updateCodeView();
                updateSelectionBadge();
                markProjectDirty();
                addConsoleLog("[Geri Al] Son işlem geri alındı (Ctrl+Z).", "system");
            }
            return;
        }

        // Ctrl + Y or Ctrl + Shift + Z (Redo)
        if ((e.ctrlKey || e.metaKey) && ((e.key === 'y' || e.key === 'Y') || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))) {
            if (isEditingText) return; // Allow native input redo when typing
            e.preventDefault();
            if (model.redo()) {
                updateFunctionDropdown();
                renderer.render();
                updateCodeView();
                updateSelectionBadge();
                markProjectDirty();
                addConsoleLog("[İleri Al] Geri alınan işlem tekrar uygulandı (Ctrl+Y).", "system");
            }
            return;
        }
    });

    // 22. Zoom Controls (1/3 hassasiyet: 0.025)
    if (btnZoomIn) btnZoomIn.addEventListener('click', () => renderer.zoom(0.025));
    if (btnZoomOut) btnZoomOut.addEventListener('click', () => renderer.zoom(-0.025));
    if (btnZoomReset) btnZoomReset.addEventListener('click', () => renderer.resetZoom());

    // 23. Theme Switcher (10 Flowgorithm Themes)
    const selectTheme = document.getElementById('select-theme');
    const btnThemeFab = document.getElementById('btn-theme-fab');
    const themeIcons = {
        classic: '🎨',
        dark: '🌙',
        pastel: '🌸',
        print: '📄',
        neon: '⚡',
        retro: '📻',
        ocean: '🌊',
        sunset: '🌅',
        blueprint: '📐',
        couture: '💎'
    };

    function applyTheme(themeName) {
        if (!themeName) themeName = 'dark';
        if (themeName === 'flowgorithm') themeName = 'classic';
        document.documentElement.setAttribute('data-theme', themeName);
        document.body.setAttribute('data-theme', themeName);
        if (selectTheme) selectTheme.value = themeName;
        if (btnThemeFab) {
            btnThemeFab.textContent = themeIcons[themeName] || '🎨';
            btnThemeFab.title = `Renk Teması Seç (Mevcut: ${themeName})`;
        }
        try {
            localStorage.setItem('etapgorithm_theme', themeName);
        } catch(e) {}
        if (typeof renderer !== 'undefined' && renderer && typeof renderer.render === 'function') {
            renderer.render();
        }
    }

    if (selectTheme) {
        selectTheme.addEventListener('change', () => {
            applyTheme(selectTheme.value);
        });
    }

    try {
        const savedTheme = localStorage.getItem('etapgorithm_theme') || 'dark';
        applyTheme(savedTheme);
    } catch(e) {}

    // 23. Sidebar & Fullscreen Toggles
    if (btnToggleSidebar && sidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            if (!document.documentElement) return;
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => showCustomAlert(err.message, "Tam Ekran Hatası", "error"));
            } else {
                document.exitFullscreen();
            }
        });
    }

    // 24. Clean Initial Blank Setup (Başla -> [+] -> Dur)
    try {
        model.reset();
        updateFunctionDropdown();
        renderer.render();
        updateCodeView();
        updateSelectionBadge();
    } catch (err) {
        console.error("Başlangıç yükleme hatası:", err);
    }
});
