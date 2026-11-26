/**
 * Etapgorithm - Flowchart Model & SVG Renderer
 * MEB Pardus ETAP Akıllı Tahta Uyumlu Akış Şeması Motoru
 * (Ferah Dikey Aralık, Çoklu Fonksiyon ve Gelişmiş Pano Desteği)
 */

class FlowchartModel {
    constructor() {
        this.nextId = 1;
        this.clipboard = null;
        this.clipboardIsCut = false;
        this.clipboardCutId = null;
        this.clipboardCutIds = null;
        this.selectedNodeIds = new Set();

        // Functions Map: Default "Main"
        this.functions = {
            "Main": {
                name: "Main",
                displayName: "Ana Program (Main)",
                type: "None", // None, Integer, Real, String, Boolean
                variable: "", // Return variable name
                parameters: [], // [ { name: "x", type: "Integer" } ]
                body: []
            }
        };
        this.currentFunctionName = "Main";
        this.history = [];
        this.future = [];
    }

    pushHistory() {
        if (!this.history) this.history = [];
        if (!this.future) this.future = [];
        try {
            const state = JSON.stringify({
                functions: this.functions,
                currentFunctionName: this.currentFunctionName,
                nextId: this.nextId
            });
            if (this.history.length > 0 && this.history[this.history.length - 1] === state) {
                return;
            }
            this.history.push(state);
            if (this.history.length > 50) this.history.shift();
            this.future = [];
        } catch(e) {}
    }

    undo() {
        if (!this.history || this.history.length === 0) return false;
        try {
            const currentState = JSON.stringify({
                functions: this.functions,
                currentFunctionName: this.currentFunctionName,
                nextId: this.nextId
            });
            if (!this.future) this.future = [];
            this.future.push(currentState);

            const prevState = JSON.parse(this.history.pop());
            this.functions = prevState.functions;
            this.currentFunctionName = prevState.currentFunctionName;
            this.nextId = prevState.nextId;
            this.selectedNodeIds.clear();
            return true;
        } catch(e) {
            return false;
        }
    }

    redo() {
        if (!this.future || this.future.length === 0) return false;
        try {
            const currentState = JSON.stringify({
                functions: this.functions,
                currentFunctionName: this.currentFunctionName,
                nextId: this.nextId
            });
            if (!this.history) this.history = [];
            this.history.push(currentState);

            const nextState = JSON.parse(this.future.pop());
            this.functions = nextState.functions;
            this.currentFunctionName = nextState.currentFunctionName;
            this.nextId = nextState.nextId;
            this.selectedNodeIds.clear();
            return true;
        } catch(e) {
            return false;
        }
    }

    generateId(prefix = 'node_') {
        return prefix + (this.nextId++);
    }

    get selectedNodeId() {
        if (this.selectedNodeIds.size === 0) return null;
        const arr = Array.from(this.selectedNodeIds);
        return arr[arr.length - 1];
    }

    set selectedNodeId(id) {
        this.selectedNodeIds.clear();
        if (id) this.selectedNodeIds.add(id);
    }

    isSelected(id) {
        return this.selectedNodeIds.has(id);
    }

    selectNode(id, multi = false) {
        if (!multi) {
            this.selectedNodeIds.clear();
            if (id) this.selectedNodeIds.add(id);
        } else {
            if (this.selectedNodeIds.has(id)) {
                this.selectedNodeIds.delete(id);
            } else {
                this.selectedNodeIds.add(id);
            }
        }
    }

    selectAll() {
        this.selectedNodeIds.clear();
        const collect = (list) => {
            for (const n of list) {
                this.selectedNodeIds.add(n.id);
                if (n.then) collect(n.then);
                if (n.else) collect(n.else);
                if (n.body) collect(n.body);
            }
        };
        collect(this.currentBody);
    }

    clearSelection() {
        this.selectedNodeIds.clear();
    }

    deleteSelectedNodes() {
        const ids = Array.from(this.selectedNodeIds);
        let count = 0;
        for (const id of ids) {
            if (this.deleteNode(id)) count++;
        }
        this.selectedNodeIds.clear();
        return count;
    }

    get currentFunction() {
        return this.functions[this.currentFunctionName] || this.functions["Main"];
    }

    get currentBody() {
        return this.currentFunction.body;
    }

    get program() {
        return this.functions["Main"];
    }

    reset() {
        this.nextId = 1;
        this.selectedNodeIds.clear();
        this.clipboard = null;
        this.clipboardIsCut = false;
        this.clipboardCutId = null;
        this.clipboardCutIds = null;
        this.functions = {
            "Main": {
                name: "Main",
                displayName: "Ana Program (Main)",
                type: "None",
                variable: "",
                parameters: [],
                body: []
            }
        };
        this.currentFunctionName = "Main";
        this.history = [];
        this.future = [];
    }

