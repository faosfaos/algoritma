/**
 * Etapgorithm - Code Generator
 * Akış şemasını anında Python, C++, JavaScript ve Türkçe Sözde Koda dönüştürür.
 * (Çoklu Fonksiyon ve Çağrı Desteği ile)
 */

class CodeGenerator {
    static generate(model, lang = 'python') {
        if (!model) return "// Model bulunamadı.";
        const normalizedLang = (lang || 'python').toLowerCase().trim();
        switch (normalizedLang) {
            case 'python':
            case 'py':
                return this.toPython(model);
            case 'cpp':
            case 'c++':
            case 'c':
                return this.toCpp(model);
            case 'js':
            case 'javascript':
                return this.toJavaScript(model);
            case 'pseudo':
            case 'pseudocode':
            case 'sozde':
                return this.toPseudocode(model);
            default:
                return this.toPython(model);
        }
    }

    static toPython(model) {
        let code = "# Etapgorithm tarafından otomatik üretilen Python 3 Kodu\n";
        code += "# MEB Pardus ETAP Akıllı Tahta Uyumlu\n";
        code += "import math\nimport random\n\n";

        function generateStatements(list, indent = 0) {
            const pad = "    ".repeat(indent);
            let out = "";
            if (!list || !Array.isArray(list) || list.length === 0) {
                return pad + "pass\n";
            }

            for (const node of list) {
                if (!node || !node.type) continue;
                switch (node.type) {
                    case 'declare':
                        const vars = (node.name || '').split(',').map(s => s.trim()).filter(Boolean);
                        let initVal = "0";
                        if (node.dataType === 'Real') initVal = "0.0";
                        else if (node.dataType === 'String') initVal = '""';
                        else if (node.dataType === 'Boolean') initVal = "False";

                        if (vars.length === 0) {
                            out += `${pad}# Tanımsız değişken\n`;
                        } else {
                            for (const v of vars) {
                                out += `${pad}${v} = ${initVal}  # ${node.dataType || 'Integer'}\n`;
                            }
                        }
                        break;
                    case 'assign':
                        let expr = CodeGenerator.cleanExprForPython(node.expression);
                        out += `${pad}${node.variable || 'degisken'} = ${expr}\n`;
                        break;
                    case 'input':
                        const inpVar = node.variable || 'degisken';
                        out += `${pad}${inpVar} = input("${inpVar} değerini giriniz: ")\n`;
                        out += `${pad}try:\n`;
                        out += `${pad}    ${inpVar} = int(${inpVar})\n`;
                        out += `${pad}except ValueError:\n`;
                        out += `${pad}    try:\n`;
                        out += `${pad}        ${inpVar} = float(${inpVar})\n`;
                        out += `${pad}    except ValueError:\n`;
                        out += `${pad}        pass\n`;
                        break;
                    case 'output':
                        let outExpr = CodeGenerator.cleanExprForPython(node.expression);
                        out += `${pad}print(${outExpr}${node.newline ? '' : ', end=""'})\n`;
                        break;
                    case 'if':
                        let cond = CodeGenerator.cleanExprForPython(node.expression);
                        out += `${pad}if ${cond}:\n`;
                        out += generateStatements(node.then, indent + 1);
                        if (node.else && node.else.length > 0) {
                            out += `${pad}else:\n`;
                            out += generateStatements(node.else, indent + 1);
                        }
                        break;
                    case 'while':
                        let wCond = CodeGenerator.cleanExprForPython(node.expression);
                        out += `${pad}while ${wCond}:\n`;
                        out += generateStatements(node.body, indent + 1);
                        break;
                    case 'do':
                        let doCond = CodeGenerator.cleanExprForPython(node.expression);
                        out += `${pad}while True:\n`;
                        out += generateStatements(node.body, indent + 1);
                        out += `${pad}    if not (${doCond}):\n`;
                        out += `${pad}        break\n`;
                        break;
                    case 'for':
                        const v = node.variable || 'i';
                        const s = node.start || '1';
                        const e = node.end || '10';
                        const step = node.step || '1';
                        if (node.direction === 'dec') {
                            out += `${pad}for ${v} in range(${s}, (${e}) - 1, -(${step})):\n`;
                        } else {
                            out += `${pad}for ${v} in range(${s}, (${e}) + 1, ${step}):\n`;
                        }
                        out += generateStatements(node.body, indent + 1);
                        break;
                    case 'comment':
                        out += `${pad}# ${node.text || ''}\n`;
                        break;
                    case 'call':
                        out += `${pad}${node.expression || 'pass'}\n`;
                        break;
                }
            }
            return out;
        }

        // Custom Functions
        if (model.functions) {
            for (const [fnName, fnObj] of Object.entries(model.functions)) {
                if (fnName === 'Main') continue;
                const params = (fnObj.parameters || []).map(p => p.name).join(', ');
                code += `def ${fnName}(${params}):\n`;
                code += generateStatements(fnObj.body, 1);
                if (fnObj.variable) {
                    code += `    return ${fnObj.variable}\n`;
                }
                code += "\n";
            }
        }

        const mainFunc = (model.functions && model.functions['Main']) ? model.functions['Main'] : (model.currentFunction || { body: [] });
        code += "def ana_program():\n";
        code += generateStatements(mainFunc.body, 1);
        code += "\nif __name__ == '__main__':\n";
        code += "    ana_program()\n";
        return code;
    }

