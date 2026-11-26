/**
 * Etapgorithm - MEB Müfredatına Uygun Hazır Örnek Algoritmalar
 */

const Examples = [
    {
        title: "1. İki Sayının Toplamı",
        description: "Kullanıcıdan iki sayı alıp toplayarak ekrana yazdıran temel algoritma.",
        setup: (model) => {
            model.reset();
            const b = model.currentBody;
            b.push(model.createNode('declare', { name: 'sayi1, sayi2, toplam', dataType: 'Integer' }));
            b.push(model.createNode('output', { expression: '"Birinci sayıyı giriniz:"' }));
            b.push(model.createNode('input', { variable: 'sayi1' }));
            b.push(model.createNode('output', { expression: '"İkinci sayıyı giriniz:"' }));
            b.push(model.createNode('input', { variable: 'sayi2' }));
            b.push(model.createNode('assign', { variable: 'toplam', expression: 'sayi1 + sayi2' }));
            b.push(model.createNode('output', { expression: '"Toplam = " & toplam' }));
        }
    },
    {
        title: "2. Tek mi Çift mi? (Eğer / Karar)",
        description: "Girilen sayının 2'ye bölümünden kalana bakarak tek veya çift olduğunu belirler.",
        setup: (model) => {
            model.reset();
            const b = model.currentBody;
            b.push(model.createNode('declare', { name: 'sayi', dataType: 'Integer' }));
            b.push(model.createNode('output', { expression: '"Bir sayı giriniz:"' }));
            b.push(model.createNode('input', { variable: 'sayi' }));

            const ifNode = model.createNode('if', {
                expression: 'sayi % 2 == 0',
                then: [
                    model.createNode('output', { expression: 'sayi & " sayısı ÇİFTTİR."' })
                ],
                else: [
                    model.createNode('output', { expression: 'sayi & " sayısı TEKTİR."' })
                ]
            });
            b.push(ifNode);
        }
    },
    {
        title: "3. 1'den N'e Kadar Sayıların Toplamı (İken / While)",
        description: "While döngüsü kullanarak 1'den girilen N değerine kadar olan sayıları toplar.",
        setup: (model) => {
            model.reset();
            const b = model.currentBody;
            b.push(model.createNode('declare', { name: 'N, sayac, toplam', dataType: 'Integer' }));
            b.push(model.createNode('output', { expression: '"Kaça kadar toplanacak (N):"' }));
            b.push(model.createNode('input', { variable: 'N' }));
            b.push(model.createNode('assign', { variable: 'toplam', expression: '0' }));
            b.push(model.createNode('assign', { variable: 'sayac', expression: '1' }));

            const whileNode = model.createNode('while', {
                expression: 'sayac <= N',
                body: [
                    model.createNode('assign', { variable: 'toplam', expression: 'toplam + sayac' }),
                    model.createNode('assign', { variable: 'sayac', expression: 'sayac + 1' })
                ]
            });
            b.push(whileNode);
            b.push(model.createNode('output', { expression: '"1\'den " & N & "\'e kadar olan sayıların toplamı: " & toplam' }));
        }
    },
    {
        title: "4. Sayı Sayacı (İçin / For Döngüsü)",
        description: "For döngüsü ile 1'den 10'a kadar sayıları ekrana yazar.",
        setup: (model) => {
            model.reset();
            const b = model.currentBody;
            b.push(model.createNode('declare', { name: 'i', dataType: 'Integer' }));
            b.push(model.createNode('output', { expression: '"1 ile 10 arasındaki sayılar listeleniyor:"' }));

            const forNode = model.createNode('for', {
                variable: 'i',
                start: '1',
                end: '10',
                step: '1',
                direction: 'inc',
                body: [
                    model.createNode('output', { expression: '"Sayı: " & i' })
                ]
            });
            b.push(forNode);
            b.push(model.createNode('output', { expression: '"Sayma işlemi bitti."' }));
        }
    },
    {
        title: "5. Not Hesaplama ve Durum (Ortalama)",
        description: "Vize (%40) ve Final (%60) notuna göre ortalama hesaplar ve GEÇTİ/KALDI yazar.",
        setup: (model) => {
            model.reset();
            const b = model.currentBody;
            b.push(model.createNode('declare', { name: 'vize, final', dataType: 'Integer' }));
            b.push(model.createNode('declare', { name: 'ortalama', dataType: 'Real' }));
            b.push(model.createNode('output', { expression: '"Vize notunu giriniz:"' }));
            b.push(model.createNode('input', { variable: 'vize' }));
            b.push(model.createNode('output', { expression: '"Final notunu giriniz:"' }));
            b.push(model.createNode('input', { variable: 'final' }));
            b.push(model.createNode('assign', { variable: 'ortalama', expression: '(vize * 0.4) + (final * 0.6)' }));
            b.push(model.createNode('output', { expression: '"Yıl sonu ortalamanız: " & ortalama' }));

            const ifNode = model.createNode('if', {
                expression: 'ortalama >= 50',
                then: [
                    model.createNode('output', { expression: '"Tebrikler, Dersi GEÇTİNİZ!"' })
                ],
                else: [
                    model.createNode('output', { expression: '"Üzgünüm, Dersten KALDINIZ."' })
                ]
            });
            b.push(ifNode);
        }
    },
    {
        title: "6. Fonksiyon Örneği (KareAl Alt Programı)",
        description: "Özel bir 'KareAl' fonksiyonu tanımlayıp Ana Program içerisinden çağırır.",
        setup: (model) => {
            model.reset();

            // 1. Create Custom Function: KareAl(x: Integer) -> Integer (sonuc)
            const fnKare = model.addFunction("KareAl", "Integer", "sonuc", [
                { name: "x", type: "Integer" }
            ]);
            fnKare.body.push(model.createNode('assign', { variable: 'sonuc', expression: 'x * x' }));

            // 2. Setup Main Program
            model.selectFunction("Main");
            const b = model.currentBody;
            b.push(model.createNode('declare', { name: 'sayi, karesi', dataType: 'Integer' }));
            b.push(model.createNode('output', { expression: '"Karesi alınacak sayıyı giriniz:"' }));
            b.push(model.createNode('input', { variable: 'sayi' }));
            b.push(model.createNode('assign', { variable: 'karesi', expression: 'KareAl(sayi)' }));
            b.push(model.createNode('output', { expression: 'sayi & " sayısının karesi: " & karesi' }));
        }
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Examples };
}
