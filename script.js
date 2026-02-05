const canvas = document.getElementById('financeChart').getContext('2d');
let myChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
        labels: ['Essencial', 'Lazer', 'Saúde', 'Outros'],
        datasets: [{
            data: [0, 0, 0, 0],
            backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#f472b6'],
            borderWidth: 0
        }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '85%' }
});

function showPage(idx) {
    const pages = [
        document.getElementById('page-finance'), 
        document.getElementById('page-irpf'), 
        document.getElementById('page-history'),
        document.getElementById('page-dividend'),
        document.getElementById('page-overtime'),
        document.getElementById('page-installment')
    ];
    const titles = ["Painel de Inteligência Financeira", "Simulador IRPF 2026", "Poder de Compra Histórico", "Calculadora de Dividendos", "Calculadora de Hora Extra", "Parcelamento com Juros"];
    const descs = ["Gestão estratégica e projeções de patrimônio", "Cálculo progressivo de imposto de renda e descontos legais", "Análise da inflação e valor real do dinheiro no tempo", "Simulação de renda passiva", "Cálculo de horas excedentes", "Análise de custo total de financiamento (Tabela Price)"];
    
    const indicator = document.querySelector('.nav-indicator');
    const links = document.querySelectorAll('.nav-link');
    if(indicator) indicator.style.transform = `translateY(${idx * 60}px)`;
    links.forEach(l => l.classList.remove('active'));
    if(links[idx]) links[idx].classList.add('active');

    pages.forEach((p, i) => { if (p) p.style.display = (i === idx) ? 'block' : 'none'; });
    const titleEl = document.getElementById('page-title');
    const descEl = document.getElementById('page-desc');
    if(titleEl) titleEl.innerText = titles[idx];
    if(descEl) descEl.innerText = descs[idx];
}

function updateFinance() {
    const renda = parseFloat(document.getElementById('in-total').value) || 0;
    let gastos = 0, cats = [0, 0, 0, 0];
    document.querySelectorAll('.exp-input').forEach(el => {
        let val = parseFloat(el.value) || 0;
        gastos += val;
        cats[el.dataset.cat] += val;
    });
    const saldo = renda - gastos;
    document.getElementById('res-balance').innerText = saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const perc = renda > 0 ? (gastos / renda) * 100 : 0;
    document.getElementById('meter-fill').style.width = Math.min(perc, 100) + '%';
    if(gastos > 0) document.getElementById('ins-reserva').innerHTML = `💡 Reserva ideal (6 meses): <b>${(gastos * 6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b>`;
    myChart.data.datasets[0].data = cats;
    myChart.update();
    saveState();
}