    static toCpp(model) {
        let code = "// Etapgorithm tarafından otomatik üretilen C++ Kodu\n";
        code += "#include <iostream>\n";
        code += "#include <string>\n";
        code += "#include <cmath>\n\n";
        code += "using namespace std;\n\n";

        const typeMap = {
            'Integer': 'int',
            'Real': 'double',
            'String': 'string',
            'Boolean': 'bool',
            'None': 'void'
        };

        function generateStatements(list, indent = 1) {
            const pad = "    ".repeat(indent);
            let out = "";
            if (!list || !Array.isArray(list) || list.length === 0) return out;

            for (const node of list) {
                if (!node || !node.type) continue;
                switch (node.type) {
                    case 'declare':
                        const cType = typeMap[node.dataType] || 'int';
                        const vars = (node.name || '').split(',').map(s => s.trim()).filter(Boolean);
                        if (vars.length > 0) {
                            out += `${pad}${cType} ${vars.join(', ')};\n`;
                        }
                        break;
                    case 'assign':
                        out += `${pad}${node.variable || 'degisken'} = ${CodeGenerator.cleanExprForC(node.expression)};\n`;
                        break;
                    case 'input':
                        const inVar = node.variable || 'degisken';
                        out += `${pad}cout << "${inVar} değerini giriniz: ";\n`;
                        out += `${pad}cin >> ${inVar};\n`;
                        break;
                    case 'output':
                        let expr = CodeGenerator.cleanExprForC(node.expression);
                        out += `${pad}cout << ${expr}${node.newline ? ' << endl' : ''};\n`;
                        break;
                    case 'if':
                        out += `${pad}if (${CodeGenerator.cleanExprForC(node.expression)}) {\n`;
                        out += generateStatements(node.then, indent + 1);
                        if (node.else && node.else.length > 0) {
                            out += `${pad}} else {\n`;
                            out += generateStatements(node.else, indent + 1);
                        }
                        out += `${pad}}\n`;
                        break;
                    case 'while':
                        out += `${pad}while (${CodeGenerator.cleanExprForC(node.expression)}) {\n`;
                        out += generateStatements(node.body, indent + 1);
                        out += `${pad}}\n`;
                        break;
                    case 'do':
                        out += `${pad}do {\n`;
                        out += generateStatements(node.body, indent + 1);
                        out += `${pad}} while (${CodeGenerator.cleanExprForC(node.expression)});\n`;
                        break;
                    case 'for':
                        const v = node.variable || 'i';
                        const op = node.direction === 'dec' ? '>=' : '<=';
                        const stepOp = node.direction === 'dec' ? `-= ${node.step || 1}` : `+= ${node.step || 1}`;
                        out += `${pad}for (${v} = ${node.start || 1}; ${v} ${op} ${node.end || 10}; ${v} ${stepOp}) {\n`;
                        out += generateStatements(node.body, indent + 1);
                        out += `${pad}}\n`;
                        break;
                    case 'comment':
                        out += `${pad}// ${node.text || ''}\n`;
                        break;
                    case 'call':
                        out += `${pad}${node.expression || '// call'};\n`;
                        break;
                }
            }
            return out;
        }

        // Custom Functions
        if (model.functions) {
            for (const [fnName, fnObj] of Object.entries(model.functions)) {
                if (fnName === 'Main') continue;
                const retType = typeMap[fnObj.type] || 'void';
                const params = (fnObj.parameters || []).map(p => `${typeMap[p.type] || 'int'} ${p.name}`).join(', ');
                code += `${retType} ${fnName}(${params}) {\n`;
                code += generateStatements(fnObj.body, 1);
                if (fnObj.variable) {
                    code += `    return ${fnObj.variable};\n`;
                }
                code += "}\n\n";
            }
        }

        const mainFunc = (model.functions && model.functions['Main']) ? model.functions['Main'] : (model.currentFunction || { body: [] });
        code += "int main() {\n";
        code += generateStatements(mainFunc.body, 1);
        code += "    return 0;\n";
        code += "}\n";
        return code;
    }

