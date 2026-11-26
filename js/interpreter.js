/**
 * Etapgorithm - Interpreter & Expression Evaluator
 * Flowgorithm uyumlu ifade ayrıştırıcısı ve adım adım algoritma yürütücüsü
 */

class FlowInterpreter {
    constructor(model, options = {}) {
        this.model = model;
        this.options = {
            delayMs: 600,
            ...options
        };
        this.variables = {}; // { varName: { type: 'Integer', value: 0 } }
        this.state = 'idle'; // 'idle' | 'running' | 'paused' | 'waiting_input' | 'finished' | 'error'
        this.stepMode = false;
        this.stepResolve = null;
        this.inputResolve = null;
        this.currentExecutingNodeId = null;

        // Callbacks
        this.onLog = options.onLog || ((msg, type) => console.log(`[${type}] ${msg}`));
        this.onClearConsole = options.onClearConsole || (() => {});
        this.onVariablesChange = options.onVariablesChange || ((vars) => {});
        this.onNodeActive = options.onNodeActive || ((nodeId) => {});
        this.onStateChange = options.onStateChange || ((state) => {});
        this.onPromptInput = options.onPromptInput || (async (varName) => prompt(`${varName} için değer giriniz:`));
    }

    reset() {
        this.variables = {};
        this.state = 'idle';
        this.stepMode = false;
        this.stepResolve = null;
        this.inputResolve = null;
        this.currentExecutingNodeId = null;
        this.onNodeActive(null);
        this.onVariablesChange(this.variables);
        this.onStateChange(this.state);
    }

    setState(newState) {
        this.state = newState;
        this.onStateChange(newState);
    }

    setDelay(ms) {
        this.options.delayMs = ms;
    }

    async run() {
        this.reset();
        this.onClearConsole();
        this.onLog("Algoritma başlatıldı.", "system");
        this.setState('running');

        const mainFunc = (this.model.functions && this.model.functions['Main']) ? this.model.functions['Main'] : this.model.currentFunction;

        try {
            await this.executeBlock(mainFunc.body);
            if (this.state !== 'idle') {
                this.onNodeActive(null);
                this.setState('finished');
                this.onLog("Algoritma başarıyla tamamlandı (Dur).", "system-success");
            }
        } catch (err) {
            this.setState('error');
            this.onNodeActive(null);
            this.onLog(`HATA: ${err.message}`, "error");
        }
    }

    async step() {
        const mainFunc = (this.model.functions && this.model.functions['Main']) ? this.model.functions['Main'] : this.model.currentFunction;

        if (this.state === 'idle' || this.state === 'finished' || this.state === 'error') {
            this.reset();
            this.onClearConsole();
            this.onLog("Adım adım çalışma başlatıldı.", "system");
            this.stepMode = true;
            this.setState('paused');
            // Start execution in background
            this.executeBlock(mainFunc.body).then(() => {
                if (this.state !== 'idle') {
                    this.onNodeActive(null);
                    this.setState('finished');
                    this.onLog("Algoritma tamamlandı.", "system-success");
                }
            }).catch(err => {
                this.setState('error');
                this.onNodeActive(null);
                this.onLog(`HATA: ${err.message}`, "error");
            });
            return;
        }

        if (this.state === 'paused') {
            this.stepMode = true;
            if (this.stepResolve) {
                const res = this.stepResolve;
                this.stepResolve = null;
                res();
            }
        }
    }

    pause() {
        if (this.state === 'running') {
            this.setState('paused');
            this.stepMode = true;
        }
    }

    resume() {
        if (this.state === 'paused') {
            this.stepMode = false;
            this.setState('running');
            if (this.stepResolve) {
                const res = this.stepResolve;
                this.stepResolve = null;
                res();
            }
        }
    }

    stop() {
        this.setState('idle');
        this.stepMode = false;
        if (this.stepResolve) {
            this.stepResolve();
            this.stepResolve = null;
        }
        if (this.inputResolve) {
            this.inputResolve(null);
            this.inputResolve = null;
        }
        this.reset();
        this.onLog("Çalışma kullanıcı tarafından durduruldu.", "system-warning");
    }