    addFunction(name, type = 'None', variable = '', parameters = []) {
        if (!name || name.trim() === '') throw new Error("Fonksiyon adı boş olamaz.");
        const cleanName = name.trim();
        if (this.functions[cleanName]) throw new Error(`"${cleanName}" adında bir fonksiyon zaten var.`);

        const fnObj = {
            name: cleanName,
            displayName: cleanName,
            type: type || 'None',
            variable: variable ? variable.trim() : '',
            parameters: parameters || [],
            body: []
        };

        // Kullanıcı İsteği: Fonksiyon oluşturulduktan sonra geri dönüş tipi seçilmişse,
        // fonksiyonun içinde o isimde ve tipte bir tanımlama (declare) değişkeni otomatik oluşturulsun.
        if (type && type !== 'None' && variable && variable.trim() !== '') {
            fnObj.body.push(this.createNode('declare', {
                name: variable.trim(),
                dataType: type
            }));
        }

        this.functions[cleanName] = fnObj;
        this.currentFunctionName = cleanName;
        return fnObj;
    }

    updateFunction(oldName, newName, type, variable, parameters) {
        if (!oldName || !this.functions[oldName]) return;
        const fn = this.functions[oldName];
        const oldType = fn.type;
        const oldVar = fn.variable;

        fn.type = type || 'None';
        fn.variable = variable ? variable.trim() : '';
        fn.parameters = parameters || [];

        // Geri dönüş değişkenini gövdede güncelle veya ekle
        if (type && type !== 'None' && fn.variable) {
            const existingDecl = fn.body.find(n => n.type === 'declare' && n.name === (oldVar || fn.variable));
            if (existingDecl) {
                existingDecl.name = fn.variable;
                existingDecl.dataType = type;
            } else {
                fn.body.unshift(this.createNode('declare', {
                    name: fn.variable,
                    dataType: type
                }));
            }
        }

        if (oldName !== 'Main' && newName && newName.trim() !== '' && newName !== oldName) {
            const cleanNew = newName.trim();
            if (this.functions[cleanNew]) throw new Error(`"${cleanNew}" adında bir fonksiyon zaten var.`);
            fn.name = cleanNew;
            fn.displayName = cleanNew;
            delete this.functions[oldName];
            this.functions[cleanNew] = fn;
            if (this.currentFunctionName === oldName) {
                this.currentFunctionName = cleanNew;
            }
        }
    }

    deleteFunction(name) {
        if (name === 'Main') {
            throw new Error("Ana Program (Main) silinemez.");
        }
        if (this.functions[name]) {
            delete this.functions[name];
            this.currentFunctionName = 'Main';
            return true;
        }
        return false;
    }

    selectFunction(name) {
        if (this.functions[name]) {
            this.currentFunctionName = name;
            this.selectedNodeIds.clear();
            return true;
        }
        return false;
    }

    createNode(type, props = {}) {
        const id = this.generateId();
        const base = { id, type };

        // Kullanıcı İsteği: Oluşturulan her değişkende otomatik isim veya açıklama notu yazması
        // çok can sıkıcı. Hiçbir input alanında varsayılan değer olmasın (tamamen boş gelsin).
        switch (type) {
            case 'declare':
                return {
                    ...base,
                    name: props.name !== undefined ? props.name : '',
                    dataType: props.dataType || 'Integer', // Integer, Real, String, Boolean
                    isArray: props.isArray || false,
                    arraySize: props.arraySize || ''
                };
            case 'assign':
                return {
                    ...base,
                    variable: props.variable !== undefined ? props.variable : '',
                    expression: props.expression !== undefined ? props.expression : ''
                };
            case 'input':
                return {
                    ...base,
                    variable: props.variable !== undefined ? props.variable : ''
                };
            case 'output':
                return {
                    ...base,
                    expression: props.expression !== undefined ? props.expression : '',
                    newline: props.newline !== undefined ? props.newline : true
                };
            case 'if':
                return {
                    ...base,
                    expression: props.expression !== undefined ? props.expression : '',
                    then: props.then || [],
                    else: props.else || []
                };
            case 'while':
                return {
                    ...base,
                    expression: props.expression !== undefined ? props.expression : '',
                    body: props.body || []
                };
            case 'for':
                return {
                    ...base,
                    variable: props.variable !== undefined ? props.variable : '',
                    start: props.start !== undefined ? props.start : '',
                    end: props.end !== undefined ? props.end : '',
                    step: props.step !== undefined ? props.step : '1',
                    direction: props.direction || 'inc', // 'inc' or 'dec'
                    body: props.body || []
                };
            case 'do':
                return {
                    ...base,
                    expression: props.expression !== undefined ? props.expression : '',
                    body: props.body || []
                };
            case 'comment':
                return {
                    ...base,
                    text: props.text !== undefined ? props.text : ''
                };
            case 'call':
                return {
                    ...base,
                    expression: props.expression !== undefined ? props.expression : ''
                };
            default:
                return base;
        }
    }

    // Find node by ID recursively across current body or all functions
    findNode(id, list = this.currentBody) {
        for (const item of list) {
            if (item.id === id) return { node: item, parentList: list };
            if (item.type === 'if') {
                const foundThen = this.findNode(id, item.then);
                if (foundThen) return foundThen;
                const foundElse = this.findNode(id, item.else);
                if (foundElse) return foundElse;
            } else if (item.type === 'while' || item.type === 'for' || item.type === 'do') {
                const foundBody = this.findNode(id, item.body);
                if (foundBody) return foundBody;
            }
        }
        return null;
    }