    static toJavaScript(model) {
        let code = "// Etapgorithm tarafından otomatik üretilen JavaScript Kodu\n\n";

        function generateStatements(list, indent = 0) {
            const pad = "    ".repeat(indent);
            let out = "";
            if (!list || !Array.isArray(list) || list.length === 0) return out;

            for (const node of list) {
                if (!node || !node.type) continue;
                switch (node.type) {
                    case 'declare':
                        const vars = (node.name || '').split(',').map(s => s.trim()).filter(Boolean);
                        for (const v of vars) {
                            out += `${pad}let ${v};\n`;
                        }
                        break;
                    case 'assign':
                        out += `${pad}${node.variable || 'degisken'} = ${CodeGenerator.cleanExprForJS(node.expression)};\n`;
                        break;
                    case 'input':
                        const inVar = node.variable || 'degisken';
                        out += `${pad}${inVar} = prompt("${inVar} için değer giriniz:");\n`;
                        break;
                    case 'output':
                        out += `${pad}console.log(${CodeGenerator.cleanExprForJS(node.expression)});\n`;
                        break;
                    case 'if':
                        out += `${pad}if (${CodeGenerator.cleanExprForJS(node.expression)}) {\n`;
                        out += generateStatements(node.then, indent + 1);
                        if (node.else && node.else.length > 0) {
                            out += `${pad}} else {\n`;
                            out += generateStatements(node.else, indent + 1);
                        }
                        out += `${pad}}\n`;
                        break;
                    case 'while':
                        out += `${pad}while (${CodeGenerator.cleanExprForJS(node.expression)}) {\n`;
                        out += generateStatements(node.body, indent + 1);
                        out += `${pad}}\n`;
                        break;
                    case 'do':
                        out += `${pad}do {\n`;
                        out += generateStatements(node.body, indent + 1);
                        out += `${pad}} while (${CodeGenerator.cleanExprForJS(node.expression)});\n`;
                        break;
                    case 'for':
                        const v = node.variable || 'i';
                        const op = node.direction === 'dec' ? '>=' : '<=';
                        const stepOp = node.direction === 'dec' ? `-= ${node.step || 1}` : `+= ${node.step || 1}`;
                        out += `${pad}for (let ${v} = ${node.start || 1}; ${v} ${op} ${node.end || 10}; ${v} ${stepOp}) {\n`;
                        out += generateStatements(node.body, indent + 1);
                        out += `${pad}}\n`;
                        break;
                    case 'comment':
                        out += `${pad}// ${node.text || ''}\n`;
                        break;
                    case 'call':
                        out += `${pad}${node.expression || '// call'};\n`;
                        break;
                }
            }
            return out;
        }

        if (model.functions) {
            for (const [fnName, fnObj] of Object.entries(model.functions)) {
                if (fnName === 'Main') continue;
                const params = (fnObj.parameters || []).map(p => p.name).join(', ');
                code += `function ${fnName}(${params}) {\n`;
                code += generateStatements(fnObj.body, 1);
                if (fnObj.variable) {
                    code += `    return ${fnObj.variable};\n`;
                }
                code += "}\n\n";
            }
        }

        const mainFunc = (model.functions && model.functions['Main']) ? model.functions['Main'] : (model.currentFunction || { body: [] });
        code += "function main() {\n";
        code += generateStatements(mainFunc.body, 1);
        code += "}\n\nmain();\n";
        return code;
    }

