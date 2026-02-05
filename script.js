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
    
    const indicator = document.querySelector('.nav-indicator');
    const links = document.querySelectorAll('.nav-link');
    if(indicator) indicator.style.transform = `translateY(${idx * 60}px)`;
    links.forEach(l => l.classList.remove('active'));
    if(links[idx]) links[idx].classList.add('active');

    pages.forEach((p, i) => { if (p) p.style.display = (i === idx) ? 'block' : 'none'; });
    const titleEl = document.getElementById('page-title');
    if(titleEl) titleEl.innerText = titles[idx];
}

function updateFinance() {
    const renda = parseFloat(document.getElementById('in-total').value) || 0;
    let gastos = 0, cats = [0, 0, 0, 0];
    document.querySelectorAll('.exp-input').forEach(el => {
        let val = parseFloat(el.value) || 0;
        gastos += val;
        cats[parseInt(el.dataset.cat)] += val;
    });
    
    const saldo = renda - gastos;
    document.getElementById('res-balance').innerText = saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const perc = renda > 0 ? (gastos / renda) * 100 : 0;
    document.getElementById('meter-fill').style.width = Math.min(perc, 100) + '%';
    document.getElementById('health-txt').innerText = `Comprometimento: ${perc.toFixed(1)}%`;
    
    if(gastos > 0) {
        document.getElementById('ins-reserva').innerHTML = `💡 Reserva ideal (6 meses): <b>${(gastos * 6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b>`;
    }

    // ACÚMULO NO TEMPO (FIX)
    const projCont = document.getElementById('proj-container');
    projCont.innerHTML = "";
    if(saldo > 0) {
        [1, 5, 10, 20].forEach(ano => {
            let total = saldo * 12 * ano;
            projCont.innerHTML += `<div class="proj-item"><small>${ano} Ano(s)</small><strong>${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>`;
        });
    } else {
        projCont.innerHTML = "<p style='font-size:0.8rem; color:var(--text-dim)'>Saldo insuficiente para projeção.</p>";
    }

    // PODER DE COMPRA (FIX)
    const insCompra = document.getElementById('ins-compra');
    if(renda > 0) {
        const p1994 = renda * 0.12;
        insCompra.innerText = `O seu salário hoje equivaleria a ${p1994.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em 1994.`;
    }

    myChart.data.datasets[0].data = cats;
    myChart.update();
    saveState();
}

function updateIRPF() {
    const bruto = parseFloat(document.getElementById('salario-bruto-irpf').value) || 0;
    const dependentes = parseInt(document.getElementById('dependentes-irpf').value) || 0;
    let inss = Math.min(bruto * 0.11, 950);
    const base = bruto - inss - (dependentes * 189.59);
    let aliq = 0, ded = 0;
    if (base > 4664) { aliq = 0.275; ded = 896; }
    else if (base > 3751) { aliq = 0.225; ded = 662; }
    else if (base > 2826) { aliq = 0.15; ded = 381; }
    else if (base > 2259) { aliq = 0.075; ded = 169; }
    const imp = Math.max((base * aliq) - ded, 0);
    document.getElementById('res-liquido-irpf').innerText = (bruto - inss - imp).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('txt-imposto-irpf').innerText = imp > 0 ? `Retenção de ${imp.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : "Isento de IRPF";
    document.getElementById('meter-fill-irpf').style.width = Math.min((imp/bruto)*400 || 0, 100) + '%';
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
    document.getElementById('detalhes-historico').innerHTML = `<div class="detail-row"><span class="detail-label">Valor Corrigido:</span><span class="detail-value">${valPassado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>`;
    saveState();
}

function updateDividends() {
    const inv = parseFloat(document.getElementById('div-investido').value) || 0;
    const yld = parseFloat(document.getElementById('div-yield').value) || 0;
    const mensal = (inv * (yld/100)) / 12;
    document.getElementById('res-div-mensal').innerText = mensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('meter-fill-div').style.width = Math.min((mensal/2000)*100, 100) + '%';
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
    document.getElementById('detalhes-installment').innerHTML = `<div class="detail-row"><span class="detail-label">Total a Prazo:</span><span class="detail-value">${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>`;
    saveState();
}

function saveState() {
    const state = {};
    document.querySelectorAll('input').forEach(i => state[i.id] = i.value);
    localStorage.setItem('lifeStats_v_final_secure', JSON.stringify(state));
}

function clearData() { if(confirm("Zerar tudo?")) { localStorage.clear(); location.reload(); } }

document.querySelectorAll('input').forEach(i => i.addEventListener('input', () => {
    updateFinance(); updateIRPF(); updateHistory(); updateDividends(); updateOvertime(); updateInstallment();
}));

window.onload = () => {
    const saved = JSON.parse(localStorage.getItem('lifeStats_v_final_secure'));
    if(saved) {
        Object.keys(saved).forEach(k => { if(document.getElementById(k)) document.getElementById(k).value = saved[k]; });
        updateFinance(); updateIRPF(); updateHistory(); updateDividends(); updateOvertime(); updateInstallment();
    }
};

document.getElementById('theme-toggle').onclick = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
};