    async waitDelayOrStep(node) {
        if (this.state === 'idle') throw new Error("Durduruldu");

        this.currentExecutingNodeId = node.id;
        this.onNodeActive(node.id);

        if (this.stepMode || this.state === 'paused') {
            await new Promise(resolve => {
                this.stepResolve = resolve;
            });
        } else {
            if (this.options.delayMs > 0) {
                await new Promise(resolve => setTimeout(resolve, this.options.delayMs));
            }
        }

        if (this.state === 'idle') throw new Error("Durduruldu");
    }

    async executeBlock(statementList) {
        for (const node of statementList) {
            if (this.state === 'idle') break;
            await this.executeNode(node);
        }
    }

    async executeNode(node) {
        await this.waitDelayOrStep(node);

        switch (node.type) {
            case 'declare':
                this.executeDeclare(node);
                break;
            case 'assign':
                this.executeAssign(node);
                break;
            case 'input':
                await this.executeInput(node);
                break;
            case 'output':
                this.executeOutput(node);
                break;
            case 'if':
                await this.executeIf(node);
                break;
            case 'while':
                await this.executeWhile(node);
                break;
            case 'for':
                await this.executeFor(node);
                break;
            case 'comment':
                // Do nothing for comments
                break;
            case 'call':
                this.executeCall(node);
                break;
            default:
                break;
        }
    }

    executeCall(node) {
        this.onLog(`[Çağrı] ${node.expression}`, "info");
        this.evaluateExpression(node.expression);
    }

    invokeUserFunction(fnObj, args) {
        // Save current variable frame
        const savedVars = JSON.parse(JSON.stringify(this.variables));
        const localVars = {};

        // Bind parameters with initialized: true
        if (fnObj.parameters) {
            fnObj.parameters.forEach((param, idx) => {
                let argVal = args[idx];
                if (param.type === 'Integer') argVal = parseInt(argVal, 10) || 0;
                else if (param.type === 'Real') argVal = parseFloat(argVal) || 0.0;
                else if (param.type === 'Boolean') argVal = Boolean(argVal);
                else if (param.type === 'String') argVal = String(argVal !== null && argVal !== undefined ? argVal : '');
                localVars[param.name] = { type: param.type, value: argVal, initialized: true };
            });
        }

        // Initialize return variable if defined with initialized: true
        if (fnObj.variable) {
            let defVal = 0;
            if (fnObj.type === 'Real') defVal = 0.0;
            else if (fnObj.type === 'String') defVal = "";
            else if (fnObj.type === 'Boolean') defVal = false;
            localVars[fnObj.variable] = { type: fnObj.type, value: defVal, initialized: true };
        }

        this.variables = localVars;

        // Execute function statements synchronously
        this.executeBlockSync(fnObj.body);

        let retVal = 0;
        if (fnObj.variable && this.variables[fnObj.variable]) {
            retVal = this.variables[fnObj.variable].value;
        }

        // Restore caller's variable frame
        this.variables = savedVars;
        return retVal;
    }

    executeBlockSync(statementList) {
        if (!statementList) return;
        for (const node of statementList) {
            switch (node.type) {
                case 'declare':
                    this.executeDeclare(node);
                    break;
                case 'assign':
                    this.executeAssign(node);
                    break;
                case 'output':
                    this.executeOutput(node);
                    break;
                case 'if':
                    if (Boolean(this.evaluateExpression(node.expression))) {
                        this.executeBlockSync(node.then);
                    } else {
                        this.executeBlockSync(node.else);
                    }
                    break;
                case 'while':
                    let count = 0;
                    while (Boolean(this.evaluateExpression(node.expression)) && count++ < 10000) {
                        this.executeBlockSync(node.body);
                    }
                    break;
                case 'for':
                    const varName = node.variable.trim();
                    if (!this.variables.hasOwnProperty(varName)) {
                        throw new Error(`Döngü sayacı "${varName}" tanımlanmamış! Önce Tanımla bloğu ile tanımlamalısınız.`);
                    }
                    const start = parseInt(this.evaluateExpression(node.start), 10);
                    const end = parseInt(this.evaluateExpression(node.end), 10);
                    const step = Math.abs(parseInt(this.evaluateExpression(node.step || '1'), 10)) || 1;
                    const inc = node.direction !== 'dec';

                    this.variables[varName].value = start;
                    this.variables[varName].initialized = true;
                    let fCount = 0;
                    while (inc ? (this.variables[varName].value <= end) : (this.variables[varName].value >= end)) {
                        if (fCount++ > 10000) break;
                        this.executeBlockSync(node.body);
                        this.variables[varName].value += (inc ? step : -step);
                    }
                    break;
                case 'call':
                    this.executeCall(node);
                    break;
            }
        }
    }