    static toPseudocode(model) {
        let code = "--- TÜRKÇE SÖZDE KOD (MEB BİLİŞİM MÜFREDATI) ---\n\n";

        function walk(list, indent = 1, startNum = 1) {
            const pad = "   ".repeat(indent);
            let out = "";
            let stepCount = startNum;
            if (!list || !Array.isArray(list) || list.length === 0) {
                return { out: "", lastNum: stepCount };
            }

            for (const node of list) {
                if (!node || !node.type) continue;
                const num = `${stepCount++}.`;
                switch (node.type) {
                    case 'declare':
                        const tMap = { 'Integer': 'Tamsayı', 'Real': 'Reel', 'String': 'Metin', 'Boolean': 'Mantıksal' };
                        const varName = node.name || 'degisken';
                        out += `${num} ${pad}TANIMLA ${tMap[node.dataType] || node.dataType || 'Tamsayı'} ${varName}\n`;
                        break;
                    case 'assign':
                        out += `${num} ${pad}${node.variable || 'degisken'} <- ${node.expression || '0'}\n`;
                        break;
                    case 'input':
                        out += `${num} ${pad}GİRİŞ AL ${node.variable || 'degisken'}\n`;
                        break;
                    case 'output':
                        out += `${num} ${pad}YAZDIR ${node.expression || '""'}\n`;
                        break;
                    case 'if':
                        out += `${num} ${pad}EĞER (${node.expression || 'koşul'}) İSE:\n`;
                        const thenRes = walk(node.then, indent + 1, stepCount);
                        out += thenRes.out;
                        stepCount = thenRes.lastNum;
                        if (node.else && node.else.length > 0) {
                            out += `${stepCount++}. ${pad}DEĞİLSE:\n`;
                            const elseRes = walk(node.else, indent + 1, stepCount);
                            out += elseRes.out;
                            stepCount = elseRes.lastNum;
                        }
                        out += `${stepCount++}. ${pad}EĞER SONU\n`;
                        break;
                    case 'while':
                        out += `${num} ${pad}${node.expression || 'koşul'} İKEN TEKRARLA:\n`;
                        const whileRes = walk(node.body, indent + 1, stepCount);
                        out += whileRes.out;
                        stepCount = whileRes.lastNum;
                        out += `${stepCount++}. ${pad}DÖNGÜ SONU\n`;
                        break;
                    case 'do':
                        out += `${num} ${pad}YAP (TEKRARLA):\n`;
                        const doRes = walk(node.body, indent + 1, stepCount);
                        out += doRes.out;
                        stepCount = doRes.lastNum;
                        out += `${stepCount++}. ${pad}${node.expression || 'koşul'} İKEN (DÖNGÜ SONU)\n`;
                        break;
                    case 'for':
                        const dirTr = node.direction === 'dec' ? 'AZALAN' : 'ARTAN';
                        const stepTr = (node.step && node.step !== '1') ? `, ADIM: ${node.step}` : '';
                        out += `${num} ${pad}${node.variable || 'i'} = ${node.start || '1'}'DEN ${node.end || '10'}'E KADAR (${dirTr}${stepTr}):\n`;
                        const forRes = walk(node.body, indent + 1, stepCount);
                        out += forRes.out;
                        stepCount = forRes.lastNum;
                        out += `${stepCount++}. ${pad}DÖNGÜ SONU\n`;
                        break;
                    case 'comment':
                        out += `${num} ${pad}// Not: ${node.text || ''}\n`;
                        break;
                    case 'call':
                        out += `${num} ${pad}ÇAĞIR ${node.expression || 'Fonk()'}\n`;
                        break;
                }
            }
            return { out, lastNum: stepCount };
        }

        if (model.functions) {
            for (const [fnName, fnObj] of Object.entries(model.functions)) {
                if (fnName === 'Main') continue;
                const params = (fnObj.parameters || []).map(p => `${p.name}: ${p.type}`).join(', ');
                code += `FONKSİYON ${fnName}(${params}):\n`;
                const fnWalk = walk(fnObj.body, 1, 1);
                code += fnWalk.out;
                if (fnObj.variable) {
                    code += `   DÖNDÜR ${fnObj.variable}\n`;
                }
                code += "FONKSİYON SONU\n\n";
            }
        }

        code += "1. BAŞLA\n";
        const mainFunc = (model.functions && model.functions['Main']) ? model.functions['Main'] : (model.currentFunction || { body: [] });
        const res = walk(mainFunc.body, 1, 2);
        code += res.out;
        code += `${res.lastNum}. BİTİR (DUR)\n`;
        return code;
    }