    insertNode(node, parentList, index) {
        this.pushHistory();
        if (!parentList) parentList = this.currentBody;
        if (index === undefined || index < 0) {
            parentList.push(node);
        } else {
            parentList.splice(index, 0, node);
        }
    }

    deleteNode(id) {
        this.pushHistory();
        const found = this.findNode(id);
        if (found) {
            const idx = found.parentList.findIndex(n => n.id === id);
            if (idx !== -1) {
                found.parentList.splice(idx, 1);
                this.selectedNodeIds.delete(id);
                return true;
            }
        }
        return false;
    }

    // Clipboard: Copy, Cut, Paste (Single and Multi-selection)
    copyNode(id) {
        const found = this.findNode(id);
        if (found) {
            this.clipboard = JSON.parse(JSON.stringify(found.node));
            this.clipboardIsCut = false;
            this.clipboardCutId = null;
            this.clipboardCutIds = null;
            return true;
        }
        return false;
    }

    cutNode(id) {
        const found = this.findNode(id);
        if (found) {
            this.clipboard = JSON.parse(JSON.stringify(found.node));
            this.clipboardIsCut = true;
            this.clipboardCutId = id;
            this.clipboardCutIds = null;
            return true;
        }
        return false;
    }

    copySelected() {
        if (this.selectedNodeIds.size === 0) return false;
        if (this.selectedNodeIds.size === 1) {
            return this.copyNode(this.selectedNodeId);
        }
        const list = [];
        const collect = (body) => {
            for (const n of body) {
                if (this.selectedNodeIds.has(n.id)) {
                    list.push(JSON.parse(JSON.stringify(n)));
                }
                if (n.then) collect(n.then);
                if (n.else) collect(n.else);
                if (n.body) collect(n.body);
            }
        };
        collect(this.currentBody);
        if (list.length === 0) return false;
        this.clipboard = list;
        this.clipboardIsCut = false;
        this.clipboardCutId = null;
        this.clipboardCutIds = null;
        return true;
    }

    cutSelected() {
        if (this.selectedNodeIds.size === 0) return false;
        if (this.selectedNodeIds.size === 1) {
            return this.cutNode(this.selectedNodeId);
        }
        if (this.copySelected()) {
            this.clipboardIsCut = true;
            this.clipboardCutIds = Array.from(this.selectedNodeIds);
            return true;
        }
        return false;
    }

    pasteNode(parentList, index) {
        if (!this.clipboard) return null;
        if (!parentList) parentList = this.currentBody;
        if (index === undefined || index < 0) index = parentList.length;

        // Kesilmiş blokları sil
        if (this.clipboardIsCut) {
            if (this.clipboardCutId) {
                this.deleteNode(this.clipboardCutId);
                this.clipboardCutId = null;
            }
            if (this.clipboardCutIds) {
                for (const cid of this.clipboardCutIds) {
                    this.deleteNode(cid);
                }
                this.clipboardCutIds = null;
            }
            this.clipboardIsCut = false;
        }

        if (Array.isArray(this.clipboard)) {
            const clonedList = this.clipboard.map(n => this.cloneNodeWithNewIds(n));
            parentList.splice(index, 0, ...clonedList);
            this.selectedNodeIds.clear();
            clonedList.forEach(cn => this.selectedNodeIds.add(cn.id));
            return clonedList;
        } else {
            const cloned = this.cloneNodeWithNewIds(this.clipboard);
            parentList.splice(index, 0, cloned);
            this.selectedNodeId = cloned.id;
            return cloned;
        }
    }

    cloneNodeWithNewIds(node) {
        const clone = JSON.parse(JSON.stringify(node));
        const reassign = (n) => {
            n.id = this.generateId();
            if (n.then) n.then.forEach(reassign);
            if (n.else) n.else.forEach(reassign);
            if (n.body) n.body.forEach(reassign);
        };
        reassign(clone);
        return clone;
    }
}

/**
 * SVG Renderer for Flowcharts
 * Ferah Dikey Boşluk (vGap: 70px) ve Titremesiz Akıllı Tahta Arayüzü
 */
class FlowchartRenderer {
    constructor(svgElement, model, options = {}) {
        this.svg = svgElement;
        this.model = model;
        this.options = {
            nodeWidth: 190,
            nodeHeight: 60,
            vGap: 70, // Ferah, geniş dikey aralık
            hGap: 60,
            plusRadius: 13,
            ...options
        };
        this.activeNodeId = null;
        let initialScale = 1.0;
        try {
            if (typeof localStorage !== 'undefined') {
                const saved = parseFloat(localStorage.getItem('flowchart_zoom_scale'));
                if (!isNaN(saved) && saved >= 0.4 && saved <= 2.5) {
                    initialScale = saved;
                }
            }
        } catch(e) {}
        this.scale = initialScale;
        this.pan = { x: 0, y: 0 };
    }