function updateIRPF() {
    const bruto = parseFloat(document.getElementById('salario-bruto-irpf').value) || 0;
    const dependentes = parseInt(document.getElementById('dependentes-irpf').value) || 0;
    
    let inss = 0;
    if (bruto <= 1500) inss = bruto * 0.075;
    else if (bruto <= 2800) inss = bruto * 0.09;
    else if (bruto <= 4200) inss = bruto * 0.12;
    else inss = Math.min(bruto * 0.14, 950);

    const base = bruto - inss - (dependentes * 189.59);
    
    let aliq = 0, ded = 0;
    if (base > 4664.68) { aliq = 0.275; ded = 896; }
    else if (base > 3751.05) { aliq = 0.225; ded = 662.77; }
    else if (base > 2826.65) { aliq = 0.15; ded = 381.44; }
    else if (base > 2259.20) { aliq = 0.075; ded = 169.44; }

    const imp = Math.max((base * aliq) - ded, 0);
    const liquido = bruto - inss - imp;
    
    document.getElementById('res-liquido-irpf').innerText = liquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const txtImposto = document.getElementById('txt-imposto-irpf');
    if (imp > 0) {
        txtImposto.innerText = `Imposto Retido: ${imp.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
        const perc = (imp / bruto) * 100;
        document.getElementById('meter-fill-irpf').style.width = Math.min(perc * 4, 100) + '%';
    } else {
        txtImposto.innerText = "Isento de Imposto de Renda";
        document.getElementById('meter-fill-irpf').style.width = '0%';
    }

    document.getElementById('detalhes-imposto-irpf').innerHTML = `
        <div class="detail-row"><span class="detail-label">Base de Cálculo:</span><span class="detail-value">${base.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
        <div class="detail-row"><span class="detail-label">INSS Retido:</span><span class="detail-value">${inss.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
        <div class="detail-row"><span class="detail-label">Alíquota:</span><span class="detail-value">${(aliq*100).toFixed(1)}%</span></div>
    `;
    saveState();
}

function selectYear(ano, element) {
    document.querySelectorAll('#page-history .year-option').forEach(opt => opt.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('hist-ano').value = ano;
    updateHistory();
}

function updateHistory() {
    const valorHoje = parseFloat(document.getElementById('hist-valor').value) || 0;
    const ano = document.getElementById('hist-ano').value;
    const inflacao = { "1994": 0.12, "2000": 0.25, "2005": 0.38, "2010": 0.52, "2015": 0.68, "2020": 0.82 };
    const fator = inflacao[ano] || 1;
    const valPassado = valorHoje * fator;
    document.getElementById('res-hist-valor').innerText = valPassado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('meter-fill-hist').style.width = (fator * 100) + '%';
    document.getElementById('detalhes-historico').innerHTML = `<div class="detail-row"><span class="detail-label">Inflação Acumulada:</span><span class="detail-value">~${((1/fator - 1)*100).toFixed(0)}%</span></div>`;
    saveState();
}

function updateDividends() {
    const inv = parseFloat(document.getElementById('div-investido').value) || 0;
    const yld = parseFloat(document.getElementById('div-yield').value) || 0;
    const mensal = (inv * (yld/100)) / 12;
    document.getElementById('res-div-mensal').innerText = mensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const prog = Math.min((mensal / 1412) * 100, 100);
    document.getElementById('meter-fill-div').style.width = prog + '%';
    document.getElementById('detalhes-dividendos').innerHTML = `<div class="detail-row"><span class="detail-label">Renda Anual:</span><span class="detail-value">${(mensal*12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>`;
    saveState();
}

function selectOvertimePerc(val, element) {
    document.querySelectorAll('#page-overtime .year-option').forEach(opt => opt.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('over-perc').value = val;
    updateOvertime();
}

function updateOvertime() {
    const sal = parseFloat(document.getElementById('over-salario').value) || 0;
    const jor = parseFloat(document.getElementById('over-jornada').value) || 220;
    const hrs = parseFloat(document.getElementById('over-horas').value) || 0;
    const prc = parseFloat(document.getElementById('over-perc').value) || 50;
    const vExtra = (sal / jor) * (1 + (prc/100));
    const total = vExtra * hrs;
    document.getElementById('res-over-total').innerText = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('meter-fill-over').style.width = Math.min((total/sal)*100, 100) + '%';
    document.getElementById('detalhes-overtime').innerHTML = `<div class="detail-row"><span class="detail-label">Valor da Hora Extra:</span><span class="detail-value">${vExtra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>`;
    saveState();
}

function updateInstallment() {
    const val = parseFloat(document.getElementById('inst-valor').value) || 0;
    const par = parseInt(document.getElementById('inst-parcelas').value) || 1;
    const juros = (parseFloat(document.getElementById('inst-juros').value) || 0) / 100;
    let pmt = val / par;
    if(juros > 0) pmt = val * ( (juros * Math.pow(1 + juros, par)) / (Math.pow(1 + juros, par) - 1) );
    document.getElementById('res-inst-mensal').innerText = pmt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const total = pmt * par;
    document.getElementById('meter-fill-inst').style.width = Math.min(((total-val)/val)*100, 100) + '%';
    document.getElementById('detalhes-installment').innerHTML = `<div class="detail-row"><span class="detail-label">Total Pago:</span><span class="detail-value">${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div><div class="detail-row"><span class="detail-label">Juros:</span><span class="detail-value">${(total - val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>`;
    saveState();
}

function saveState() {
    const state = {};
    document.querySelectorAll('input, select').forEach(i => state[i.id] = i.value);
    localStorage.setItem('lifeStats_v_ultra_final', JSON.stringify(state));
}

function clearData() { if(confirm("Zerar tudo?")) { localStorage.clear(); location.reload(); } }

document.querySelectorAll('input').forEach(i => i.addEventListener('input', () => {
    updateFinance(); updateIRPF(); updateHistory(); updateDividends(); updateOvertime(); updateInstallment();
}));

window.onload = () => {
    const saved = JSON.parse(localStorage.getItem('lifeStats_v_ultra_final'));
    if(saved) {
        Object.keys(saved).forEach(k => { if(document.getElementById(k)) document.getElementById(k).value = saved[k]; });
        updateFinance(); updateIRPF(); updateHistory(); updateDividends(); updateOvertime(); updateInstallment();
    }
};

const themeBtn = document.getElementById('theme-toggle');
themeBtn.onclick = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
};