    executeDeclare(node) {
        const names = node.name.split(',').map(s => s.trim()).filter(s => s);
        for (const vName of names) {
            if (!this.isValidIdentifier(vName)) {
                throw new Error(`Geçersiz değişken adı: "${vName}"`);
            }
            // Fonksiyon parametresi veya dönüş değişkeni olarak zaten başlatılmışsa değerini koru
            if (this.variables.hasOwnProperty(vName) && this.variables[vName].initialized) {
                continue;
            }
            this.variables[vName] = {
                type: node.dataType,
                value: null, // Flowgorithm standardı: Başlangıçta tanımsız/null
                initialized: false,
                isArray: node.isArray,
                arraySize: node.arraySize
            };
        }
        this.onVariablesChange(this.variables);
    }

    executeAssign(node) {
        const varName = node.variable.trim();
        if (!this.variables.hasOwnProperty(varName)) {
            throw new Error(`"${varName}" değişkeni tanımlanmamış! Kullanmadan önce Tanımla (Declare) bloğu ile tanımlamalısınız.`);
        }

        // Clean expression: if user typed "sonuc = sonuc + sayi^3", strip redundant "sonuc = " prefix
        let exprStr = (node.expression || '').trim();
        const prefixRegex = new RegExp('^' + varName + '\\s*=\\s*', 'i');
        exprStr = exprStr.replace(prefixRegex, '');

        const value = this.evaluateExpression(exprStr);
        const targetType = this.variables[varName].type;

        // Cast to declared type
        let castValue = value;
        if (targetType === 'Integer') {
            castValue = parseInt(value, 10);
            if (isNaN(castValue)) castValue = 0;
        } else if (targetType === 'Real') {
            castValue = parseFloat(value);
            if (isNaN(castValue)) castValue = 0.0;
        } else if (targetType === 'String') {
            castValue = String(value !== null && value !== undefined ? value : '');
        } else if (targetType === 'Boolean') {
            castValue = Boolean(value);
        }

        this.variables[varName].value = castValue;
        this.variables[varName].initialized = true;
        this.onVariablesChange(this.variables);
    }

    async executeInput(node) {
        const varName = node.variable.trim();
        if (!this.variables.hasOwnProperty(varName)) {
            throw new Error(`"${varName}" değişkeni tanımlanmamış! Girdi almadan önce Tanımla (Declare) bloğu ile tanımlamalısınız.`);
        }

        const prevState = this.state;
        this.setState('waiting_input');

        const rawInput = await this.onPromptInput(varName);
        this.setState(prevState);

        if (rawInput === null || rawInput === undefined) {
            throw new Error(`Girdi iptal edildi.`);
        }

        this.onLog(`Girdi (${varName}): ${rawInput}`, "input-log");

        const targetType = this.variables[varName].type;
        let castValue = rawInput;
        if (targetType === 'Integer') {
            castValue = parseInt(rawInput, 10);
            if (isNaN(castValue)) castValue = 0;
        } else if (targetType === 'Real') {
            castValue = parseFloat(rawInput.replace(',', '.'));
            if (isNaN(castValue)) castValue = 0.0;
        } else if (targetType === 'Boolean') {
            const low = rawInput.trim().toLowerCase();
            castValue = (low === 'true' || low === 'doğru' || low === '1');
        } else {
            castValue = String(rawInput);
        }

        this.variables[varName].value = castValue;
        this.variables[varName].initialized = true;
        this.onVariablesChange(this.variables);
    }