    getNodeLabel(node) {
        switch (node.type) {
            case 'declare':
                const typeTr = {
                    'Integer': 'Tamsayı',
                    'Real': 'Reel',
                    'String': 'Metin',
                    'Boolean': 'Mantıksal'
                }[node.dataType] || node.dataType;
                return node.name ? `${typeTr} ${node.name}${node.isArray ? `[${node.arraySize}]` : ''}` : `Tanımla (${typeTr})`;
            case 'assign':
                return (node.variable || node.expression) ? `${node.variable || '?'} = ${node.expression || '?'}` : 'Atama';
            case 'input':
                return node.variable ? `Girdi: ${node.variable}` : 'Girdi';
            case 'output':
                return node.expression ? `Çıktı: ${node.expression}` : 'Çıktı';
            case 'if':
                return node.expression || 'Eğer (?)';
            case 'while':
                return node.expression ? `İken: ${node.expression}` : 'İken (?)';
            case 'for':
                const dirStr = node.direction === 'dec' ? 'Azalan' : 'Artan';
                const stepStr = (node.step && node.step !== '1') ? `, Adım: ${node.step}` : '';
                return node.variable ? `İçin ${node.variable} = ${node.start || '0'} .. ${node.end || '0'} (${dirStr}${stepStr})` : 'İçin (?)';
            case 'do':
                return node.expression ? `Yap İken: ${node.expression}` : 'Yap İken (?)';
            case 'comment':
                return node.text ? `// ${node.text}` : '// Açıklama';
            case 'call':
                return node.expression ? `Çağır: ${node.expression}` : 'Çağır';
            default:
                return node.type;
        }
    }

    measureNode(node) {
        const { nodeWidth, nodeHeight, vGap, hGap } = this.options;
        if (node.type === 'if') {
            const thenLayout = this.layoutList(node.then);
            const elseLayout = this.layoutList(node.else);
            const branchWidth = Math.max(thenLayout.width, nodeWidth) + Math.max(elseLayout.width, nodeWidth) + hGap;
            const branchHeight = Math.max(thenLayout.height, elseLayout.height);
            return {
                node,
                width: Math.max(branchWidth, nodeWidth + 90),
                height: nodeHeight + vGap + branchHeight + vGap + 30,
                thenLayout,
                elseLayout
            };
        } else if (node.type === 'while' || node.type === 'for' || node.type === 'do') {
            const bodyLayout = this.layoutList(node.body);
            const w = Math.max(bodyLayout.width + 130, nodeWidth + 70);
            return {
                node,
                width: w,
                height: nodeHeight + vGap + bodyLayout.height + vGap + 40,
                bodyLayout
            };
        } else {
            return {
                node,
                width: nodeWidth,
                height: nodeHeight
            };
        }
    }

    layoutList(list) {
        const { nodeWidth, nodeHeight, vGap } = this.options;
        let w = nodeWidth;
        let h = vGap;
        const items = [];

        for (let i = 0; i < list.length; i++) {
            const m = this.measureNode(list[i]);
            items.push(m);
            if (m.width > w) w = m.width;
            h += m.height + vGap;
        }

        return { items, width: w, height: h };
    }