    static cleanExprForPython(str) {
        if (!str || typeof str !== 'string') return "''";
        let cleaned = str
            .replace(/\^/g, '**')
            .replace(/\bmod\b/gi, '%')
            .replace(/\bAND\b/gi, 'and')
            .replace(/\bOR\b/gi, 'or')
            .replace(/\bNOT\b/gi, 'not')
            .replace(/<>/g, '!=')
            .replace(/\btrue\b/gi, 'True')
            .replace(/\bfalse\b/gi, 'False')
            .replace(/\babs\(/gi, 'abs(')
            .replace(/\bsqrt\(/gi, 'math.sqrt(')
            .replace(/\blen\(/gi, 'len(')
            .replace(/\bround\(/gi, 'round(')
            .replace(/\bfloor\(/gi, 'math.floor(')
            .replace(/\bceil\(/gi, 'math.ceil(')
            .replace(/\bceiling\(/gi, 'math.ceil(')
            .replace(/\bint\(/gi, 'int(')
            .replace(/\bpi\b/gi, 'math.pi')
            .replace(/\brandom\(([^)]+)\)/gi, 'random.randint(0, ($1) - 1)');

        if (cleaned.includes('&')) {
            const parts = cleaned.split('&');
            cleaned = parts.map(p => `str(${p.trim()})`).join(' + ');
        }
        return cleaned;
    }

    static cleanExprForC(str) {
        if (!str || typeof str !== 'string') return '""';
        return str
            .replace(/&/g, ' << ')
            .replace(/\bmod\b/gi, '%')
            .replace(/\bAND\b/gi, '&&')
            .replace(/\bOR\b/gi, '||')
            .replace(/\bNOT\b/gi, '!')
            .replace(/<>/g, '!=');
    }

    static cleanExprForJS(str) {
        if (!str || typeof str !== 'string') return '""';
        return str
            .replace(/&/g, " + '' + ")
            .replace(/\^/g, '**')
            .replace(/\bmod\b/gi, '%')
            .replace(/\bAND\b/gi, '&&')
            .replace(/\bOR\b/gi, '||')
            .replace(/\bNOT\b/gi, '!')
            .replace(/<>/g, '!=')
            .replace(/\bsqrt\(/gi, 'Math.sqrt(')
            .replace(/\babs\(/gi, 'Math.abs(')
            .replace(/\bround\(/gi, 'Math.round(')
            .replace(/\bfloor\(/gi, 'Math.floor(')
            .replace(/\bceil\(/gi, 'Math.ceil(')
            .replace(/\bceiling\(/gi, 'Math.ceil(')
            .replace(/\bint\(/gi, 'Math.trunc(')
            .replace(/\bpi\b/gi, 'Math.PI');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CodeGenerator };
}