    executeOutput(node) {
        const value = this.evaluateExpression(node.expression);
        this.onLog(String(value), "output", node.newline);
    }

    async executeIf(node) {
        const cond = this.evaluateExpression(node.expression);
        if (Boolean(cond)) {
            this.onLog(`[Eğer] Koşul DOĞRU: (${node.expression})`, "trace");
            await this.executeBlock(node.then);
        } else {
            this.onLog(`[Eğer] Koşul YANLIŞ: (${node.expression})`, "trace");
            await this.executeBlock(node.else);
        }
    }

    async executeWhile(node) {
        let maxIterations = 10000;
        let count = 0;
        while (Boolean(this.evaluateExpression(node.expression))) {
            if (this.state === 'idle') break;
            count++;
            if (count > maxIterations) {
                throw new Error(`Sonsuz döngü tespit edildi! (10.000 adımdan fazla tekrarlandı)`);
            }
            await this.executeBlock(node.body);
            // Re-highlight loop header on loop-back
            await this.waitDelayOrStep(node);
        }
    }

    async executeFor(node) {
        const varName = node.variable.trim();
        if (!this.variables.hasOwnProperty(varName)) {
            throw new Error(`Döngü sayacı "${varName}" tanımlanmamış! Önce Tanımla (Declare) bloğu ile Tamsayı (Integer) olarak tanımlamalısınız.`);
        }

        const start = parseInt(this.evaluateExpression(node.start), 10);
        const end = parseInt(this.evaluateExpression(node.end), 10);
        const step = Math.abs(parseInt(this.evaluateExpression(node.step || '1'), 10)) || 1;
        const inc = node.direction !== 'dec';

        this.variables[varName].value = start;
        this.variables[varName].initialized = true;
        this.onVariablesChange(this.variables);

        let maxIterations = 10000;
        let count = 0;

        while (inc ? (this.variables[varName].value <= end) : (this.variables[varName].value >= end)) {
            if (this.state === 'idle') break;
            count++;
            if (count > maxIterations) {
                throw new Error(`Döngü güvenlik sınırı aşıldı!`);
            }

            await this.executeBlock(node.body);

            // Increment/Decrement variable
            if (inc) {
                this.variables[varName].value += step;
            } else {
                this.variables[varName].value -= step;
            }
            this.onVariablesChange(this.variables);

            // Re-check header
            await this.waitDelayOrStep(node);
        }
    }

    // Expression Evaluator & Strict Variable Validator
    validateExpressionIdentifiers(exprStr) {
        if (!exprStr || !exprStr.trim()) return;

        const parts = this.tokenizeExpression(exprStr);

        const reservedWords = new Set([
            'true', 'false', 'null', 'undefined', 'nan',
            'and', 'or', 'not', 'doğru', 'yanlış', 'mod',
            'return', 'if', 'else', 'then', 'to', 'for', 'in', 'step',
            'var', 'let', 'const', 'function', 'typeof', 'instanceof', 'new', 'this',
            'math', 'pi', 'abs', 'sqrt', 'sin', 'cos', 'tan', 'arcsin', 'arccos', 'arctan',
            'asin', 'acos', 'atan', 'round', 'floor', 'ceil', 'ceiling', 'int',
            'sgn', 'log', 'log10', 'random', 'len', 'char', 'tochar', 'tocode', 'code',
            'tofixed', 'tointeger', 'toreal', 'tostring', 'size'
        ]);

        const identRegex = /\b[a-zA-ZçğıöşüÇĞİÖŞÜ_][a-zA-Z0-9çğıöşüÇĞİÖŞÜ_]*\b/g;

        for (const part of parts) {
            if (part.type !== 'code') continue;

            let match;
            while ((match = identRegex.exec(part.text)) !== null) {
                const ident = match[0];
                const lower = ident.toLowerCase();

                if (reservedWords.has(lower)) continue;

                // Check custom function names
                if (this.model && this.model.functions && this.model.functions.hasOwnProperty(ident)) {
                    continue;
                }

                // Variable existence check
                if (!this.variables.hasOwnProperty(ident)) {
                    throw new Error(`"${ident}" adında bir değişken tanımlanmamış! Önce Tanımla (Declare) bloğu eklemelisiniz.`);
                }

                // Variable initialized / null check
                const v = this.variables[ident];
                if (!v.initialized || v.value === null || v.value === undefined) {
                    throw new Error(`"${ident}" değişkenine henüz bir değer atanmamış (başlatılmamış / null)!`);
                }
            }
        }
    }

