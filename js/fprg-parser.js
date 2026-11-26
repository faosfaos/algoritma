/**
 * Etapgorithm - Flowgorithm .fprg XML Parser & Serializer
 * Flowgorithm dosyalarını çift yönlü içe ve dışa aktarır (Çoklu Fonksiyon Destekli).
 */

class FprgParser {
    static parse(xmlString, model) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "application/xml");

        const parseError = xmlDoc.querySelector("parsererror");
        if (parseError) {
            throw new Error("XML ayrıştırma hatası: " + parseError.textContent);
        }

        const flowgorithmEl = xmlDoc.querySelector("flowgorithm");
        if (!flowgorithmEl) {
            throw new Error("Geçerli bir Flowgorithm (.fprg) dosyası değil.");
        }

        model.reset();

        const allFuncs = xmlDoc.querySelectorAll('function');
        if (allFuncs.length === 0) {
            throw new Error("Flowgorithm dosyasında fonksiyon bulunamadı.");
        }

        for (const funcEl of allFuncs) {
            const fName = funcEl.getAttribute('name') || 'Main';
            const fType = funcEl.getAttribute('type') || 'None';
            const fVar = funcEl.getAttribute('variable') || '';

            const params = [];
            const paramEls = funcEl.querySelectorAll('parameters > parameter');
            for (const p of paramEls) {
                params.push({
                    name: p.getAttribute('name') || 'x',
                    type: p.getAttribute('type') || 'Integer',
                    isArray: p.getAttribute('array') === 'True' || p.getAttribute('array') === 'true'
                });
            }

            let fnObj;
            if (fName === 'Main') {
                fnObj = model.functions['Main'];
                fnObj.type = fType;
                fnObj.variable = fVar;
                fnObj.parameters = params;
            } else {
                fnObj = model.addFunction(fName, fType, fVar, params);
            }

            const bodyEl = funcEl.querySelector('body');
            if (bodyEl) {
                fnObj.body = FprgParser.parseStatements(bodyEl, model);
            }
        }

        model.selectFunction('Main');
        return model;
    }

    static parseStatements(parentEl, model) {
        const statements = [];

        for (const child of parentEl.children) {
            const tagName = child.tagName.toLowerCase();
            switch (tagName) {
                case 'declare':
                    statements.push(model.createNode('declare', {
                        name: child.getAttribute('name') || 'x',
                        dataType: child.getAttribute('type') || 'Integer',
                        isArray: child.getAttribute('array') === 'True' || child.getAttribute('array') === 'true',
                        arraySize: child.getAttribute('size') || ''
                    }));
                    break;
                case 'assign':
                    statements.push(model.createNode('assign', {
                        variable: child.getAttribute('variable') || 'x',
                        expression: child.getAttribute('expression') || '0'
                    }));
                    break;
                case 'input':
                    statements.push(model.createNode('input', {
                        variable: child.getAttribute('variable') || 'x'
                    }));
                    break;
                case 'output':
                    statements.push(model.createNode('output', {
                        expression: child.getAttribute('expression') || '""',
                        newline: child.getAttribute('newline') !== 'False' && child.getAttribute('newline') !== 'false'
                    }));
                    break;
                case 'if':
                    const thenEl = child.querySelector('then');
                    const elseEl = child.querySelector('else');
                    statements.push(model.createNode('if', {
                        expression: child.getAttribute('expression') || 'true',
                        then: thenEl ? FprgParser.parseStatements(thenEl, model) : [],
                        else: elseEl ? FprgParser.parseStatements(elseEl, model) : []
                    }));
                    break;
                case 'while':
                    const wBody = child.querySelector('body');
                    statements.push(model.createNode('while', {
                        expression: child.getAttribute('expression') || 'true',
                        body: wBody ? FprgParser.parseStatements(wBody, model) : []
                    }));
                    break;
                case 'for':
                    const fBody = child.querySelector('body');
                    statements.push(model.createNode('for', {
                        variable: child.getAttribute('variable') || 'i',
                        start: child.getAttribute('start') || '1',
                        end: child.getAttribute('end') || '10',
                        step: child.getAttribute('step') || '1',
                        direction: child.getAttribute('direction') || 'inc',
                        body: fBody ? FprgParser.parseStatements(fBody, model) : []
                    }));
                    break;
                case 'do':
                    const dBody = child.querySelector('body');
                    statements.push(model.createNode('do', {
                        expression: child.getAttribute('expression') || 'true',
                        body: dBody ? FprgParser.parseStatements(dBody, model) : []
                    }));
                    break;
                case 'comment':
                    statements.push(model.createNode('comment', {
                        text: child.getAttribute('text') || ''
                    }));
                    break;
                case 'call':
                    statements.push(model.createNode('call', {
                        expression: child.getAttribute('expression') || ''
                    }));
                    break;
            }
        }

        return statements;
    }

    static export(model) {
        function escapeXml(str) {
            if (!str) return '';
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        }

        function serializeStatements(list, indent = 3) {
            const pad = "    ".repeat(indent);
            let xml = "";
            for (const node of list) {
                switch (node.type) {
                    case 'declare':
                        xml += `${pad}<declare name="${escapeXml(node.name)}" type="${escapeXml(node.dataType)}" array="${node.isArray ? 'True' : 'False'}" size="${escapeXml(node.arraySize || '')}"/>\n`;
                        break;
                    case 'assign':
                        xml += `${pad}<assign variable="${escapeXml(node.variable)}" expression="${escapeXml(node.expression)}"/>\n`;
                        break;
                    case 'input':
                        xml += `${pad}<input variable="${escapeXml(node.variable)}"/>\n`;
                        break;
                    case 'output':
                        xml += `${pad}<output expression="${escapeXml(node.expression)}" newline="${node.newline ? 'True' : 'False'}"/>\n`;
                        break;
                    case 'if':
                        xml += `${pad}<if expression="${escapeXml(node.expression)}">\n`;
                        xml += `${pad}    <then>\n`;
                        xml += serializeStatements(node.then, indent + 2);
                        xml += `${pad}    </then>\n`;
                        xml += `${pad}    <else>\n`;
                        xml += serializeStatements(node.else, indent + 2);
                        xml += `${pad}    </else>\n`;
                        xml += `${pad}</if>\n`;
                        break;
                    case 'while':
                        xml += `${pad}<while expression="${escapeXml(node.expression)}">\n`;
                        xml += `${pad}    <body>\n`;
                        xml += serializeStatements(node.body, indent + 2);
                        xml += `${pad}    </body>\n`;
                        xml += `${pad}</while>\n`;
                        break;
                    case 'for':
                        xml += `${pad}<for variable="${escapeXml(node.variable)}" start="${escapeXml(node.start)}" end="${escapeXml(node.end)}" direction="${escapeXml(node.direction || 'inc')}" step="${escapeXml(node.step || '1')}">\n`;
                        xml += `${pad}    <body>\n`;
                        xml += serializeStatements(node.body, indent + 2);
                        xml += `${pad}    </body>\n`;
                        xml += `${pad}</for>\n`;
                        break;
                    case 'comment':
                        xml += `${pad}<comment text="${escapeXml(node.text)}"/>\n`;
                        break;
                    case 'call':
                        xml += `${pad}<call expression="${escapeXml(node.expression)}"/>\n`;
                        break;
                }
            }
            return xml;
        }

        const now = new Date().toISOString();
        let xml = `<?xml version="1.0"?>\n`;
        xml += `<flowgorithm fileversion="4.2">\n`;
        xml += `    <attributes>\n`;
        xml += `        <attribute name="name" value="EtapgorithmProgram"/>\n`;
        xml += `        <attribute name="authors" value="MEB Pardus ETAP"/>\n`;
        xml += `        <attribute name="about" value="Etapgorithm tarafından üretilmiştir."/>\n`;
        xml += `        <attribute name="saved" value="${now}"/>\n`;
        xml += `    </attributes>\n`;

        // Serialize all functions (Main first)
        const funcEntries = Object.entries(model.functions || { "Main": model.currentFunction });
        funcEntries.sort((a, b) => (a[0] === 'Main' ? -1 : b[0] === 'Main' ? 1 : 0));

        for (const [fName, fObj] of funcEntries) {
            xml += `    <function name="${escapeXml(fObj.name || fName)}" type="${escapeXml(fObj.type || 'None')}" variable="${escapeXml(fObj.variable || '')}">\n`;
            xml += `        <parameters>\n`;
            if (fObj.parameters) {
                for (const p of fObj.parameters) {
                    xml += `            <parameter name="${escapeXml(p.name)}" type="${escapeXml(p.type)}" array="${p.isArray ? 'True' : 'False'}"/>\n`;
                }
            }
            xml += `        </parameters>\n`;
            xml += `        <body>\n`;
            xml += serializeStatements(fObj.body || [], 3);
            xml += `        </body>\n`;
            xml += `    </function>\n`;
        }

        xml += `</flowgorithm>\n`;
        return xml;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FprgParser };
}