    render() {
        const { nodeWidth, nodeHeight, vGap } = this.options;

        this.svg.innerHTML = '';

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" class="flow-arrow" />
            </marker>
            <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.2" />
            </filter>
        `;
        this.svg.appendChild(defs);

        const mainG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        mainG.setAttribute('id', 'canvas-group');
        this.svg.appendChild(mainG);

        const curFunc = this.model.currentFunction;
        const isMain = curFunc.name === 'Main';

        let startLabel = 'Başla';
        if (!isMain) {
            const paramsStr = (curFunc.parameters || []).map(p => `${p.name}: ${p.type}`).join(', ');
            startLabel = `${curFunc.name}(${paramsStr})`;
        }

        let endLabel = 'Dur';
        if (!isMain) {
            endLabel = curFunc.variable ? `Dönüş: ${curFunc.variable}` : 'Dönüş';
        }

        const listLayout = this.layoutList(curFunc.body);
        const totalW = Math.max(listLayout.width + 240, 650);
        const centerX = totalW / 2;

        let curY = 40;

        // Start Oval
        this.renderStartEnd(mainG, centerX, curY, startLabel, 'start');
        curY += nodeHeight;

        // First insertion point (Line drawn first, plus drawn ON TOP)
        this.renderLine(mainG, centerX, curY, centerX, curY + vGap, true);
        this.renderPlus(mainG, centerX, curY + vGap / 2, curFunc.body, 0);
        curY += vGap;

        // Statements
        curY = this.renderStatementList(mainG, curFunc.body, centerX, curY);

        // End Oval
        this.renderStartEnd(mainG, centerX, curY, endLabel, 'end');
        curY += nodeHeight + 80;

        this.totalBounds = { width: totalW, height: curY };
        this.updateTransform();
    }

    renderStatementList(parentG, list, centerX, startY) {
        const { nodeWidth, nodeHeight, vGap } = this.options;
        let curY = startY;

        for (let i = 0; i < list.length; i++) {
            const node = list[i];
            const nodeBottomY = this.renderNodeItem(parentG, node, centerX, curY, list, i);
            curY = nodeBottomY;

            // Line drawn first, plus drawn ON TOP
            this.renderLine(parentG, centerX, curY, centerX, curY + vGap, true);
            this.renderPlus(parentG, centerX, curY + vGap / 2, list, i + 1);
            curY += vGap;
        }

        return curY;
    }

    renderNodeItem(parentG, node, centerX, curY, parentList, index) {
        const { nodeWidth, nodeHeight, vGap } = this.options;

        if (node.type === 'if') {
            return this.renderIfNode(parentG, node, centerX, curY, parentList, index);
        } else if (node.type === 'while' || node.type === 'for') {
            return this.renderLoopNode(parentG, node, centerX, curY, parentList, index);
        } else {
            this.renderStandardShape(parentG, node, centerX, curY);
            return curY + nodeHeight;
        }
    }

    renderStandardShape(parentG, node, centerX, topY) {
        const { nodeWidth, nodeHeight } = this.options;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const isSelected = this.model.isSelected(node.id);
        g.setAttribute('class', `node-group node-${node.type} ${isSelected ? 'selected' : ''} ${node.id === this.activeNodeId ? 'executing' : ''}`);
        g.setAttribute('data-id', node.id);

        const leftX = centerX - nodeWidth / 2;
        const label = this.getNodeLabel(node);

        let shape;
        if (node.type === 'input') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const skew = 18;
            shape.setAttribute('points', `${leftX + skew},${topY} ${leftX + nodeWidth},${topY} ${leftX + nodeWidth - skew},${topY + nodeHeight} ${leftX},${topY + nodeHeight}`);
            shape.setAttribute('class', 'shape shape-input');
        } else if (node.type === 'output') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const skew = 18;
            shape.setAttribute('points', `${leftX},${topY} ${leftX + nodeWidth - skew},${topY} ${leftX + nodeWidth},${topY + nodeHeight} ${leftX + skew},${topY + nodeHeight}`);
            shape.setAttribute('class', 'shape shape-output');
        } else if (node.type === 'declare') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', leftX);
            shape.setAttribute('y', topY);
            shape.setAttribute('width', nodeWidth);
            shape.setAttribute('height', nodeHeight);
            shape.setAttribute('rx', 6);
            shape.setAttribute('class', 'shape shape-declare');
        } else if (node.type === 'assign') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', leftX);
            shape.setAttribute('y', topY);
            shape.setAttribute('width', nodeWidth);
            shape.setAttribute('height', nodeHeight);
            shape.setAttribute('rx', 6);
            shape.setAttribute('class', 'shape shape-assign');
        } else if (node.type === 'comment') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', leftX);
            shape.setAttribute('y', topY);
            shape.setAttribute('width', nodeWidth);
            shape.setAttribute('height', nodeHeight);
            shape.setAttribute('rx', 4);
            shape.setAttribute('stroke-dasharray', '5,5');
            shape.setAttribute('class', 'shape shape-comment');
        } else if (node.type === 'call') {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', leftX);
            shape.setAttribute('y', topY);
            shape.setAttribute('width', nodeWidth);
            shape.setAttribute('height', nodeHeight);
            shape.setAttribute('rx', 6);
            shape.setAttribute('class', 'shape shape-call');
        } else {
            shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            shape.setAttribute('x', leftX);
            shape.setAttribute('y', topY);
            shape.setAttribute('width', nodeWidth);
            shape.setAttribute('height', nodeHeight);
            shape.setAttribute('rx', 6);
            shape.setAttribute('class', 'shape shape-default');
        }

        shape.setAttribute('filter', 'url(#shadow)');
        g.appendChild(shape);

        // Badge text
        const typeBadge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        typeBadge.setAttribute('x', leftX + 12);
        typeBadge.setAttribute('y', topY + 16);
        typeBadge.setAttribute('class', 'badge-text');
        const badgeMap = {
            'declare': 'TANIMLA',
            'assign': 'ATAMA',
            'input': 'GİRDİ',
            'output': 'ÇIKTI',
            'comment': 'NOT',
            'call': 'ÇAĞIR'
        };
        typeBadge.textContent = badgeMap[node.type] || node.type.toUpperCase();
        g.appendChild(typeBadge);

        // Text label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', centerX);
        text.setAttribute('y', topY + nodeHeight / 2 + 7);
        text.setAttribute('class', 'node-text');
        text.textContent = this.truncateText(label, 22);
        g.appendChild(text);

        // Action Buttons: Copy, Cut, Delete (Jitter-free)
        const actionsGroup = this.createNodeActions(node, leftX + nodeWidth, topY);
        g.appendChild(actionsGroup);

        // Click / Multi-select
        g.addEventListener('click', (e) => {
            if (e.target.closest('.node-action-btn')) return;
            e.stopPropagation();
            const isMulti = e.ctrlKey || e.metaKey || e.shiftKey;
            this.model.selectNode(node.id, isMulti);
            this.render();
            if (this.onNodeClick) this.onNodeClick(node);
        });

        // Double click to edit
        g.addEventListener('dblclick', (e) => {
            if (e.target.closest('.node-action-btn')) return;
            e.stopPropagation();
            if (this.onNodeDblClick) this.onNodeDblClick(node);
        });

        // Right-Click Context Menu
        g.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!this.model.isSelected(node.id)) {
                this.model.selectNode(node.id, false);
                this.render();
            }
            if (this.onContextMenu) this.onContextMenu(e, { type: 'node', node });
        });

        parentG.appendChild(g);
    }

    renderIfNode(parentG, node, centerX, topY, parentList, index) {
        const { nodeWidth, nodeHeight, vGap, hGap } = this.options;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const isSelected = this.model.isSelected(node.id);
        g.setAttribute('class', `node-group node-if ${isSelected ? 'selected' : ''} ${node.id === this.activeNodeId ? 'executing' : ''}`);
        g.setAttribute('data-id', node.id);

        const diamondH = nodeHeight + 10;
        const diamondW = nodeWidth;

        const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        diamond.setAttribute('points', `${centerX},${topY} ${centerX + diamondW / 2},${topY + diamondH / 2} ${centerX},${topY + diamondH} ${centerX - diamondW / 2},${topY + diamondH / 2}`);
        diamond.setAttribute('class', 'shape shape-if');
        diamond.setAttribute('filter', 'url(#shadow)');
        g.appendChild(diamond);

        const typeBadge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        typeBadge.setAttribute('x', centerX);
        typeBadge.setAttribute('y', topY + 16);
        typeBadge.setAttribute('class', 'badge-text center-badge');
        typeBadge.textContent = 'EĞER (IF)';
        g.appendChild(typeBadge);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', centerX);
        text.setAttribute('y', topY + diamondH / 2 + 5);
        text.setAttribute('class', 'node-text if-text');
        text.textContent = this.truncateText(node.expression || 'Eğer (?)', 18);
        g.appendChild(text);

        const actionsGroup = this.createNodeActions(node, centerX + diamondW / 2 + 8, topY);
        g.appendChild(actionsGroup);

        g.addEventListener('click', (e) => {
            if (e.target.closest('.node-action-btn')) return;
            e.stopPropagation();
            const isMulti = e.ctrlKey || e.metaKey || e.shiftKey;
            this.model.selectNode(node.id, isMulti);
            this.render();
            if (this.onNodeClick) this.onNodeClick(node);
        });

        g.addEventListener('dblclick', (e) => {
            if (e.target.closest('.node-action-btn')) return;
            e.stopPropagation();
            if (this.onNodeDblClick) this.onNodeDblClick(node);
        });

        g.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!this.model.isSelected(node.id)) {
                this.model.selectNode(node.id, false);
                this.render();
            }
            if (this.onContextMenu) this.onContextMenu(e, { type: 'node', node });
        });
        parentG.appendChild(g);

        const thenLayout = this.layoutList(node.then);
        const elseLayout = this.layoutList(node.else);

        const branchOffset = Math.max(diamondW / 2 + hGap / 2 + thenLayout.width / 2, 140);
        const leftCenterX = centerX - branchOffset;
        const rightCenterX = centerX + branchOffset;

        const branchStartY = topY + diamondH / 2;
        const branchContentStartY = topY + diamondH + vGap;

        // True branch line (Left) - drawn down to branchContentStartY first
        this.renderPath(parentG, `M ${centerX - diamondW / 2} ${branchStartY} L ${leftCenterX} ${branchStartY} L ${leftCenterX} ${branchContentStartY}`, true);
        this.renderBranchLabel(parentG, centerX - diamondW / 2 - 30, branchStartY - 10, 'Doğru (True)', 'true-label');

        // False branch line (Right) - drawn down to branchContentStartY first
        this.renderPath(parentG, `M ${centerX + diamondW / 2} ${branchStartY} L ${rightCenterX} ${branchStartY} L ${rightCenterX} ${branchContentStartY}`, true);
        this.renderBranchLabel(parentG, centerX + diamondW / 2 + 30, branchStartY - 10, 'Yanlış (False)', 'false-label');

        // Plus buttons drawn ON TOP of the branch lines
        this.renderPlus(parentG, leftCenterX, branchContentStartY - vGap / 2, node.then, 0);
        const thenEndY = this.renderStatementList(parentG, node.then, leftCenterX, branchContentStartY);

        this.renderPlus(parentG, rightCenterX, branchContentStartY - vGap / 2, node.else, 0);
        const elseEndY = this.renderStatementList(parentG, node.else, rightCenterX, branchContentStartY);

        const joinY = Math.max(thenEndY, elseEndY) + vGap / 2;

        this.renderPath(parentG, `M ${leftCenterX} ${thenEndY} L ${leftCenterX} ${joinY} L ${centerX} ${joinY}`);
        this.renderPath(parentG, `M ${rightCenterX} ${elseEndY} L ${rightCenterX} ${joinY} L ${centerX} ${joinY}`);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', centerX);
        circle.setAttribute('cy', joinY);
        circle.setAttribute('r', 4);
        circle.setAttribute('class', 'flow-join-circle');
        circle.setAttribute('fill', '#3b82f6');
        parentG.appendChild(circle);

        return joinY;
    }

    renderLoopNode(parentG, node, centerX, topY, parentList, index) {
        const { nodeWidth, nodeHeight, vGap, hGap } = this.options;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const isSelected = this.model.isSelected(node.id);
        g.setAttribute('class', `node-group node-loop ${isSelected ? 'selected' : ''} ${node.id === this.activeNodeId ? 'executing' : ''}`);
        g.setAttribute('data-id', node.id);

        const hexH = nodeHeight + 8;
        const hexW = nodeWidth + 24;
        const leftX = centerX - hexW / 2;

        const hex = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const cut = 22;
        hex.setAttribute('points', `
            ${leftX + cut},${topY}
            ${leftX + hexW - cut},${topY}
            ${leftX + hexW},${topY + hexH / 2}
            ${leftX + hexW - cut},${topY + hexH}
            ${leftX + cut},${topY + hexH}
            ${leftX},${topY + hexH / 2}
        `);
        hex.setAttribute('class', 'shape shape-loop');
        hex.setAttribute('filter', 'url(#shadow)');
        g.appendChild(hex);

        const typeBadge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        typeBadge.setAttribute('x', centerX);
        typeBadge.setAttribute('y', topY + 16);
        typeBadge.setAttribute('class', 'badge-text center-badge');
        typeBadge.textContent = node.type === 'while' ? 'İKEN (WHILE) DÖNGÜSÜ' : 'İÇİN (FOR) DÖNGÜSÜ';
        g.appendChild(typeBadge);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', centerX);
        text.setAttribute('y', topY + hexH / 2 + 5);
        text.setAttribute('class', 'node-text');
        text.textContent = this.truncateText(this.getNodeLabel(node), 24);
        g.appendChild(text);

        const actionsGroup = this.createNodeActions(node, leftX + hexW + 8, topY);
        g.appendChild(actionsGroup);

        g.addEventListener('click', (e) => {
            if (e.target.closest('.node-action-btn')) return;
            e.stopPropagation();
            const isMulti = e.ctrlKey || e.metaKey || e.shiftKey;
            this.model.selectNode(node.id, isMulti);
            this.render();
            if (this.onNodeClick) this.onNodeClick(node);
        });

        g.addEventListener('dblclick', (e) => {
            if (e.target.closest('.node-action-btn')) return;
            e.stopPropagation();
            if (this.onNodeDblClick) this.onNodeDblClick(node);
        });

        g.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!this.model.isSelected(node.id)) {
                this.model.selectNode(node.id, false);
                this.render();
            }
            if (this.onContextMenu) this.onContextMenu(e, { type: 'node', node });
        });
        parentG.appendChild(g);

        this.renderBranchLabel(parentG, centerX + 22, topY + hexH + 18, 'Doğru', 'true-label');
        // Line drawn first, plus drawn ON TOP
        this.renderLine(parentG, centerX, topY + hexH, centerX, topY + hexH + vGap, true);
        this.renderPlus(parentG, centerX, topY + hexH + vGap / 2, node.body, 0);

        const bodyEndY = this.renderStatementList(parentG, node.body, centerX, topY + hexH + vGap);

        const loopSideX = leftX - 50;
        this.renderPath(parentG, `
            M ${centerX} ${bodyEndY}
            L ${loopSideX} ${bodyEndY}
            L ${loopSideX} ${topY + hexH / 2}
            L ${leftX} ${topY + hexH / 2}
        `, true);

        const exitSideX = leftX + hexW + 50;
        const exitStartY = topY + hexH / 2;
        const exitJoinY = bodyEndY + vGap / 2;

        this.renderBranchLabel(parentG, leftX + hexW + 24, exitStartY - 8, 'Yanlış (Bitiş)', 'false-label');
        this.renderPath(parentG, `
            M ${leftX + hexW} ${exitStartY}
            L ${exitSideX} ${exitStartY}
            L ${exitSideX} ${exitJoinY}
            L ${centerX} ${exitJoinY}
        `);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', centerX);
        circle.setAttribute('cy', exitJoinY);
        circle.setAttribute('r', 4);
        circle.setAttribute('class', 'flow-join-circle');
        circle.setAttribute('fill', '#3b82f6');
        parentG.appendChild(circle);

        return exitJoinY;
    }

    renderStartEnd(parentG, centerX, topY, label, type) {
        const { nodeWidth, nodeHeight } = this.options;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', `node-terminal node-terminal-${type}`);

        // Expand terminal width dynamically if label is long (e.g. for functions)
        const calcW = Math.max(nodeWidth, label.length * 10 + 40);
        const leftX = centerX - calcW / 2;

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', leftX);
        rect.setAttribute('y', topY);
        rect.setAttribute('width', calcW);
        rect.setAttribute('height', nodeHeight);
        rect.setAttribute('rx', nodeHeight / 2);
        rect.setAttribute('class', `shape shape-terminal shape-terminal-${type}`);
        rect.setAttribute('filter', 'url(#shadow)');
        g.appendChild(rect);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', centerX);
        text.setAttribute('y', topY + nodeHeight / 2 + 6);
        text.setAttribute('class', 'terminal-text');
        text.textContent = label;
        g.appendChild(text);

        parentG.appendChild(g);
        return g;
    }

    renderPlus(parentG, x, y, targetList, index) {
        const r = this.options.plusRadius;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'plus-btn');
        g.setAttribute('title', 'Araya Şekil Ekle (Dokunun)');
        g.style.cursor = 'pointer';

        // Stable invisible hit area (48px diameter) with explicit pointer-events
        const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hitArea.setAttribute('cx', x);
        hitArea.setAttribute('cy', y);
        hitArea.setAttribute('r', 24);
        hitArea.setAttribute('fill', 'transparent');
        hitArea.setAttribute('class', 'plus-hit-area');
        hitArea.style.pointerEvents = 'all';
        hitArea.style.cursor = 'pointer';
        g.appendChild(hitArea);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', r);
        circle.setAttribute('class', 'plus-circle');
        circle.setAttribute('pointer-events', 'none');
        g.appendChild(circle);

        const plusText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        plusText.setAttribute('x', x);
        plusText.setAttribute('y', y + 5);
        plusText.setAttribute('class', 'plus-text');
        plusText.setAttribute('pointer-events', 'none');
        plusText.textContent = '+';
        g.appendChild(plusText);

        let lastTriggerTime = 0;
        const trigger = (e) => {
            const now = Date.now();
            if (now - lastTriggerTime < 250) return;
            lastTriggerTime = now;
            const touch = e.changedTouches ? e.changedTouches[0] : null;
            const clientX = touch ? touch.clientX : (e.clientX || x);
            const clientY = touch ? touch.clientY : (e.clientY || y);
            this.onPlusClick(targetList, index, { x, y, clientX, clientY });
        };

        g.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            trigger(e);
        });

        g.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            trigger(e);
        });

        g.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.onContextMenu) {
                this.onContextMenu(e, { type: 'plus', targetList, index, x, y, clientX: e.clientX, clientY: e.clientY });
            }
        });

        parentG.appendChild(g);
    }

    renderLine(parentG, x1, y1, x2, y2, withArrow = false) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('class', 'flow-line');
        if (withArrow) line.setAttribute('marker-end', 'url(#arrow)');
        parentG.appendChild(line);
    }

    renderPath(parentG, d, withArrow = false) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('class', 'flow-line');
        path.setAttribute('fill', 'none');
        if (withArrow) path.setAttribute('marker-end', 'url(#arrow)');
        parentG.appendChild(path);
    }

    renderBranchLabel(parentG, x, y, text, cssClass) {
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', x);
        t.setAttribute('y', y);
        t.setAttribute('class', `branch-label ${cssClass}`);
        t.textContent = text;
        parentG.appendChild(t);
    }

    // Node Action Bar (Kopyala, Kes, Sil) on node hover/selection
    createNodeActions(node, x, y) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'node-actions-bar');

        // Delete button
        const delBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        delBtn.setAttribute('class', 'node-action-btn delete-btn');
        delBtn.setAttribute('title', 'Bloğu Sil (Delete)');

        const hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hit.setAttribute('cx', x);
        hit.setAttribute('cy', y + 10);
        hit.setAttribute('r', 14);
        hit.setAttribute('fill', 'transparent');
        delBtn.appendChild(hit);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y + 10);
        circle.setAttribute('r', 10);
        circle.setAttribute('class', 'delete-circle');
        circle.setAttribute('pointer-events', 'none');
        delBtn.appendChild(circle);

        const xText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xText.setAttribute('x', x);
        xText.setAttribute('y', y + 13.5);
        xText.setAttribute('class', 'delete-x');
        xText.setAttribute('pointer-events', 'none');
        xText.textContent = '×';
        delBtn.appendChild(xText);

        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onNodeDelete) {
                this.onNodeDelete(node);
            } else {
                this.model.deleteNode(node.id);
                this.render();
                if (window.onFlowchartChanged) window.onFlowchartChanged();
            }
        });

        g.appendChild(delBtn);
        return g;
    }

    truncateText(str, maxLen = 22) {
        if (!str) return '';
        if (str.length <= maxLen) return str;
        return str.substring(0, maxLen - 2) + '..';
    }

    setActiveNode(nodeId) {
        this.activeNodeId = nodeId;
        const allGroups = this.svg.querySelectorAll('.node-group');
        allGroups.forEach(g => {
            if (g.getAttribute('data-id') === nodeId) {
                g.classList.add('executing');
            } else {
                g.classList.remove('executing');
            }
        });
    }

    updateTransform() {
        const mainG = this.svg.querySelector('#canvas-group');
        if (mainG && this.totalBounds) {
            this.svg.setAttribute('viewBox', `0 0 ${this.totalBounds.width} ${this.totalBounds.height}`);
            this.svg.setAttribute('width', `${this.totalBounds.width * this.scale}px`);
            this.svg.setAttribute('height', `${this.totalBounds.height * this.scale}px`);
        }
        const badge = document.getElementById('zoom-percentage-badge');
        if (badge) {
            badge.textContent = `%${Math.round(this.scale * 100)}`;
        }
    }

    zoom(delta) {
        this.scale = Math.max(0.4, Math.min(2.5, Math.round((this.scale + delta) * 1000) / 1000));
        this.updateTransform();
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('flowchart_zoom_scale', this.scale.toFixed(3));
            }
        } catch(e) {}
    }

    resetZoom() {
        this.scale = 1.0;
        this.updateTransform();
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('flowchart_zoom_scale', '1.0');
            }
        } catch(e) {}
    }

    onNodeClick(node) {}
    onNodeDblClick(node) {}
    onNodeDelete(node) {}
    onContextMenu(e, info) {}
    onPlusClick(targetList, index, pos) {}
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FlowchartModel, FlowchartRenderer };
}