    evaluateExpression(exprStr) {
        if (!exprStr || !exprStr.trim()) return '';

        // Validate identifiers first (Flowgorithm strict variable check)
        this.validateExpressionIdentifiers(exprStr);

        let sanitized = this.sanitizeExpression(exprStr.trim());

        // Built-in functions mapping (Case-Insensitive Flowgorithm Full Library)
        const mathFuncs = {
            Math,
            pi: Math.PI,
            PI: Math.PI,
            Pi: Math.PI,

            // Math Functions
            abs: (x) => Math.abs(Number(x) || 0),
            sqrt: (x) => Math.sqrt(Number(x) || 0),
            sin: (x) => Math.sin(Number(x) || 0),
            cos: (x) => Math.cos(Number(x) || 0),
            tan: (x) => Math.tan(Number(x) || 0),
            arcsin: (x) => Math.asin(Number(x) || 0),
            asin: (x) => Math.asin(Number(x) || 0),
            arccos: (x) => Math.acos(Number(x) || 0),
            acos: (x) => Math.acos(Number(x) || 0),
            arctan: (x) => Math.atan(Number(x) || 0),
            atan: (x) => Math.atan(Number(x) || 0),
            round: (x) => Math.round(Number(x) || 0),
            floor: (x) => Math.floor(Number(x) || 0),
            ceil: (x) => Math.ceil(Number(x) || 0),
            ceiling: (x) => Math.ceil(Number(x) || 0),
            int: (x) => Math.trunc(Number(x) || 0),
            sgn: (x) => Math.sign(Number(x) || 0),
            log: (x) => Math.log(Number(x) || 0),
            log10: (x) => Math.log10(Number(x) || 0),
            random: (n) => Math.floor(Math.random() * (Number(n) || 1)),

            // String & Conversion Functions
            len: (s) => (s !== null && s !== undefined ? String(s).length : 0),
            char: (s, i) => (s ? String(s).charAt(Number(i) || 0) : ''),
            tochar: (n) => String.fromCharCode(Number(n) || 0),
            tocode: (c) => (c ? String(c).charCodeAt(0) : 0),
            code: (c) => (c ? String(c).charCodeAt(0) : 0),
            tofixed: (n, p) => Number(n).toFixed(Number(p) || 0),
            tointeger: (x) => parseInt(x, 10) || 0,
            toreal: (x) => parseFloat(x) || 0.0,
            tostring: (x) => (x !== null && x !== undefined ? String(x) : ''),
            size: (arr) => (Array.isArray(arr) ? arr.length : 0)
        };

        const context = { ...mathFuncs };

        // Add PascalCase / Capital aliases for direct access
        context.Abs = context.abs;
        context.Sqrt = context.sqrt;
        context.Sin = context.sin;
        context.Cos = context.cos;
        context.Tan = context.tan;
        context.Round = context.round;
        context.Floor = context.floor;
        context.Ceil = context.ceil;
        context.Ceiling = context.ceiling;
        context.Int = context.int;
        context.Sgn = context.sgn;
        context.Log = context.log;
        context.Log10 = context.log10;
        context.Random = context.random;
        context.Len = context.len;
        context.Char = context.char;
        context.ToChar = context.tochar;
        context.ToCode = context.tocode;
        context.Code = context.code;
        context.ToFixed = context.tofixed;
        context.ToInteger = context.tointeger;
        context.ToReal = context.toreal;
        context.ToString = context.tostring;
        context.Size = context.size;

        // Add variables to context
        for (const [k, v] of Object.entries(this.variables)) {
            context[k] = v.value;
        }

        // Add user-defined custom functions to context
        if (this.model && this.model.functions) {
            for (const [fnName, fnObj] of Object.entries(this.model.functions)) {
                if (fnName === 'Main') continue;
                context[fnName] = (...args) => this.invokeUserFunction(fnObj, args);
            }
        }

        try {
            const keys = Object.keys(context);
            const vals = Object.values(context);
            const fn = new Function(...keys, `return (${sanitized});`);
            return fn(...vals);
        } catch (e) {
            if (e.message && e.message.includes('tanımlanmamış')) {
                throw e;
            }
            throw new Error(`İfade hesaplanamadı: "${exprStr}" (${e.message})`);
        }
    }

