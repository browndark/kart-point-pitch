// Script para converter o pitch website para PDF
// Requer: npm install puppeteer

const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  try {
    console.log('🎮 Convertendo Kart Point Pitch para PDF...');
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Aguarda a página carregar completamente
    await page.goto('https://browndark.github.io/kart-point-pitch/', {
      waitUntil: 'networkidle0'
    });

    // Aguarda todos os elementos carregarem
    await page.waitForSelector('body');

    // Gera o PDF
    const pdfPath = path.join(__dirname, 'Kart-Point-Pitch.pdf');
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    });

    console.log('✅ PDF gerado com sucesso!');
    console.log(`📄 Arquivo: ${pdfPath}`);

    await browser.close();
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
  }
})();