    tokenizeExpression(str) {
        let parts = [];
        let cur = '';
        let inQuotes = false;
        let quoteChar = '';

        for (let i = 0; i < str.length; i++) {
            const ch = str[i];
            if ((ch === '"' || ch === "'") && (!inQuotes || ch === quoteChar)) {
                if (inQuotes) {
                    cur += ch;
                    parts.push({ type: 'string', text: cur });
                    cur = '';
                    inQuotes = false;
                } else {
                    if (cur) parts.push({ type: 'code', text: cur });
                    cur = ch;
                    inQuotes = true;
                    quoteChar = ch;
                }
            } else {
                cur += ch;
            }
        }
        if (cur) {
            parts.push({ type: inQuotes ? 'string' : 'code', text: cur });
        }
        return parts;
    }

    sanitizeExpression(str) {
        const parts = this.tokenizeExpression(str);

        // Now transform only code parts
        return parts.map(p => {
            if (p.type === 'string') return p.text;
            let code = p.text;

            // Flowgorithm String Concatenation: & -> + '' +
            code = code.replace(/&/g, " + '' + ");

            // Exponentiation: ^ -> **
            code = code.replace(/\^/g, '**');

            // Wrap unary minus before exponentiation: e.g. -2**3 -> (-2)**3
            code = code.replace(/(-[a-zA-ZçğıöşüÇĞİÖŞÜ_0-9]+)\s*\*\*/g, '($1)**');

            // Logical Operators
            code = code.replace(/\bAND\b/gi, '&&');
            code = code.replace(/\bOR\b/gi, '||');
            code = code.replace(/\bNOT\b/gi, '!');

            // Modulus operator: mod / MOD -> %
            code = code.replace(/\bmod\b/gi, '%');

            // Booleans
            code = code.replace(/\bdoğru\b/gi, 'true');
            code = code.replace(/\byanlış\b/gi, 'false');

            // Comparison operators: <> -> !=
            code = code.replace(/<>/g, '!=');

            // Equality: = -> == (when not preceded or followed by =, <, >, !)
            code = code.replace(/([^=<>!])=([^=])/g, '$1==$2');

            // Normalize function calls
            code = code.replace(/\b(Abs|Sqrt|Sin|Cos|Tan|ArcSin|ArcCos|ArcTan|Asin|Acos|Atan|Round|Floor|Ceil|Ceiling|Int|Sgn|Log|Log10|Random|Len|Char|ToChar|ToCode|Code|ToFixed|ToInteger|ToReal|ToString|Size)\s*\(/gi, (m, fn) => {
                return fn.toLowerCase() + '(';
            });

            code = code.replace(/\bPI\b/g, 'pi');

            return code;
        }).join('');
    }

    isValidIdentifier(name) {
        return /^[a-zA-ZçğıöşüÇĞİÖŞÜ_][a-zA-Z0-9çğıöşüÇĞİÖŞÜ_]*$/.test(name);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FlowInterpreter };
}
